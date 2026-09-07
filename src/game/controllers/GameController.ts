import AddPlayerAction from "../actions/AddPlayerAction";
import MovePlayerAction from "../actions/MovePlayerAction";
import SetPlayerReadyAction from "../actions/SetPlayerReadyAction";
import RoomController, { type RoomJoined, type RoomPlayerType } from "./RoomController";
import type GameStateChange from "../events/GameStateChange";
import type GameStatusChange from "../events/GameStatusChange";
import type GameState from "../domain/GameState";
import type { GameStateType } from "../domain/GameStateType";
import type PlayerState from "../domain/PlayerState";
import GameService from "../services/GameService";
import Observable, { type ObservableListener } from "../../lib/common/Observable";

export default class GameController {

  // singleton
  // ---------------------------------------------
  private static instance: GameController | undefined;
  static getInstance(): GameController {
    return this.instance ??= new GameController();
  }

  // actions and services
  // ---------------------------------------------
  private readonly roomController = new RoomController();
  public readonly gameService = new GameService();
  public readonly actions = {
    addPlayer: new AddPlayerAction(this.gameService),
    movePlayer: new MovePlayerAction(this.gameService),
    setPlayerReady: new SetPlayerReadyAction(this.gameService),
  };

  // observables
  // ---------------------------------------------
  private readonly gameStateChanges = new Observable<GameStateChange>();
  private readonly gameStatusChanges = new Observable<GameStatusChange>();
  private readonly playerJoinRoom = new Observable<RoomJoined>();


  // constructors
  // ---------------------------------------------

  private constructor() {
    this.gameService.onGameStateChange((event) => {
      this.gameStateChanges.emit(event);
      if (this.roomController.isHost) {
        this.roomController.sendState(this.serializeState(event.state));
      }
    });
    this.gameService.onGameStatusChange((event) => this.gameStatusChanges.emit(event));
    this.roomController.onPlayerJoined((event) => {
      this.actions.addPlayer.execute(event.clientId);
      if (!event.isLocal) {
        this.roomController.sendPlayers(event.clientId, Array.from(this.gameService.state.players.keys()));
      }
      this.playerJoinRoom.emit(event);
    });
    this.roomController.onPlayersReceived((playerIds) => {
      const players = new Map<string, PlayerState>();
      for (const playerId of playerIds) {
        const player = this.gameService.getPlayer(playerId) ?? {
          id: playerId,
          hp: 100,
          position: { x: 0, y: 0 },
          ready: false,
        };
        players.set(playerId, player);
      }
      this.gameService.setPlayers(players);
    });
    this.roomController.onStateReceived((state) => this.applyState(state));
    this.roomController.onPlayerReady((playerId) => {
      if (this.roomController.isHost) {
        this.actions.setPlayerReady.execute(playerId);
      }
    });
  }

  // methods
  // ---------------------------------------------

  public onGameStateChange(listener: ObservableListener<GameStateChange>): () => void {
    return this.gameStateChanges.subscribe(listener);
  }

  public onGameStatusChange(listener: ObservableListener<GameStatusChange>): () => void {
    return this.gameStatusChanges.subscribe(listener);
  }

  public joinRoom(roomCode: string, playerType: RoomPlayerType): boolean {
    return this.roomController.joinRoom(roomCode, playerType);
  }

  public hostRoom(): string {
    return this.roomController.hostRoom();
  }

  public setLocalPlayerReady(): boolean {
    if (this.roomController.isHost) {
      const playerId = this.roomController.localPlayerId;
      return playerId ? this.actions.setPlayerReady.execute(playerId) : false;
    }

    return this.roomController.sendReady();
  }

  public onPlayerJoinRoom(listener: ObservableListener<RoomJoined>): () => void {
    return this.playerJoinRoom.subscribe(listener);
  }

  private serializeState(state: GameState): string {
    return JSON.stringify({
      status: state.status,
      players: Array.from(state.players.values()),
    });
  }

  private applyState(serializedState: string): void {
    try {
      const value: unknown = JSON.parse(serializedState);
      if (!this.isSerializedState(value)) {
        return;
      }

      const players = new Map<string, PlayerState>();
      for (const player of value.players) {
        players.set(player.id, player);
      }
      this.gameService.setState({ status: value.status, players, enemies: new Map() });
    } catch {
      // Ignore malformed state messages from the relay.
    }
  }

  private isSerializedState(value: unknown): value is { status: GameStateType; players: PlayerState[] } {
    if (!value || typeof value !== "object") {
      return false;
    }

    const state = value as { status?: unknown; players?: unknown };
    return (state.status === "lobby" || state.status === "game")
      && Array.isArray(state.players)
      && state.players.every((player) => this.isPlayerState(player));
  }

  private isPlayerState(value: unknown): value is PlayerState {
    if (!value || typeof value !== "object") {
      return false;
    }

    const player = value as { id?: unknown; hp?: unknown; ready?: unknown; position?: { x?: unknown; y?: unknown } };
    return typeof player.id === "string"
      && typeof player.hp === "number"
      && Number.isFinite(player.hp)
      && typeof player.ready === "boolean"
      && typeof player.position?.x === "number"
      && Number.isFinite(player.position.x)
      && typeof player.position?.y === "number"
      && Number.isFinite(player.position.y);
  }
}
