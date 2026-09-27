import { defineConfig } from "@hey-api/openapi-ts";
import "dotenv/config";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error("EXPO_PUBLIC_API_URL is required");
}

export default defineConfig({
  input: `${apiUrl}/doc/gen`,
  output: {
    path: "src/lib/api-client/gen",
    // Expo/RN uses bundler resolution; omit extensions on generated relative imports.
    importFileExtension: null,
  },
  plugins: [
    {
      name: "@hey-api/client-fetch",
      // Omit `.ts` so generated `client.gen.ts` imports resolve without @ts-expect-error.
      runtimeConfigPath: "./src/lib/api-client/setup",
    },
    "@tanstack/react-query",
  ],
});
