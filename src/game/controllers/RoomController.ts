import type GameState from "../domain/GameState";
import type Enemy from "../domain/Enemy";
import type Player from "../domain/Player";
import SocketController, { type SocketEvent } from "../../lib/controllers/SocketController";

const RELAY_URL = "wss://relay.js13kgames.com/rainbow-renegades";
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_PLAYERS = 4;
const ENEMY_AGGRO_DISTANCE = 32;
const ENEMY_RELEASE_DISTANCE = 40;
const ENEMY_SPEED = 45;

export type RoomPlayer = Player;

interface PendingMove {
  sequence: number;
  x: number;
  y: number;
}

export type RoomEvent =
  | { type: "ready" }
  | { type: "players" }
  | { type: "started" }
  | { type: "rejected"; reason: "full" | "started" }
  | { type: "host-left" }
  | { type: "error" };

export default class RoomController {
  private static instance: RoomController | undefined;
  readonly socket = new SocketController();
  private readonly listeners = new Set<(event: RoomEvent) => void>();
  private readonly stateListeners = new Set<(state: GameState) => void>();
  private readonly playerMap = new Map<string, Player>();
  private readonly enemyMap = new Map<string, Enemy>();
  private readonly enemyTargets = new Map<string, string>();
  private role: "host" | "guest" | undefined;
  private clientId: string | undefined;
  private hostId: string | undefined;
  private roomCode: string | undefined;
  private started = false;
  private joinRequested = false;
  private inputSequence = 0;
  private pendingMoves: PendingMove[] = [];
  private readonly acknowledgements = new Map<string, number>();

  static getInstance(): RoomController {
    return this.instance ??= new RoomController();
  }

  static destroyInstance(): void {
    this.instance?.destroy();
    this.instance = undefined;
  }

  private constructor() {
    this.socket.on(this.handleSocketEvent);
  }

  get code(): string | undefined {
    return this.roomCode;
  }

  get isHost(): boolean {
    return this.role === "host";
  }

  get localPlayerId(): string | undefined {
    return this.clientId;
  }

  get players(): readonly RoomPlayer[] {
    return this.state.players;
  }

  get state(): GameState {
    return {
      players: Array.from(this.playerMap.values(), this.copyPlayer),
      enemies: Array.from(this.enemyMap.values(), this.copyEnemy),
    };
  }

  on(listener: (event: RoomEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStateChange(listener: (state: GameState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  create(): void {
    const code = this.generateCode();
    console.log(`Created room: ${code}`);
    this.open(code, "host");
  }

  join(code: string): void {
    const normalizedCode = code.trim().toUpperCase();
    if (!new RegExp(`^[${ROOM_CODE_ALPHABET}]{6}$`).test(normalizedCode)) {
      this.emit({ type: "error" });
      return;
    }

    this.open(normalizedCode, "guest");
  }

  start(): void {
    if (!this.isHost || !this.clientId || this.started) {
      return;
    }

    this.started = true;
    this.enemyMap.set("enemy-1", { id: "enemy-1", position: { x: 42, y: 42 } });
    this.enemyMap.set("enemy-2", { id: "enemy-2", position: { x: 82, y: 82 } });
    this.broadcastState();
    this.socket.send("s");
    this.emit({ type: "started" });
  }

  move(x: number, y: number): void {
    if (!this.clientId || !Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    const sequence = this.isHost ? 0 : ++this.inputSequence;
    const input = `i|${this.clientId}|${sequence}|${x}|${y}`;
    if (this.isHost) {
      if (this.socket.send(input)) {
        this.applyInput(this.clientId, sequence, x, y);
      }
    } else if (this.hostId) {
      if (this.socket.sendTo(this.hostId, input)) {
        this.pendingMoves.push({ sequence, x, y });
        this.applyPrediction(x, y);
      }
    }
  }

  update(delta: number): void {
    if (!this.isHost || !this.started || !Number.isFinite(delta)) {
      return;
    }

    const distanceToMove = ENEMY_SPEED * Math.min(delta, 50) / 1000;
    let stateChanged = false;

    for (const enemy of this.enemyMap.values()) {
      const target = this.getEnemyTarget(enemy);
      if (!target) {
        continue;
      }

      const x = target.position.x - enemy.position.x;
      const y = target.position.y - enemy.position.y;
      const distance = Math.hypot(x, y);
      if (distance === 0) {
        continue;
      }

      const movement = Math.min(distanceToMove, distance);
      enemy.position.x += x / distance * movement;
      enemy.position.y += y / distance * movement;
      stateChanged = true;
    }

    if (stateChanged) {
      this.broadcastState();
    }
  }

  leave(): void {
    this.socket.disconnect();
    this.reset();
  }

  destroy(): void {
    this.socket.destroy();
    this.listeners.clear();
    this.stateListeners.clear();
    this.reset();
  }

  private open(code: string, role: "host" | "guest"): void {
    this.leave();
    this.roomCode = code;
    this.role = role;
    this.socket.connect(`${RELAY_URL}/${code}`);
  }

  private readonly handleSocketEvent = (event: SocketEvent): void => {
    if (event.type === "id") {
      this.clientId = event.clientId;
      if (this.isHost) {
        this.hostId = event.clientId;
        this.playerMap.set(event.clientId, this.createPlayer(event.clientId));
        this.emit({ type: "ready" });
        this.emit({ type: "players" });
        this.emitStateChange();
      } else {
        this.requestJoin();
      }
    } else if (event.type === "connect" && this.isHost && this.clientId) {
      this.socket.sendTo(event.clientId, `h|${this.clientId}`);
    } else if (event.type === "disconnect") {
      this.handleDisconnect(event.clientId);
    } else if (event.type === "message") {
      this.handleMessage(event.data);
    } else if (event.type === "error") {
      this.emit({ type: "error" });
    }
  };

  private handleMessage(data: string): void {
    const separator = data.indexOf("|");
    const type = separator === -1 ? data : data.slice(0, separator);
    const value = separator === -1 ? "" : data.slice(separator + 1);

    if (type === "h" && value && !this.isHost) {
      this.hostId = value;
      this.requestJoin();
    } else if (type === "j" && value && this.isHost) {
      this.acceptGuest(value);
    } else if (type === "a" && value && !this.isHost) {
      this.applySerializedState(value);
      this.emit({ type: "ready" });
    } else if (type === "g" && value && !this.isHost) {
      this.applySerializedState(value);
    } else if (type === "i" && value && this.isHost) {
      const [id, sequence, x, y] = value.split("|");
      if (id !== this.clientId) {
        this.applyInput(id, Number(sequence), Number(x), Number(y));
      }
    } else if (type === "s") {
      this.started = true;
      this.emit({ type: "started" });
    } else if (type === "r" && (value === "full" || value === "started")) {
      this.emit({ type: "rejected", reason: value });
      this.leave();
    }
  }

  private acceptGuest(id: string): void {
    if (this.started) {
      this.socket.sendTo(id, "r|started");
      return;
    }

    if (!this.playerMap.has(id) && this.playerMap.size >= MAX_PLAYERS) {
      this.socket.sendTo(id, "r|full");
      return;
    }

    if (!this.playerMap.has(id)) {
      this.playerMap.set(id, this.createPlayer(id));
    }
    this.socket.sendTo(id, `a|${this.serializeState()}`);
    this.broadcastState();
  }

  private applyInput(id: string | undefined, sequence: number, x: number, y: number): void {
    const player = id ? this.playerMap.get(id) : undefined;
    if (!player || !Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    player.position.x += Math.max(-1, Math.min(1, x)) * 2;
    player.position.y += Math.max(-1, Math.min(1, y)) * 2;
    if (sequence > 0 && id) {
      this.acknowledgements.set(id, sequence);
    }
    this.broadcastState();
  }

  private applyPrediction(x: number, y: number): void {
    const player = this.clientId ? this.playerMap.get(this.clientId) : undefined;
    if (!player) {
      return;
    }

    player.position.x += Math.max(-1, Math.min(1, x)) * 2;
    player.position.y += Math.max(-1, Math.min(1, y)) * 2;
    this.emitStateChange();
  }

  private broadcastState(): void {
    this.socket.send(`g|${this.serializeState()}`);
    this.emit({ type: "players" });
    this.emitStateChange();
  }

  private applySerializedState(serializedState: string): void {
    const [players = "", enemies = "", acknowledgements = ""] = serializedState.split("|");
    const state = {
      players: this.parseEntities(players),
      enemies: this.parseEntities(enemies),
    };

    this.playerMap.clear();
    this.enemyMap.clear();
    for (const player of state.players) {
      this.playerMap.set(player.id, player);
    }
    for (const enemy of state.enemies) {
      this.enemyMap.set(enemy.id, enemy);
    }
    this.reconcilePrediction(this.parseAcknowledgements(acknowledgements));
    this.emit({ type: "players" });
    this.emitStateChange();
  }

  private serializeState(): string {
    return `${this.serializeEntities(this.playerMap.values())}|${this.serializeEntities(this.enemyMap.values())}|${this.serializeAcknowledgements()}`;
  }

  private serializeEntities(entities: Iterable<Player | Enemy>): string {
    return Array.from(entities, ({ id, position }) => `${id},${position.x},${position.y}`).join(";");
  }

  private parseEntities(value: string): Array<Player | Enemy> {
    if (!value) {
      return [];
    }

    return value.split(";").flatMap((serializedEntity) => {
      const [id, x, y] = serializedEntity.split(",");
      const positionX = Number(x);
      const positionY = Number(y);
      return id && Number.isFinite(positionX) && Number.isFinite(positionY)
        ? [{ id, position: { x: positionX, y: positionY } }]
        : [];
    });
  }

  private serializeAcknowledgements(): string {
    return Array.from(this.acknowledgements, ([id, sequence]) => `${id},${sequence}`).join(";");
  }

  private parseAcknowledgements(value: string): Map<string, number> {
    const acknowledgements = new Map<string, number>();
    for (const serializedAcknowledgement of value.split(";")) {
      const [id, sequence] = serializedAcknowledgement.split(",");
      const parsedSequence = Number(sequence);
      if (id && Number.isFinite(parsedSequence)) {
        acknowledgements.set(id, parsedSequence);
      }
    }
    return acknowledgements;
  }

  private reconcilePrediction(acknowledgements: Map<string, number>): void {
    const acknowledgedSequence = this.clientId ? acknowledgements.get(this.clientId) : undefined;
    if (acknowledgedSequence !== undefined) {
      this.pendingMoves = this.pendingMoves.filter((move) => move.sequence > acknowledgedSequence);
    }

    const player = this.clientId ? this.playerMap.get(this.clientId) : undefined;
    if (!player) {
      return;
    }

    for (const move of this.pendingMoves) {
      player.position.x += move.x * 2;
      player.position.y += move.y * 2;
    }
  }

  private handleDisconnect(id: string): void {
    if (!this.isHost && id === this.hostId) {
      this.emit({ type: "host-left" });
      this.leave();
      return;
    }

    if (this.playerMap.delete(id)) {
      if (this.isHost) {
        this.broadcastState();
      } else {
        this.emit({ type: "players" });
        this.emitStateChange();
      }
    }
  }

  private getEnemyTarget(enemy: Enemy): Player | undefined {
    const currentTarget = this.enemyTargets.get(enemy.id);
    const currentPlayer = currentTarget ? this.playerMap.get(currentTarget) : undefined;

    if (currentPlayer && this.getDistance(enemy, currentPlayer) <= ENEMY_RELEASE_DISTANCE) {
      return currentPlayer;
    }

    let closestPlayer: Player | undefined;
    let closestDistance = ENEMY_AGGRO_DISTANCE;
    for (const player of this.playerMap.values()) {
      const distance = this.getDistance(enemy, player);
      if (distance <= closestDistance) {
        closestPlayer = player;
        closestDistance = distance;
      }
    }

    if (closestPlayer) {
      this.enemyTargets.set(enemy.id, closestPlayer.id);
      return closestPlayer;
    }

    this.enemyTargets.delete(enemy.id);
    return undefined;
  }

  private getDistance(first: Enemy, second: Player): number {
    return Math.hypot(
      second.position.x - first.position.x,
      second.position.y - first.position.y,
    );
  }

  private createPlayer(id: string): Player {
    let hash = 0;
    for (let index = 0; index < id.length; index += 1) {
      hash = (hash * 31 + id.charCodeAt(index)) | 0;
    }

    return {
      id,
      position: {
        x: 20 + ((hash >>> 0) % 80),
        y: 20 + ((hash >>> 8) % 80),
      },
    };
  }

  private generateCode(): string {
    const values = crypto.getRandomValues(new Uint8Array(6));
    let code = "";
    for (const value of values) {
      code += ROOM_CODE_ALPHABET[value % ROOM_CODE_ALPHABET.length];
    }
    return code;
  }

  private requestJoin(): void {
    if (!this.clientId || !this.hostId || this.joinRequested) {
      return;
    }

    this.joinRequested = this.socket.sendTo(this.hostId, `j|${this.clientId}`);
  }

  private reset(): void {
    this.role = undefined;
    this.clientId = undefined;
    this.hostId = undefined;
    this.roomCode = undefined;
    this.started = false;
    this.joinRequested = false;
    this.inputSequence = 0;
    this.pendingMoves = [];
    this.acknowledgements.clear();
    this.playerMap.clear();
    this.enemyMap.clear();
    this.enemyTargets.clear();
  }

  private emitStateChange(): void {
    const state = this.state;
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  private emit(event: RoomEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private readonly copyPlayer = (player: Player): Player => ({
    id: player.id,
    position: { ...player.position },
  });

  private readonly copyEnemy = (enemy: Enemy): Enemy => ({
    id: enemy.id,
    position: { ...enemy.position },
  });
}
