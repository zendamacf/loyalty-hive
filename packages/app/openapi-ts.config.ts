import { defineConfig } from "@hey-api/openapi-ts";
import "dotenv/config";

if (!process.env.API_URL) {
  throw new Error("API_URL is required");
}

export default defineConfig({
  input: `${process.env.API_URL}/openapi`,
  output: "src/lib/api-client/gen",
  plugins: [
    {
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "./src/lib/api-client/setup.ts",
    },
  ],
});
