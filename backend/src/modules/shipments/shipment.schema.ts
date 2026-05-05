import { z } from "zod";

export const createShipmentSchema = z.object({
  orderId: z.string().trim().min(1, "orderId é obrigatório"),
  notes: z.string().trim().max(1000).optional().nullable(),
  shippedAt: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: "shippedAt deve ser uma data válida" })
    .optional(),
  items: z
    .array(
      z.object({
        orderItemId: z.string().trim().min(1, "orderItemId é obrigatório"),
        quantity: z.number({ required_error: "quantity é obrigatório" }).positive("quantity deve ser maior que zero"),
      }),
    )
    .min(1, "Pelo menos um item é obrigatório"),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

export interface ShipmentItem {
  id: string;
  shipmentId: string;
  orderItemId: string;
  quantity: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  notes: string | null;
  shippedAt: string;
  items: ShipmentItem[];
  createdAt: string;
}
