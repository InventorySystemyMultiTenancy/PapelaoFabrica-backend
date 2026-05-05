import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { shipmentController } from "./shipment.controller";
import { createShipmentSchema } from "./shipment.schema";

const shipmentRoutes = Router();

shipmentRoutes.use(requireAuth);
shipmentRoutes.use(authorizeRoles("admin", "gerente"));

shipmentRoutes.get("/orders/:orderId/shipments", shipmentController.listByOrder);
shipmentRoutes.get("/shipments/:id", shipmentController.getById);
shipmentRoutes.post("/shipments", validateBody(createShipmentSchema), shipmentController.create);

export { shipmentRoutes };
