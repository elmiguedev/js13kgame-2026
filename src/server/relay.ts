export interface RelayClient {
  id: string;
  room: string;
}

interface RelaySocket {
  readonly data: RelayClient;
  send(data: string): unknown;
}

type RelayServer = {
  upgrade(request: Request, options?: { data?: RelayClient }): boolean;
};

const rooms = new Map<string, Set<RelaySocket>>();
let nextClientId = 0;

export function upgradeRelay(request: Request, server: RelayServer): boolean {
  const path = new URL(request.url).pathname;
  const room = path.startsWith("/relay/") ? path.slice("/relay/".length) : "";
  return request.headers.get("upgrade") === "websocket" && room
    ? server.upgrade(request, { data: { id: `${nextClientId++}`, room } })
    : false;
}

export const relayWebSocket = {
  open(socket: RelaySocket): void {
    const peers = rooms.get(socket.data.room) ?? new Set<RelaySocket>();
    rooms.set(socket.data.room, peers);
    socket.send(`@${socket.data.id}`);
    for (const peer of peers) {
      peer.send(`+${socket.data.id}`);
    }
    peers.add(socket);
  },

  message(socket: RelaySocket, message: string | Buffer): void {
    if (typeof message !== "string") {
      return;
    }

    const peers = rooms.get(socket.data.room);
    if (!peers) {
      return;
    }

    if (message[0] === "@") {
      const separator = message.indexOf("|");
      if (separator > 1) {
        const clientId = message.slice(1, separator);
        for (const peer of peers) {
          if (peer.data.id === clientId) {
            peer.send(message.slice(separator + 1));
            return;
          }
        }
      }
      return;
    }

    for (const peer of peers) {
      if (peer !== socket) {
        peer.send(message);
      }
    }
  },

  close(socket: RelaySocket): void {
    const peers = rooms.get(socket.data.room);
    if (!peers) {
      return;
    }

    peers.delete(socket);
    for (const peer of peers) {
      peer.send(`-${socket.data.id}`);
    }
    if (peers.size === 0) {
      rooms.delete(socket.data.room);
    }
  },
};
