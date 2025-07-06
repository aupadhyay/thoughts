import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["server.ts"],
  outDir: "build",
  target: "node18",
  format: "cjs",
  sourcemap: true,
  clean: true,

  // Bundle workspace deps starting with @thoughts (@thoughts/db, etc.)
  noExternal: [/^@thoughts\//],
})
