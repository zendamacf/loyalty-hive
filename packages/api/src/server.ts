import app from "./app";
import { config } from "./common/config";

Bun.serve({
  hostname: "0.0.0.0",
  port: config.server.port,
  fetch: app.fetch,
});
