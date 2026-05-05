import { app } from "./app";
import { env } from "./config/env";
import { runMigrations } from "./database/migrate";
import { startBudgetLifecycleJob } from "./jobs/budget-lifecycle.job";

async function bootstrap() {
  await runMigrations();
  app.listen(env.PORT, () => {
    console.log(`Backend running on port ${env.PORT}`);
    startBudgetLifecycleJob();
  });
}

bootstrap().catch((err) => {
  console.error("Fatal error during startup:", err);
  process.exit(1);
});