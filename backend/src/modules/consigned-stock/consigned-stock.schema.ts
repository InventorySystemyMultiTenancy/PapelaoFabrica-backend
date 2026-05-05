import { z } from "zod";

export const consignedMovementTypeSchema = z.enum(["entrada", "saida"]);

export const upsertConsignedStockSchema = z.object({
  clientId: z.string().trim().min(1, "clientId é obrigatório"),
  orderId: z.string().trim().min(1).optional().nullable(),
  productId: z.string().trim().min(1).optional().nullable(),
  productName: z.string().trim().min(1, "productName é obrigatório").max(255),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const consignedMovementSchema = z.object({
  movementType: consignedMovementTypeSchema,
  quantity: z.number().int().positive("quantidade deve ser positiva"),
  reference: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export type UpsertConsignedStockInput = z.infer<
  typeof upsertConsignedStockSchema
>;
export type ConsignedMovementInput = z.infer<typeof consignedMovementSchema>;

export interface ConsignedStockItem {
  id: string;
  clientId: string;
  clientName?: string;
  orderId: string | null;
  productId: string | null;
  productName: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsignedMovement {
  id: string;
  consignedStockId: string;
  movementType: "entrada" | "saida";
  quantity: number;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}
