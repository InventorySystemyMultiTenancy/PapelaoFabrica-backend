import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { consignedStockController } from "./consigned-stock.controller";
import {
  consignedMovementSchema,
  upsertConsignedStockSchema,
} from "./consigned-stock.schema";

const consignedStockRoutes = Router();
consignedStockRoutes.use(requireAuth);

consignedStockRoutes.get("/", consignedStockController.list);
consignedStockRoutes.get("/:id", consignedStockController.getById);
consignedStockRoutes.get(
  "/:id/movements",
  consignedStockController.getMovements,
);
consignedStockRoutes.post(
  "/",
  validateBody(upsertConsignedStockSchema),
  consignedStockController.upsert,
);
consignedStockRoutes.post(
  "/:id/movements",
  validateBody(consignedMovementSchema),
  consignedStockController.addMovement,
);

export { consignedStockRoutes };
