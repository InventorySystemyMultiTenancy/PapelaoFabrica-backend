import { z } from "zod";

export const createWasteSchema = z.object({
  recordDate: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "recordDate inválida",
    })
    .optional(),
  weightKg: z
    .number({ required_error: "peso em kg é obrigatório" })
    .positive("peso deve ser positivo"),
  description: z.string().trim().max(255).optional().nullable(),
  sold: z.boolean().default(false),
  saleAmount: z.number().min(0).optional().nullable(),
  buyer: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateWasteSchema = z.object({
  recordDate: z.string().trim().optional(),
  weightKg: z.number().positive().optional(),
  description: z.string().trim().max(255).optional().nullable(),
  sold: z.boolean().optional(),
  saleAmount: z.number().min(0).optional().nullable(),
  soldAt: z.string().trim().optional().nullable(),
  buyer: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateWastePriceSettingSchema = z.object({
  pricePerKg: z.number().min(0, "preço por kg não pode ser negativo"),
});

export type CreateWasteInput = z.infer<typeof createWasteSchema>;
export type UpdateWasteInput = z.infer<typeof updateWasteSchema>;
export type UpdateWastePriceSettingInput = z.infer<
  typeof updateWastePriceSettingSchema
>;

export interface WasteRecord {
  id: string;
  recordDate: string;
  weightKg: number;
  description: string | null;
  sold: boolean;
  saleAmount: number | null;
  soldAt: string | null;
  buyer: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WasteSummary {
  totalWeightKg: number;
  totalSold: number;
  totalRevenue: number;
  pendingSaleWeightKg: number;
}

export interface WastePriceSetting {
  pricePerKg: number;
  updatedAt: string;
}
