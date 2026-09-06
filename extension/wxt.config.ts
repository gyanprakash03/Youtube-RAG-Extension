import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],

  manifest: {
    name: "VidMind",
    description: "Ask questions about YouTube videos using AI",
    action: {},
    side_panel: {
      default_path: "sidepanel.html",
    },
  },
  vite: () => ({
    plugins: [
      tailwindcss(),
    ],
  }),
});