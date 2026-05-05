import { z } from "zod";

export const purchaseOrderStatusSchema = z.enum([
  "draft",
  "sent",
  "confirmed",
  "received",
  "cancelled",
]);
export type PurchaseOrderStatus = z.infer<typeof purchaseOrderStatusSchema>;

export const purchaseOrderItemSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  description: z.string().trim().min(1, "descrição é obrigatória").max(255),
  gramatura: z.number().positive().optional().nullable(),
  sheetWidthCm: z.number().positive().optional().nullable(),
  sheetLengthCm: z.number().positive().optional().nullable(),
  quantityKg: z.number().positive("quantidade em kg deve ser positiva"),
  unitPricePerKg: z.number().min(0).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const createPurchaseOrderSchema = z.object({
  supplier: z.string().trim().min(1, "fornecedor é obrigatório").max(255),
  expectedDeliveryDate: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z
    .array(purchaseOrderItemSchema)
    .min(1, "pelo menos 1 item é obrigatório"),
});

export const updatePurchaseOrderSchema = z.object({
  supplier: z.string().trim().min(1).max(255).optional(),
  status: purchaseOrderStatusSchema.optional(),
  expectedDeliveryDate: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  sentAt: z.string().trim().optional().nullable(),
  receivedAt: z.string().trim().optional().nullable(),
});

export type CreatePurchaseOrderInput = z.infer<
  typeof createPurchaseOrderSchema
>;
export type UpdatePurchaseOrderInput = z.infer<
  typeof updatePurchaseOrderSchema
>;

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string | null;
  description: string;
  gramatura: number | null;
  sheetWidthCm: number | null;
  sheetLengthCm: number | null;
  quantityKg: number;
  unitPricePerKg: number | null;
  totalPrice: number | null;
  receivedKg: number;
  notes: string | null;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: number;
  supplier: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  notes: string | null;
  expectedDeliveryDate: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}
