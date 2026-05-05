import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { orderController } from "./order.controller";
import { createOrderSchema, updateOrderItemSchema } from "./order.schema";

const orderRoutes = Router();

orderRoutes.use(requireAuth);
orderRoutes.use(authorizeRoles("admin", "gerente"));

orderRoutes.get("/", orderController.list);
orderRoutes.get("/:id", orderController.getById);
orderRoutes.post("/", validateBody(createOrderSchema), orderController.create);
orderRoutes.patch(
  "/:id/items/:itemId/produced",
  validateBody(updateOrderItemSchema),
  orderController.updateItemProduced,
);

export { orderRoutes };
