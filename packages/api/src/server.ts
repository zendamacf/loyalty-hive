import app from "./app";
import { config } from "./common/config";

Bun.serve({
  hostname: config.server.hostname,
  port: config.server.port,
  fetch: app.fetch,
});
console.log(
  `🚀 Server is running on http://${config.server.hostname}:${config.server.port}`,
);
