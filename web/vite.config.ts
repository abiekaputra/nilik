/** Module responsible for configuring the Nilik web build. */

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: { port: 4610, strictPort: true },
  preview: { port: 4610, strictPort: true },
});
