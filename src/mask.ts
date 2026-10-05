import { createApp } from "vue";
import TheMaskPage from "./TheMaskPage.vue";
import { commands } from "./services/cmds";
import { installConsoleLogger } from "./services/logger";
import { initializeTheme, listenForThemeColors } from "./theme";
import "./theme.css";

installConsoleLogger("mask");
void (async () => {
  try {
    initializeTheme(await commands.currentTheme());
  } catch (cause) {
    console.error("Failed to load mask color theme:", cause);
  }
  try {
    await listenForThemeColors();
  } catch (cause) {
    console.error("Failed to listen for mask color changes:", cause);
  }
  createApp(TheMaskPage).mount("#mask");
})();
