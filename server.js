import app from "./app.js";
import { env } from "./config/env.js";

import {
  connectDatabase,
  disconnectDatabase,
} from "./config/database.js";

let server;
let isShuttingDown = false;

async function startServer() {
  await connectDatabase();

  server = app.listen(env.PORT, () => {
    console.log(
      `Church API running at http://localhost:${env.PORT}`
    );

    console.log(
      `API base URL: http://localhost:${env.PORT}${env.API_PREFIX}`
    );
  });
}

async function shutdown(signal) {
  if (isShuttingDown) return;

  isShuttingDown = true;

  console.log(`${signal} received. Shutting down...`);

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await disconnectDatabase();

    process.exitCode = 0;
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exitCode = 1;
  }
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

startServer().catch(async (error) => {
  console.error("Failed to start Church API:", error);

  try {
    await disconnectDatabase();
  } catch (disconnectError) {
    console.error("Database cleanup failed:", disconnectError);
  }

  process.exitCode = 1;
});