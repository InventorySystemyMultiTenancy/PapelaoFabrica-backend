import { z } from "zod";

export const paperboardConfigSchema = z.object({
  length: z.number({ required_error: "length é obrigatório" }).positive("length deve ser maior que zero"),
  width: z.number({ required_error: "width é obrigatório" }).positive("width deve ser maior que zero"),
  height: z.number({ required_error: "height é obrigatório" }).positive("height deve ser maior que zero"),
  gramatura: z.number({ required_error: "gramatura é obrigatória" }).positive("gramatura deve ser maior que zero"),
  quantity: z.number({ required_error: "quantity é obrigatória" }).positive("quantity deve ser maior que zero"),
  usesFullSheet: z.boolean().default(false),
  outsourcedCut: z.boolean().default(false),
  isFirstPurchase: z.boolean().default(false),
  clicheCost: z.number().nonnegative("clicheCost não pode ser negativo").optional().nullable(),
  clichePrice: z.number().nonnegative("clichePrice não pode ser negativo").optional().nullable(),
});

export const createPaperboardConfigSchema = paperboardConfigSchema;
export const updatePaperboardConfigSchema = paperboardConfigSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Pelo menos um campo deve ser fornecido" },
);

export type CreatePaperboardConfigInput = z.infer<typeof createPaperboardConfigSchema>;
export type UpdatePaperboardConfigInput = z.infer<typeof updatePaperboardConfigSchema>;

export interface PaperboardConfig {
  id: string;
  budgetId: string;
  length: number;
  width: number;
  height: number;
  gramatura: number;
  quantity: number;
  usesFullSheet: boolean;
  outsourcedCut: boolean;
  isFirstPurchase: boolean;
  clicheCost: number | null;
  clichePrice: number | null;
  area: number;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
}
