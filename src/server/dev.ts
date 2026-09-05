import index from "../../index.html";
import { relayWebSocket, upgradeRelay, type RelayClient } from "./relay";

const spritesheet = Bun.file(new URL("../../assets/img/spritesheet.png", import.meta.url));

const port = Number(Bun.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const server = Bun.serve<RelayClient>({
  port,
  routes: {
    "/": index,
    "/spritesheet.png": () => new Response(spritesheet),
  },
  fetch(request, server) {
    if (upgradeRelay(request, server)) {
      return;
    }

    return new Response("Not found", { status: 404 });
  },
  websocket: relayWebSocket,
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`Serving development game at ${server.url}`);
