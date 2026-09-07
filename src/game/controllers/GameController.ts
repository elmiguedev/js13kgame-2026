import GameServer from "./GameServer";
import RoomController, { type RoomJoined, type RoomPlayerType } from "./RoomController";
import type GameStateChange from "../events/GameStateChange";
import type GameStatusChange from "../events/GameStatusChange";
import type GameState from "../domain/GameState";
import type { GameStateType } from "../domain/GameStateType";
import type { MoveType } from "../domain/MoveType";
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
  private gameServer: GameServer | undefined;

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
    });
    this.gameService.onGameStatusChange((event) => this.gameStatusChanges.emit(event));
    this.roomController.onPlayerJoined((event) => {
      if (event.isLocal && event.playerType === "HOST") {
        this.gameServer = new GameServer();
        this.gameServer.onGameStateChange(this.applyHostState);
      } else if (event.isLocal) {
        this.gameServer = undefined;
      }
      this.playerJoinRoom.emit(event);
      if (event.isLocal && event.playerType === "HOST") {
        this.gameServer?.addPlayer(event.clientId);
      } else if (!event.isLocal && this.roomController.isHost) {
        this.gameServer?.addPlayer(event.clientId);
      }
    });
    this.roomController.onStateReceived((state) => this.applyState(state));
    this.roomController.onPlayerReady((playerId) => this.gameServer?.setPlayerReady(playerId));
    this.roomController.onMoveReceived((input) => this.gameServer?.movePlayer(input));
  }

  // methods
  // ---------------------------------------------

  public onGameStateChange(listener: ObservableListener<GameStateChange>): () => void {
    const unsubscribe = this.gameStateChanges.subscribe(listener);
    listener({
      state: {
        status: this.gameService.state.status,
        players: new Map(this.gameService.state.players),
        enemies: new Map(this.gameService.state.enemies),
      },
    });
    return unsubscribe;
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

  public get localPlayerId(): string | undefined {
    return this.roomController.localPlayerId;
  }

  public moveLocalPlayer(direction: MoveType): boolean {
    const playerId = this.localPlayerId;
    if (!playerId) {
      return false;
    }

    if (this.roomController.isHost) {
      return this.gameServer?.movePlayer({ id: playerId, direction }) ?? false;
    }

    return this.roomController.sendMove({ id: playerId, direction });
  }

  public setLocalPlayerReady(): boolean {
    if (this.roomController.isHost) {
      const playerId = this.roomController.localPlayerId;
      return playerId ? this.gameServer?.setPlayerReady(playerId) ?? false : false;
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

  private readonly applyHostState = ({ state }: GameStateChange): void => {
    this.roomController.publishState(this.serializeState(state));
  };

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
