import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { paperboardService } from "./paperboard.service";

const getConfig = asyncHandler(async (req: Request, res: Response) => {
  const config = await paperboardService.getConfig(req.params.budgetId);
  res.status(200).json({ data: config });
});

const upsertConfig = asyncHandler(async (req: Request, res: Response) => {
  const config = await paperboardService.upsertConfig(req.params.budgetId, req.body);
  res.status(200).json({ data: config });
});

const removeConfig = asyncHandler(async (req: Request, res: Response) => {
  await paperboardService.removeConfig(req.params.budgetId);
  res.status(204).send();
});

export const paperboardController = { getConfig, upsertConfig, removeConfig };
