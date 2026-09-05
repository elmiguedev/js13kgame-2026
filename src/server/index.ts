const distDirectory = new URL("../../dist/", import.meta.url);
import { relayWebSocket, upgradeRelay, type RelayClient } from "./relay";
const port = Number(Bun.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const server = Bun.serve<RelayClient>({
  port,
  async fetch(request, server) {
    if (upgradeRelay(request, server)) {
      return;
    }

    const requestUrl = new URL(request.url);
    const path = requestUrl.pathname === "/" ? "index.html" : requestUrl.pathname.slice(1);
    const fileUrl = new URL(path, distDirectory);

    // Do not let a requested path escape the generated bundle directory.
    if (!fileUrl.href.startsWith(distDirectory.href)) {
      return new Response("Not found", { status: 404 });
    }

    const file = Bun.file(fileUrl);
    if (!(await file.exists())) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(file);
  },
  websocket: relayWebSocket,
});

console.log(`Serving dist at ${server.url}`);
