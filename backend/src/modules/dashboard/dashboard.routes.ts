import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { dashboardRepository } from "./dashboard.repository";

const dashboardRoutes = Router();
dashboardRoutes.use(requireAuth);
dashboardRoutes.use(authorizeRoles("admin", "gerente"));

dashboardRoutes.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const startDate =
      typeof req.query.startDate === "string" ? req.query.startDate : undefined;
    const endDate =
      typeof req.query.endDate === "string" ? req.query.endDate : undefined;
    const summary = await dashboardRepository.getDashboardSummary({
      startDate,
      endDate,
    });
    res.status(200).json({ data: summary });
  }),
);

export { dashboardRoutes };
