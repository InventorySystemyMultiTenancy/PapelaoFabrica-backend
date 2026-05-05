import { z } from "zod";

export const clicheStatusSchema = z.enum(["active", "inactive"]);
export type ClicheStatus = z.infer<typeof clicheStatusSchema>;

export const createClicheSchema = z.object({
  clientId: z.string().uuid("clientId deve ser um UUID válido"),
  name: z.string().trim().min(1, "nome é obrigatório").max(255),
  colors: z.number().int().min(1).max(10).default(1),
  widthCm: z.number().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  cost: z.number().min(0).default(0),
  paid: z.boolean().default(false),
  paidAt: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const updateClicheSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  colors: z.number().int().min(1).max(10).optional(),
  widthCm: z.number().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  cost: z.number().min(0).optional(),
  paid: z.boolean().optional(),
  paidAt: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: clicheStatusSchema.optional(),
});

export type CreateClicheInput = z.infer<typeof createClicheSchema>;
export type UpdateClicheInput = z.infer<typeof updateClicheSchema>;

export interface Cliche {
  id: string;
  clientId: string;
  clientName?: string;
  name: string;
  colors: number;
  widthCm: number | null;
  heightCm: number | null;
  cost: number;
  paid: boolean;
  paidAt: string | null;
  notes: string | null;
  status: ClicheStatus;
  createdAt: string;
  updatedAt: string;
}
