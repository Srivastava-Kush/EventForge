import { loadEnv } from "./src/config/env.js";
import { connectDB, disconnectDB } from "./src/config/db.js";
import { createApp } from "./src/app.js";

try {
  const env = loadEnv();
  await connectDB(env.mongoUri);
  const app = createApp({ env });
  const s = app.listen(env.port, env.host, () => console.log(`Event planner running at http://${env.host}:${s.address()?.port}\nAI ideas: ${env.hasCredentials ? `on, ${env.model}` : "off"}`));
  for (const sig of ["SIGINT", "SIGTERM"]) {
    process.on(sig, () => {
      s.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    });
  }
} catch (err) {
  console.error("Configuration error:", err.message);
  process.exit(1);
}
