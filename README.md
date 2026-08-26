# js13kgame-2026

To install dependencies:

```bash
bun install
```

To develop the game with automatic browser updates after changes to `index.html` or `src/game`:

```bash
bun dev
```

To create the production bundle from `index.html` and `src/game`:

```bash
bun run build
```

The generated files are written to `dist/`. Serve that bundle with Bun:

```bash
bun run start
```

The server listens on port `3000` by default. Set `PORT` to use another port.
