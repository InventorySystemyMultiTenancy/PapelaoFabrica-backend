import { z } from "zod";

export const paperboardConfigSchema = z.object({
  length: z
    .number({ required_error: "length é obrigatório" })
    .positive("length deve ser maior que zero"),
  width: z
    .number({ required_error: "width é obrigatório" })
    .positive("width deve ser maior que zero"),
  height: z
    .number({ required_error: "height é obrigatório" })
    .positive("height deve ser maior que zero"),
  gramatura: z
    .number({ required_error: "gramatura é obrigatória" })
    .positive("gramatura deve ser maior que zero"),
  quantity: z
    .number({ required_error: "quantity é obrigatória" })
    .positive("quantity deve ser maior que zero"),
  sheetsPerBundle: z
    .number()
    .positive("sheetsPerBundle deve ser maior que zero")
    .optional()
    .nullable(),
  sheetUnitCost: z
    .number()
    .nonnegative("sheetUnitCost não pode ser negativo")
    .optional()
    .nullable(),
  cuttingCostPerKg: z
    .number()
    .nonnegative("cuttingCostPerKg não pode ser negativo")
    .optional()
    .nullable(),
  creasingCostPerKg: z
    .number()
    .nonnegative("creasingCostPerKg não pode ser negativo")
    .optional()
    .nullable(),
  lossPercentage: z.number().min(0).max(100).optional().default(0),
  markupPercentage: z.number().min(0).max(1000).optional().default(35),
  usesFullSheet: z.boolean().default(false),
  outsourcedCut: z.boolean().default(false),
  isFirstPurchase: z.boolean().default(false),
  clicheCost: z
    .number()
    .nonnegative("clicheCost não pode ser negativo")
    .optional()
    .nullable(),
  clichePrice: z
    .number()
    .nonnegative("clichePrice não pode ser negativo")
    .optional()
    .nullable(),
});

export const createPaperboardConfigSchema = paperboardConfigSchema;
export const updatePaperboardConfigSchema = paperboardConfigSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido",
  });

export type CreatePaperboardConfigInput = z.infer<
  typeof createPaperboardConfigSchema
>;
export type UpdatePaperboardConfigInput = z.infer<
  typeof updatePaperboardConfigSchema
>;

export interface PaperboardConfig {
  id: string;
  budgetId: string;
  length: number;
  width: number;
  height: number;
  gramatura: number;
  quantity: number;
  sheetsPerBundle: number | null;
  sheetUnitCost: number | null;
  cuttingCostPerKg: number | null;
  creasingCostPerKg: number | null;
  lossPercentage: number;
  markupPercentage: number;
  usesFullSheet: boolean;
  outsourcedCut: boolean;
  isFirstPurchase: boolean;
  clicheCost: number | null;
  clichePrice: number | null;
  area: number;
  packageArea: number;
  totalArea: number;
  totalSheets: number;
  totalBundles: number;
  materialCost: number;
  cuttingCost: number;
  creasingCost: number;
  lossCost: number;
  clicheAppliedCost: number;
  suggestedPrice: number;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
}
