import { z } from "zod";

export const routeStatusSchema = z.enum([
  "pending",
  "in_transit",
  "completed",
  "cancelled",
]);
export const routeItemStatusSchema = z.enum(["pending", "delivered", "failed"]);

export type RouteStatus = z.infer<typeof routeStatusSchema>;
export type RouteItemStatus = z.infer<typeof routeItemStatusSchema>;

export const createRouteItemSchema = z.object({
  shipmentId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  clientName: z.string().trim().min(1, "clientName é obrigatório").max(255),
  address: z.string().trim().min(1, "endereço é obrigatório"),
  quantity: z.number().int().min(0).default(0),
  sortOrder: z.number().int().min(0).default(0),
});

export const createDeliveryRouteSchema = z.object({
  name: z.string().trim().min(1, "nome é obrigatório").max(255),
  driverName: z.string().trim().max(255).optional().nullable(),
  vehicle: z.string().trim().max(255).optional().nullable(),
  scheduledDate: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "scheduledDate inválida",
    }),
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z
    .array(createRouteItemSchema)
    .min(1, "pelo menos 1 item é necessário"),
});

export const updateDeliveryRouteSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  driverName: z.string().trim().max(255).optional().nullable(),
  vehicle: z.string().trim().max(255).optional().nullable(),
  scheduledDate: z.string().trim().optional(),
  status: routeStatusSchema.optional(),
  departureAt: z.string().trim().optional().nullable(),
  completedAt: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const confirmDeliveryItemSchema = z.object({
  receivedBy: z.string().trim().min(1, "receivedBy é obrigatório").max(255),
  deliveryNotes: z.string().trim().max(2000).optional().nullable(),
  status: routeItemStatusSchema.default("delivered"),
});

export type CreateDeliveryRouteInput = z.infer<
  typeof createDeliveryRouteSchema
>;
export type UpdateDeliveryRouteInput = z.infer<
  typeof updateDeliveryRouteSchema
>;
export type ConfirmDeliveryItemInput = z.infer<
  typeof confirmDeliveryItemSchema
>;

export interface DeliveryRouteItem {
  id: string;
  routeId: string;
  shipmentId: string | null;
  clientId: string | null;
  clientName: string;
  address: string;
  quantity: number;
  deliveredAt: string | null;
  receivedBy: string | null;
  deliveryNotes: string | null;
  status: RouteItemStatus;
  sortOrder: number;
}

export interface DeliveryRoute {
  id: string;
  name: string;
  driverName: string | null;
  vehicle: string | null;
  scheduledDate: string;
  departureAt: string | null;
  completedAt: string | null;
  status: RouteStatus;
  notes: string | null;
  items: DeliveryRouteItem[];
  createdAt: string;
  updatedAt: string;
}
