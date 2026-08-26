import type GameState from "../domain/GameState";
import type Enemy from "../domain/Enemy";
import type EnemyTotem from "../domain/EnemyTotem";
import type Player from "../domain/Player";
import SocketController, { type SocketEvent } from "../../lib/controllers/SocketController";

const RELAY_URL = "wss://relay.js13kgames.com/rainbow-renegades";
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_PLAYERS = 4;
const ENEMY_AGGRO_DISTANCE = 100;
const ENEMY_RELEASE_DISTANCE = 150;
const ENEMY_SPEED = 45;
const ATTACK_RANGE = 24;
const PLAYER_SPEED = 90;
const TOTEM_MAX_ENEMIES = 6;
const TOTEM_SPAWN_INTERVAL = 750;
const TOTEM_SPAWN_RADIUS = 28;
const STATE_BROADCAST_INTERVAL = 50;

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
  private readonly totemMap = new Map<string, EnemyTotem>();
  private readonly enemyTargets = new Map<string, string>();
  private readonly playerTargets = new Map<string, { x: number; y: number }>();
  private readonly totemSpawnTimers = new Map<string, number>();
  private role: "host" | "guest" | undefined;
  private clientId: string | undefined;
  private hostId: string | undefined;
  private roomCode: string | undefined;
  private started = false;
  private joinRequested = false;
  private inputSequence = 0;
  private pendingMoves: PendingMove[] = [];
  private readonly acknowledgements = new Map<string, number>();
  private nextEnemyId = 0;
  private stateDirty = false;
  private stateBroadcastTimer = 0;

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
      totems: Array.from(this.totemMap.values(), this.copyTotem),
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
    this.totemMap.set("totem-1", {
      id: "totem-1",
      position: { x: 57, y: 57 },
      maxEnemies: TOTEM_MAX_ENEMIES,
      spawnInterval: TOTEM_SPAWN_INTERVAL,
      spawnRadius: TOTEM_SPAWN_RADIUS,
    });
    this.totemSpawnTimers.set("totem-1", TOTEM_SPAWN_INTERVAL);
    this.totemMap.set("totem-2", {
      id: "totem-2",
      position: { x: 157, y: 305 },
      maxEnemies: TOTEM_MAX_ENEMIES,
      spawnInterval: TOTEM_SPAWN_INTERVAL,
      spawnRadius: TOTEM_SPAWN_RADIUS,
    });
    this.totemSpawnTimers.set("totem-2", TOTEM_SPAWN_INTERVAL);
    this.markStateChanged();
    this.flushState();
    this.socket.send("s");
    this.emit({ type: "started" });
  }

  moveTo(x: number, y: number): void {
    if (!this.clientId || !Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    const sequence = this.isHost ? 0 : ++this.inputSequence;
    const input = `m|${this.clientId}|${sequence}|${x}|${y}`;
    if (this.isHost) {
      if (this.socket.send(input)) {
        this.applyMoveTarget(this.clientId, sequence, x, y);
      }
    } else if (this.hostId) {
      if (this.socket.sendTo(this.hostId, input)) {
        this.pendingMoves.push({ sequence, x, y });
        this.applyMoveTarget(this.clientId, sequence, x, y);
      }
    }
  }

  attack(enemyId: string): void {
    if (!this.clientId || !this.enemyMap.has(enemyId)) {
      return;
    }

    const action = `k|${this.clientId}|${enemyId}`;
    if (this.isHost) {
      if (this.socket.send(action)) {
        this.applyAttack(this.clientId, enemyId);
      }
    } else if (this.hostId) {
      this.socket.sendTo(this.hostId, action);
    }
  }

  update(delta: number): void {
    if (!this.started || !Number.isFinite(delta)) {
      return;
    }

    const clampedDelta = Math.min(delta, 50);
    const movedPlayers = this.updatePlayers(clampedDelta);
    if (!this.isHost) {
      if (movedPlayers) {
        this.emitStateChange();
      }
      return;
    }

    const spawnedEnemies = this.updateTotems(clampedDelta);
    const movedEnemies = this.updateEnemyAI(clampedDelta);
    if (movedPlayers || spawnedEnemies || movedEnemies) {
      this.markStateChanged();
    }

    this.stateBroadcastTimer += clampedDelta;
    if (this.stateDirty && this.stateBroadcastTimer >= STATE_BROADCAST_INTERVAL) {
      this.flushState();
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
    } else if (type === "m" && value && this.isHost) {
      const [id, sequence, x, y] = value.split("|");
      if (id !== this.clientId) {
        this.applyMoveTarget(id, Number(sequence), Number(x), Number(y));
      }
    } else if (type === "k" && value && this.isHost) {
      const [id, enemyId] = value.split("|");
      if (id !== this.clientId) {
        this.applyAttack(id, enemyId);
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
    this.emit({ type: "players" });
    this.markStateChanged();
    this.flushState();
  }

  private applyMoveTarget(id: string | undefined, sequence: number, x: number, y: number): void {
    const player = id ? this.playerMap.get(id) : undefined;
    if (!player || !Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    this.playerTargets.set(player.id, { x, y });
    if (sequence > 0 && id) {
      this.acknowledgements.set(id, sequence);
    }
    if (this.isHost) {
      this.markStateChanged();
    } else {
      this.emitStateChange();
    }
  }

  private applyAttack(playerId: string | undefined, enemyId: string | undefined): void {
    const player = playerId ? this.playerMap.get(playerId) : undefined;
    if (!player || !enemyId) {
      return;
    }

    const enemy = this.enemyMap.get(enemyId);
    const distance = enemy ? this.getDistance(enemy, player) : undefined;
    if (!enemy || distance === undefined || distance > ATTACK_RANGE) {
      return;
    }

    enemy.hp -= 1;
    if (enemy.hp <= 0) {
      this.enemyMap.delete(enemy.id);
      this.enemyTargets.delete(enemy.id);
    }
    this.markStateChanged();
  }

  private markStateChanged(): void {
    this.stateDirty = true;
    this.emitStateChange();
  }

  private flushState(): void {
    this.socket.send(`g|${this.serializeState()}`);
    this.stateDirty = false;
    this.stateBroadcastTimer = 0;
  }

  private applySerializedState(serializedState: string): void {
    const [players = "", enemies = "", totems = "", acknowledgements = ""] = serializedState.split("|");
    const state = {
      players: this.parsePlayers(players),
      enemies: this.parseEnemies(enemies),
      totems: this.parseTotems(totems),
    };

    this.playerMap.clear();
    this.enemyMap.clear();
    this.totemMap.clear();
    this.enemyTargets.clear();
    for (const player of state.players) {
      this.playerMap.set(player.id, player);
    }
    for (const enemy of state.enemies) {
      this.enemyMap.set(enemy.id, enemy);
    }
    for (const totem of state.totems) {
      this.totemMap.set(totem.id, totem);
    }
    for (const id of this.playerTargets.keys()) {
      if (!this.playerMap.has(id)) {
        this.playerTargets.delete(id);
      }
    }
    this.reconcilePrediction(this.parseAcknowledgements(acknowledgements));
    this.emit({ type: "players" });
    this.emitStateChange();
  }

  private serializeState(): string {
    return `${this.serializePlayers()}|${this.serializeEnemies()}|${this.serializeTotems()}|${this.serializeAcknowledgements()}`;
  }

  private serializePlayers(): string {
    return Array.from(this.playerMap.values(), ({ id, hp, position }) => `${id},${position.x},${position.y},${hp}`).join(";");
  }

  private serializeEnemies(): string {
    return Array.from(this.enemyMap.values(), ({ id, totemId, hp, position }) => `${id},${totemId},${position.x},${position.y},${hp}`).join(";");
  }

  private serializeTotems(): string {
    return Array.from(this.totemMap.values(), ({ id, position, maxEnemies, spawnInterval, spawnRadius }) => (
      `${id},${position.x},${position.y},${maxEnemies},${spawnInterval},${spawnRadius}`
    )).join(";");
  }

  private parsePlayers(value: string): Player[] {
    if (!value) {
      return [];
    }

    return value.split(";").flatMap((serializedEntity) => {
      const [id, x, y, hp] = serializedEntity.split(",");
      const positionX = Number(x);
      const positionY = Number(y);
      const health = Number(hp);
      return id && Number.isFinite(positionX) && Number.isFinite(positionY) && Number.isFinite(health)
        ? [{ id, hp: health, position: { x: positionX, y: positionY } }]
        : [];
    });
  }

  private parseEnemies(value: string): Enemy[] {
    if (!value) {
      return [];
    }

    return value.split(";").flatMap((serializedEntity) => {
      const [id, totemId, x, y, hp] = serializedEntity.split(",");
      const positionX = Number(x);
      const positionY = Number(y);
      const health = Number(hp);
      return id && totemId && Number.isFinite(positionX) && Number.isFinite(positionY) && Number.isFinite(health)
        ? [{ id, totemId, hp: health, position: { x: positionX, y: positionY } }]
        : [];
    });
  }

  private parseTotems(value: string): EnemyTotem[] {
    if (!value) {
      return [];
    }

    return value.split(";").flatMap((serializedTotem) => {
      const [id, x, y, maxEnemies, spawnInterval, spawnRadius] = serializedTotem.split(",");
      const positionX = Number(x);
      const positionY = Number(y);
      const max = Number(maxEnemies);
      const interval = Number(spawnInterval);
      const radius = Number(spawnRadius);
      return id && Number.isFinite(positionX) && Number.isFinite(positionY) && Number.isFinite(max)
        && Number.isFinite(interval) && Number.isFinite(radius)
        ? [{ id, position: { x: positionX, y: positionY }, maxEnemies: max, spawnInterval: interval, spawnRadius: radius }]
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

  }

  private handleDisconnect(id: string): void {
    if (!this.isHost && id === this.hostId) {
      this.emit({ type: "host-left" });
      this.leave();
      return;
    }

    if (this.playerMap.delete(id)) {
      this.playerTargets.delete(id);
      if (this.isHost) {
        this.emit({ type: "players" });
        this.markStateChanged();
        this.flushState();
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

  private updateTotems(delta: number): boolean {
    let spawnedEnemies = false;

    for (const totem of this.totemMap.values()) {
      const activeEnemies = this.getTotemEnemyCount(totem.id);
      if (activeEnemies >= totem.maxEnemies) {
        this.totemSpawnTimers.set(totem.id, 0);
        continue;
      }

      let timer = (this.totemSpawnTimers.get(totem.id) ?? 0) + delta;
      let enemiesToSpawn = totem.maxEnemies - activeEnemies;
      while (timer >= totem.spawnInterval && enemiesToSpawn > 0) {
        timer -= totem.spawnInterval;
        this.spawnEnemy(totem);
        enemiesToSpawn -= 1;
        spawnedEnemies = true;
      }
      this.totemSpawnTimers.set(totem.id, timer);
    }

    return spawnedEnemies;
  }

  private updatePlayers(delta: number): boolean {
    const distanceToMove = PLAYER_SPEED * delta / 1000;
    let movedPlayers = false;

    for (const [id, target] of this.playerTargets) {
      const player = this.playerMap.get(id);
      if (!player) {
        this.playerTargets.delete(id);
        continue;
      }

      const x = target.x - player.position.x;
      const y = target.y - player.position.y;
      const distance = Math.hypot(x, y);
      if (distance === 0) {
        this.playerTargets.delete(id);
        continue;
      }

      const movement = Math.min(distanceToMove, distance);
      player.position.x += x / distance * movement;
      player.position.y += y / distance * movement;
      movedPlayers = true;
      if (movement === distance) {
        this.playerTargets.delete(id);
      }
    }

    return movedPlayers;
  }

  private updateEnemyAI(delta: number): boolean {
    const distanceToMove = ENEMY_SPEED * delta / 1000;
    let movedEnemies = false;

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

      const movement = Math.min(distanceToMove, Math.max(0, distance - 16));
      if (movement === 0) {
        continue;
      }
      enemy.position.x += x / distance * movement;
      enemy.position.y += y / distance * movement;
      movedEnemies = true;
    }

    return movedEnemies;
  }

  private getTotemEnemyCount(totemId: string): number {
    let count = 0;
    for (const enemy of this.enemyMap.values()) {
      if (enemy.totemId === totemId) {
        count += 1;
      }
    }
    return count;
  }

  private spawnEnemy(totem: EnemyTotem): void {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random()) * totem.spawnRadius;
    const id = `${totem.id}-${this.nextEnemyId++}`;
    this.enemyMap.set(id, {
      id,
      totemId: totem.id,
      hp: 1,
      position: {
        x: totem.position.x + Math.cos(angle) * distance,
        y: totem.position.y + Math.sin(angle) * distance,
      },
    });
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
      hp: 100,
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
    this.totemMap.clear();
    this.enemyTargets.clear();
    this.playerTargets.clear();
    this.totemSpawnTimers.clear();
    this.nextEnemyId = 0;
    this.stateDirty = false;
    this.stateBroadcastTimer = 0;
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
    hp: player.hp,
    position: { ...player.position },
  });

  private readonly copyEnemy = (enemy: Enemy): Enemy => ({
    id: enemy.id,
    totemId: enemy.totemId,
    hp: enemy.hp,
    position: { ...enemy.position },
  });

  private readonly copyTotem = (totem: EnemyTotem): EnemyTotem => ({
    id: totem.id,
    position: { ...totem.position },
    maxEnemies: totem.maxEnemies,
    spawnInterval: totem.spawnInterval,
    spawnRadius: totem.spawnRadius,
  });
}
