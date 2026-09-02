import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { financialService } from "./financial.service";
import { periodQuerySchema } from "./financial.schema";

const getReceivablesByOrder = asyncHandler(async (req: Request, res: Response) => {
  const receivables = await financialService.getReceivablesByOrder(req.params.orderId);
  res.status(200).json({ data: receivables });
});

const generateInstallments = asyncHandler(async (req: Request, res: Response) => {
  const receivables = await financialService.generateInstallments(req.body);
  res.status(201).json({ data: receivables });
});

const updateReceivable = asyncHandler(async (req: Request, res: Response) => {
  const receivable = await financialService.updateReceivable(req.params.id, req.body);
  res.status(200).json({ data: receivable });
});

const getCashflow = asyncHandler(async (req: Request, res: Response) => {
  const query = periodQuerySchema.parse({
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  });
  const summary = await financialService.getCashflow(query);
  res.status(200).json({ data: summary });
});

export const financialController = {
  getReceivablesByOrder,
  generateInstallments,
  updateReceivable,
  getCashflow,
};
