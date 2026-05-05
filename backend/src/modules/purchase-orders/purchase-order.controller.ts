import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { purchaseOrderService } from "./purchase-order.service";

const list = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: await purchaseOrderService.list() });
});
const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await purchaseOrderService.getById(req.params.id) });
});
const create = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await purchaseOrderService.create(req.body) });
});
const update = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    data: await purchaseOrderService.update(req.params.id, req.body),
  });
});
const remove = asyncHandler(async (req: Request, res: Response) => {
  await purchaseOrderService.remove(req.params.id);
  res.status(204).send();
});

export const purchaseOrderController = {
  list,
  getById,
  create,
  update,
  remove,
};
