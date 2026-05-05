import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { financialController } from "./financial.controller";
import { generateInstallmentsSchema, updateReceivableSchema } from "./financial.schema";

const financialRoutes = Router();

financialRoutes.use(requireAuth);
financialRoutes.use(authorizeRoles("admin", "gerente"));

financialRoutes.get("/cashflow", financialController.getCashflow);
financialRoutes.get("/orders/:orderId/receivables", financialController.getReceivablesByOrder);
financialRoutes.post(
  "/receivables/installments",
  validateBody(generateInstallmentsSchema),
  financialController.generateInstallments,
);
financialRoutes.patch(
  "/receivables/:id",
  validateBody(updateReceivableSchema),
  financialController.updateReceivable,
);

export { financialRoutes };
