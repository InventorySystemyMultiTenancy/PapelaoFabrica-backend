import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { AppError } from "../../utils/app-error";
import { calculateQuotation, quotationInputSchema } from "./pricing.engine";

/**
 * POST /api/pricing/quotation
 * Calcula cotação rápida sem salvar (apenas retorna o resultado)
 */
const quotation = asyncHandler(async (req: Request, res: Response) => {
  const parsed = quotationInputSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      parsed.error.errors.map((e) => e.message).join(", "),
      400,
    );
  }

  let result;
  try {
    result = calculateQuotation(parsed.data);
  } catch (err) {
    throw new AppError(
      err instanceof Error ? err.message : "Erro no cálculo",
      400,
    );
  }

  res.status(200).json({ data: result });
});

export const pricingController = { quotation };
