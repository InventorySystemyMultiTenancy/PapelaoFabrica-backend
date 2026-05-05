import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { purchaseOrderController } from "./purchase-order.controller";
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
} from "./purchase-order.schema";

const purchaseOrderRoutes = Router();
purchaseOrderRoutes.use(requireAuth);
purchaseOrderRoutes.use(authorizeRoles("admin", "gerente"));

purchaseOrderRoutes.get("/", purchaseOrderController.list);
purchaseOrderRoutes.get("/:id", purchaseOrderController.getById);
purchaseOrderRoutes.post(
  "/",
  validateBody(createPurchaseOrderSchema),
  purchaseOrderController.create,
);
purchaseOrderRoutes.patch(
  "/:id",
  validateBody(updatePurchaseOrderSchema),
  purchaseOrderController.update,
);
purchaseOrderRoutes.delete("/:id", purchaseOrderController.remove);

export { purchaseOrderRoutes };
