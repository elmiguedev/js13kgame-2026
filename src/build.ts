await Bun.$`rm -rf dist`;

const result = await Bun.build({
  entrypoints: ["./index.html"],
  minify: true,
  outdir: "./dist",
  target: "browser",
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }

  process.exit(1);
}

await Bun.write("./dist/spritesheet.png", Bun.file("./assets/img/spritesheet.png"));
