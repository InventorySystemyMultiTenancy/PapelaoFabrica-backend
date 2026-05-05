import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { wasteService } from "./waste.service";

const list = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ data: await wasteService.list() });
});
const getById = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({ data: await wasteService.getById(req.params.id) });
});
const create = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ data: await wasteService.create(req.body) });
});
const update = asyncHandler(async (req: Request, res: Response) => {
  res
    .status(200)
    .json({ data: await wasteService.update(req.params.id, req.body) });
});
const remove = asyncHandler(async (req: Request, res: Response) => {
  await wasteService.remove(req.params.id);
  res.status(204).send();
});
const getSummary = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ data: await wasteService.getSummary() });
});

export const wasteController = {
  list,
  getById,
  create,
  update,
  remove,
  getSummary,
};
