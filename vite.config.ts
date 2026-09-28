import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: a <user>.github.io repo serves from "/", any other repo from "/<repo>/".
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_PATH ?? "/",
  server: { port: 5190 },
});
