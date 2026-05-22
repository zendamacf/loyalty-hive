import { defineConfig } from "@hey-api/openapi-ts";
import "dotenv/config";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("EXPO_PUBLIC_API_URL is required");
}

export default defineConfig({
  input: `${apiUrl}/doc/gen`,
  output: "src/lib/api-client/gen",
  plugins: [
    {
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "./src/lib/api-client/setup.ts",
    },
    "@tanstack/react-query",
  ],
});
