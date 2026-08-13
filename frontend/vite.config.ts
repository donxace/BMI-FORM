import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    allowedHosts: [
      "tiringly-zealous-brayan.ngrok-free.dev",
    ],
  },
});