import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { paperboardController } from "./paperboard.controller";
import { createPaperboardConfigSchema } from "./paperboard.schema";

const paperboardRoutes = Router();

paperboardRoutes.use(requireAuth);
paperboardRoutes.use(authorizeRoles("admin", "gerente"));

// Nested under /budgets/:budgetId/paperboard
paperboardRoutes.get("/budgets/:budgetId/paperboard", paperboardController.getConfig);
paperboardRoutes.put(
  "/budgets/:budgetId/paperboard",
  validateBody(createPaperboardConfigSchema),
  paperboardController.upsertConfig,
);
paperboardRoutes.delete("/budgets/:budgetId/paperboard", paperboardController.removeConfig);

export { paperboardRoutes };
