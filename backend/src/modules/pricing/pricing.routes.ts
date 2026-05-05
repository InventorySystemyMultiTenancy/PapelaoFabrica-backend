import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { pricingController } from "./pricing.controller";

const pricingRoutes = Router();
pricingRoutes.use(requireAuth);

// Cotação rápida — sem persistência
pricingRoutes.post("/quotation", pricingController.quotation);

export { pricingRoutes };
