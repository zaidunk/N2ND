import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next")
const env = {
  ...process.env,
  NEXT_PRIVATE_MAX_WORKERS: process.env.NEXT_PRIVATE_MAX_WORKERS || "1",
}

const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: root,
  env,
  stdio: "inherit",
  shell: false,
})

process.exit(result.status ?? 1)
