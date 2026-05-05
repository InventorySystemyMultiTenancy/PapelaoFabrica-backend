import { z } from "zod";

export const orderStatusSchema = z.enum(["production", "partial", "completed"]);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const createOrderSchema = z.object({
  budgetId: z.string().trim().min(1, "budgetId é obrigatório"),
  items: z
    .array(
      z.object({
        budgetItemId: z.string().trim().min(1).optional().nullable(),
        description: z.string().trim().min(1, "description é obrigatória").max(500),
        quantityTotal: z.number({ required_error: "quantityTotal é obrigatório" }).positive("quantityTotal deve ser maior que zero"),
      }),
    )
    .min(1, "Pelo menos um item é obrigatório"),
});

export const updateOrderItemSchema = z.object({
  quantityProduced: z.number().nonnegative().optional(),
});

export const listOrdersQuerySchema = z.object({
  status: orderStatusSchema.optional(),
  budgetId: z.string().trim().min(1).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>;
export type ListOrdersQueryInput = z.infer<typeof listOrdersQuerySchema>;

export interface OrderItem {
  id: string;
  orderId: string;
  budgetItemId: string | null;
  description: string;
  quantityTotal: number;
  quantityProduced: number;
  quantityShipped: number;
  remaining: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  budgetId: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}
