import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { consignedStockService } from "./consigned-stock.service";

const list = asyncHandler(async (req: Request, res: Response) => {
  const clientId =
    typeof req.query.clientId === "string" ? req.query.clientId : undefined;
  res.json({ data: await consignedStockService.list(clientId) });
});
const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await consignedStockService.getById(req.params.id) });
});
const upsert = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await consignedStockService.upsert(req.body) });
});
const addMovement = asyncHandler(async (req: Request, res: Response) => {
  res
    .status(201)
    .json({
      data: await consignedStockService.addMovement(req.params.id, req.body),
    });
});
const getMovements = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await consignedStockService.getMovements(req.params.id) });
});

export const consignedStockController = {
  list,
  getById,
  upsert,
  addMovement,
  getMovements,
};
