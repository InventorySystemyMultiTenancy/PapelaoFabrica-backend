import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { payableService } from "./payable.service";

const list = asyncHandler(async (req: Request, res: Response) => {
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;
  const payables = await payableService.list(status);
  res.status(200).json({ data: payables });
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const payable = await payableService.getById(req.params.id);
  res.status(200).json({ data: payable });
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const payable = await payableService.create(req.body);
  res.status(201).json({ data: payable });
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const payable = await payableService.update(req.params.id, req.body);
  res.status(200).json({ data: payable });
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await payableService.remove(req.params.id);
  res.status(204).send();
});

const getSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await payableService.getSummary();
  res.status(200).json({ data: summary });
});

export const payableController = {
  list,
  getById,
  create,
  update,
  remove,
  getSummary,
};
