import app from "./app";
import { startAccountPurgeJob } from "./common/account-purge-job";
import { adminAuthConfigProblem } from "./common/admin-session";
import { config } from "./common/config";

Bun.serve({
  hostname: config.server.hostname,
  port: config.server.port,
  fetch: app.fetch,
});
console.log(
  `🚀 Server is running on http://${config.server.hostname}:${config.server.port}`,
);

const adminAuthProblem = adminAuthConfigProblem();
if (adminAuthProblem) {
  console.warn(`⚠️ Admin login is off: ${adminAuthProblem}`);
}

startAccountPurgeJob();
