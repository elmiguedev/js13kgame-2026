import index from "../../index.html";

const spritesheet = Bun.file(new URL("../../assets/img/spritesheet.png", import.meta.url));

const port = Number(Bun.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const server = Bun.serve({
  port,
  routes: {
    "/": index,
    "/spritesheet.png": () => new Response(spritesheet),
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`Serving development game at ${server.url}`);
