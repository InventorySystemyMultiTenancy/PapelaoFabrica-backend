import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { deliveryRouteService } from "./delivery-route.service";

const list = asyncHandler(async (_req: Request, res: Response) => {
  const routes = await deliveryRouteService.list();
  res.status(200).json({ data: routes });
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const route = await deliveryRouteService.getById(req.params.id);
  res.status(200).json({ data: route });
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const route = await deliveryRouteService.create(req.body);
  res.status(201).json({ data: route });
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const route = await deliveryRouteService.update(req.params.id, req.body);
  res.status(200).json({ data: route });
});

const confirmItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await deliveryRouteService.confirmItem(
    req.params.id,
    req.params.itemId,
    req.body,
  );
  res.status(200).json({ data: item });
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await deliveryRouteService.remove(req.params.id);
  res.status(204).send();
});

export const deliveryRouteController = {
  list,
  getById,
  create,
  update,
  confirmItem,
  remove,
};
