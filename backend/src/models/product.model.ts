import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(255),
  stockQuantity: z.coerce.number().nonnegative("stockQuantity cannot be negative").default(0),
  lowStockAlertQuantity: z.coerce
    .number()
    .nonnegative("lowStockAlertQuantity cannot be negative")
    .default(0),
  isPaperboardMaterial: z.boolean().optional().default(false),
  gramatura: z.coerce.number().positive("gramatura must be positive").optional().nullable(),
  sheetsPerBundle: z.coerce
    .number()
    .int()
    .positive("sheetsPerBundle must be a positive integer")
    .optional()
    .nullable(),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(255).optional(),
    lowStockAlertQuantity: z
      .coerce
      .number()
      .nonnegative("lowStockAlertQuantity cannot be negative")
      .optional(),
    isPaperboardMaterial: z.boolean().optional(),
    gramatura: z.coerce.number().positive("gramatura must be positive").optional().nullable(),
    sheetsPerBundle: z.coerce
      .number()
      .int()
      .positive("sheetsPerBundle must be a positive integer")
      .optional()
      .nullable(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field must be provided",
  });

export interface Product {
  id: string;
  name: string;
  stockQuantity: number;
  lowStockAlertQuantity: number;
  stockStatus: "em_estoque" | "precisa_comprar";
  isPaperboardMaterial: boolean;
  gramatura: number | null;
  sheetsPerBundle: number | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

