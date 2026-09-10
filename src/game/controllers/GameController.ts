import GameServer from "./GameServer";
import RoomController, { type RoomJoined, type RoomPlayerType } from "./RoomController";
import type GameStateChange from "../events/GameStateChange";
import type GameStatusChange from "../events/GameStatusChange";
import type GameState from "../domain/GameState";
import type { GameStateType } from "../domain/GameStateType";
import type { MoveType } from "../domain/MoveType";
import type EnemyState from "../domain/EnemyState";
import type CollectibleState from "../domain/CollectibleState";
import type DoorState from "../domain/DoorState";
import { DOOR_GEM_COLORS, isGemColor } from "../domain/GemColor";
import type PlayerState from "../domain/PlayerState";
import type SolidState from "../domain/SolidState";
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
    this.roomController.onInteractReceived((playerId) => this.gameServer?.interactPlayer(playerId));
  }

  // methods
  // ---------------------------------------------

  public onGameStateChange(listener: ObservableListener<GameStateChange>): () => void {
    const unsubscribe = this.gameStateChanges.subscribe(listener);
    listener({
      state: {
        status: this.gameService.state.status,
        terrainSeed: this.gameService.state.terrainSeed,
        players: new Map(this.gameService.state.players),
        enemies: new Map(this.gameService.state.enemies),
        solids: new Map(this.gameService.state.solids),
        collectibles: new Map(this.gameService.state.collectibles),
        doors: new Map(this.gameService.state.doors),
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

  public interactLocalPlayer(): boolean {
    const playerId = this.localPlayerId;
    if (!playerId) {
      return false;
    }

    return this.roomController.isHost
      ? this.gameServer?.interactPlayer(playerId) ?? false
      : this.roomController.sendInteract();
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
      terrainSeed: state.terrainSeed,
      players: Array.from(state.players.values()),
      enemies: Array.from(state.enemies.values()),
      solids: Array.from(state.solids.values()),
      collectibles: Array.from(state.collectibles.values()),
      doors: Array.from(state.doors.values()),
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
      const enemies = new Map<string, EnemyState>();
      for (const enemy of value.enemies) {
        enemies.set(enemy.id, enemy);
      }
      const solids = new Map<string, SolidState>();
      for (const solid of value.solids) {
        solids.set(solid.id, solid);
      }
      const collectibles = new Map<string, CollectibleState>();
      for (const collectible of value.collectibles) {
        collectibles.set(collectible.id, collectible);
      }
      const doors = new Map<string, DoorState>();
      for (const door of value.doors) {
        doors.set(door.id, door);
      }
      this.gameService.setState({ status: value.status, terrainSeed: value.terrainSeed, players, enemies, solids, collectibles, doors });
    } catch {
      // Ignore malformed state messages from the relay.
    }
  }

  private isSerializedState(value: unknown): value is { status: GameStateType; terrainSeed: number; players: PlayerState[]; enemies: EnemyState[]; solids: SolidState[]; collectibles: CollectibleState[]; doors: DoorState[] } {
    if (!value || typeof value !== "object") {
      return false;
    }

    const state = value as { status?: unknown; terrainSeed?: unknown; players?: unknown; enemies?: unknown; solids?: unknown; collectibles?: unknown; doors?: unknown };
    const valid = (state.status === "lobby" || state.status === "game")
      && typeof state.terrainSeed === "number"
      && Number.isInteger(state.terrainSeed)
      && Array.isArray(state.players)
      && state.players.every((player) => this.isPlayerState(player))
      && Array.isArray(state.enemies)
      && state.enemies.every((enemy) => this.isEnemyState(enemy))
      && Array.isArray(state.solids)
      && state.solids.every((solid) => this.isSolidState(solid))
      && Array.isArray(state.collectibles)
      && state.collectibles.every((collectible) => this.isCollectibleState(collectible))
      && Array.isArray(state.doors)
      && state.doors.every((door) => this.isDoorState(door));
    if (!valid) {
      return false;
    }

    const gems = [
      ...(state.players as PlayerState[]).flatMap((player) => player.gems),
      ...(state.collectibles as CollectibleState[]).map((collectible) => collectible.color),
      ...(state.doors as DoorState[]).flatMap((door) => door.placedGems),
    ];
    return new Set(gems).size === gems.length;
  }

  private isPlayerState(value: unknown): value is PlayerState {
    if (!value || typeof value !== "object") {
      return false;
    }

    const player = value as { id?: unknown; hp?: unknown; ready?: unknown; gems?: unknown; position?: { x?: unknown; y?: unknown } };
    return typeof player.id === "string"
      && typeof player.hp === "number"
      && Number.isFinite(player.hp)
      && typeof player.ready === "boolean"
      && Array.isArray(player.gems)
      && player.gems.every(isGemColor)
      && typeof player.position?.x === "number"
      && Number.isFinite(player.position.x)
      && typeof player.position?.y === "number"
      && Number.isFinite(player.position.y);
  }

  private isSolidState(value: unknown): value is SolidState {
    if (!value || typeof value !== "object") {
      return false;
    }

    const solid = value as { id?: unknown; frame?: unknown; position?: { x?: unknown; y?: unknown } };
    return typeof solid.id === "string"
      && typeof solid.frame === "number"
      && Number.isInteger(solid.frame)
      && solid.frame >= 0
      && typeof solid.position?.x === "number"
      && Number.isFinite(solid.position.x)
      && typeof solid.position?.y === "number"
      && Number.isFinite(solid.position.y);
  }

  private isEnemyState(value: unknown): value is EnemyState {
    if (!value || typeof value !== "object") {
      return false;
    }

    const enemy = value as { id?: unknown; type?: unknown; hp?: unknown; visionRange?: unknown; width?: unknown; height?: unknown; loot?: unknown; position?: { x?: unknown; y?: unknown } };
    return typeof enemy.id === "string"
      && (enemy.type === "beholder" || enemy.type === "boss" || enemy.type === "mole" || enemy.type === "totem")
      && typeof enemy.hp === "number"
      && Number.isFinite(enemy.hp)
      && typeof enemy.visionRange === "number"
      && Number.isFinite(enemy.visionRange)
      && enemy.visionRange >= 0
      && typeof enemy.width === "number"
      && Number.isInteger(enemy.width)
      && enemy.width > 0
      && typeof enemy.height === "number"
      && Number.isInteger(enemy.height)
      && enemy.height > 0
      && (enemy.loot === undefined || isGemColor(enemy.loot))
      && typeof enemy.position?.x === "number"
      && Number.isFinite(enemy.position.x)
      && typeof enemy.position?.y === "number"
      && Number.isFinite(enemy.position.y);
  }

  private isCollectibleState(value: unknown): value is CollectibleState {
    if (!value || typeof value !== "object") {
      return false;
    }

    const collectible = value as { id?: unknown; color?: unknown; position?: { x?: unknown; y?: unknown } };
    return typeof collectible.id === "string"
      && isGemColor(collectible.color)
      && typeof collectible.position?.x === "number"
      && Number.isFinite(collectible.position.x)
      && typeof collectible.position?.y === "number"
      && Number.isFinite(collectible.position.y);
  }

  private isDoorState(value: unknown): value is DoorState {
    if (!value || typeof value !== "object") {
      return false;
    }

    const door = value as { id?: unknown; open?: unknown; placedGems?: unknown; width?: unknown; height?: unknown; position?: { x?: unknown; y?: unknown } };
    return typeof door.id === "string"
      && typeof door.open === "boolean"
      && Array.isArray(door.placedGems)
      && door.placedGems.every((color) => DOOR_GEM_COLORS.includes(color))
      && door.open === (door.placedGems.length === DOOR_GEM_COLORS.length)
      && typeof door.width === "number"
      && Number.isInteger(door.width)
      && door.width > 0
      && typeof door.height === "number"
      && Number.isInteger(door.height)
      && door.height > 0
      && typeof door.position?.x === "number"
      && Number.isFinite(door.position.x)
      && typeof door.position?.y === "number"
      && Number.isFinite(door.position.y);
  }
}
