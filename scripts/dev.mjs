import { createServer } from "vite";
import { buildScripts } from "./build-scripts.mjs";

await buildScripts({ watch: true });
const server = await createServer();
await server.listen();
server.printUrls();
