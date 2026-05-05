import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { payableController } from "./payable.controller";
import { createPayableSchema, updatePayableSchema } from "./payable.schema";

const payableRoutes = Router();

payableRoutes.use(requireAuth);
payableRoutes.use(authorizeRoles("admin", "gerente"));

payableRoutes.get("/", payableController.list);
payableRoutes.get("/summary", payableController.getSummary);
payableRoutes.get("/:id", payableController.getById);
payableRoutes.post(
  "/",
  validateBody(createPayableSchema),
  payableController.create,
);
payableRoutes.patch(
  "/:id",
  validateBody(updatePayableSchema),
  payableController.update,
);
payableRoutes.delete("/:id", payableController.remove);

export { payableRoutes };
