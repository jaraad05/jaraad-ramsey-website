import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    {
      name: "preserve-public-resume",
      writeBundle() {
        copyFileSync(
          resolve(__dirname, "Jaraad-Ramsey-Resume-2026.pdf"),
          resolve(__dirname, "dist/Jaraad-Ramsey-Resume-2026.pdf"),
        );
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, "index.html"),
        resume: resolve(__dirname, "resume.html"),
        legacyPersonalTraining: resolve(__dirname, "personal-training.html"),
      },
    },
  },
});
