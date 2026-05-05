import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { orderService } from "./order.service";
import { listOrdersQuerySchema } from "./order.schema";

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const list = asyncHandler(async (req: Request, res: Response) => {
  const query = listOrdersQuerySchema.parse({
    status: toOptionalString(req.query.status),
    budgetId: toOptionalString(req.query.budgetId),
  });
  const orders = await orderService.listOrders(query);
  res.status(200).json({ data: orders });
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getOrderById(req.params.id);
  res.status(200).json({ data: order });
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.createOrder(req.body);
  res.status(201).json({ data: order });
});

const updateItemProduced = asyncHandler(async (req: Request, res: Response) => {
  const item = await orderService.updateItemProduced(req.params.id, req.params.itemId, req.body);
  res.status(200).json({ data: item });
});

export const orderController = { list, getById, create, updateItemProduced };
