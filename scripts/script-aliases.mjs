import { fileURLToPath } from "node:url";

export const scriptAliases = {
  "@injected": fileURLToPath(new URL("../injected", import.meta.url)),
};
