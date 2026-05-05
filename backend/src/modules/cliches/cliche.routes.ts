import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { clicheController } from "./cliche.controller";
import { createClicheSchema, updateClicheSchema } from "./cliche.schema";

const clicheRoutes = Router();

clicheRoutes.use(requireAuth);
clicheRoutes.use(authorizeRoles("admin", "gerente"));

clicheRoutes.get("/", clicheController.list);
clicheRoutes.get("/:id", clicheController.getById);
clicheRoutes.post(
  "/",
  validateBody(createClicheSchema),
  clicheController.create,
);
clicheRoutes.patch(
  "/:id",
  validateBody(updateClicheSchema),
  clicheController.update,
);
clicheRoutes.delete("/:id", clicheController.remove);

export { clicheRoutes };
