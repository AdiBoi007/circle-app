import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import { deliverOne } from "./mail.js";
const app = createApp();
const server = serve(
  { fetch: app.fetch, port: config.port, hostname: config.host },
  () =>
    console.info(
      `Circle API ready at ${config.apiUrl}. Email delivery: ${config.mailEnabled ? "enabled" : "disabled"}.`,
    ),
);
let running = false;
const worker = setInterval(async () => {
  if (running) return;
  running = true;
  try {
    for (let i = 0; i < 10; i++) {
      if (!(await deliverOne())) break;
    }
  } catch {
    console.error("Delivery worker will retry.");
  } finally {
    running = false;
  }
}, 5000);
async function shutdown() {
  clearInterval(worker);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
