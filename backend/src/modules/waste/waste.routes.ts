import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import { wasteController } from "./waste.controller";
import {
  createWasteSchema,
  updateWasteSchema,
  updateWastePriceSettingSchema,
} from "./waste.schema";

const wasteRoutes = Router();
wasteRoutes.use(requireAuth);
wasteRoutes.use(authorizeRoles("admin", "gerente"));

wasteRoutes.get("/", wasteController.list);
wasteRoutes.get("/summary", wasteController.getSummary);
wasteRoutes.get("/price-setting", wasteController.getPriceSetting);
wasteRoutes.put(
  "/price-setting",
  validateBody(updateWastePriceSettingSchema),
  wasteController.updatePriceSetting,
);
wasteRoutes.get("/:id", wasteController.getById);
wasteRoutes.post("/", validateBody(createWasteSchema), wasteController.create);
wasteRoutes.patch(
  "/:id",
  validateBody(updateWasteSchema),
  wasteController.update,
);
wasteRoutes.delete("/:id", wasteController.remove);

export { wasteRoutes };
