import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { deliveryRouteController } from "./delivery-route.controller";
import {
  confirmDeliveryItemSchema,
  createDeliveryRouteSchema,
  updateDeliveryRouteSchema,
} from "./delivery-route.schema";

const deliveryRouteRoutes = Router();

deliveryRouteRoutes.use(requireAuth);

deliveryRouteRoutes.get("/", deliveryRouteController.list);
deliveryRouteRoutes.get("/:id", deliveryRouteController.getById);

deliveryRouteRoutes.post(
  "/",
  authorizeRoles("admin", "gerente"),
  validateBody(createDeliveryRouteSchema),
  deliveryRouteController.create,
);
deliveryRouteRoutes.patch(
  "/:id",
  authorizeRoles("admin", "gerente"),
  validateBody(updateDeliveryRouteSchema),
  deliveryRouteController.update,
);
deliveryRouteRoutes.post(
  "/:id/items/:itemId/confirm",
  validateBody(confirmDeliveryItemSchema),
  deliveryRouteController.confirmItem,
);
deliveryRouteRoutes.delete(
  "/:id",
  authorizeRoles("admin", "gerente"),
  deliveryRouteController.remove,
);

export { deliveryRouteRoutes };
