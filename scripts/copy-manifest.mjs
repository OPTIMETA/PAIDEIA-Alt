import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

await mkdir(join(root, "dist"), { recursive: true });
await copyFile(join(root, "manifest.json"), join(root, "dist/manifest.json"));
