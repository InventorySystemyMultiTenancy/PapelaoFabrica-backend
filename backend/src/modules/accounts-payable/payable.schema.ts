import { z } from "zod";

export const payableCategorySchema = z.enum([
  "agua",
  "energia",
  "material",
  "aluguel",
  "salario",
  "impostos",
  "servicos",
  "outros",
]);
export const payableStatusSchema = z.enum(["pending", "paid", "overdue"]);

export type PayableCategory = z.infer<typeof payableCategorySchema>;
export type PayableStatus = z.infer<typeof payableStatusSchema>;

export const createPayableSchema = z.object({
  description: z.string().trim().min(1, "descrição é obrigatória").max(255),
  category: payableCategorySchema.default("outros"),
  amount: z
    .number({ required_error: "valor é obrigatório" })
    .positive("valor deve ser positivo"),
  dueDate: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "dueDate inválida",
    }),
  supplier: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  recurrent: z.boolean().default(false),
});

export const updatePayableSchema = z.object({
  description: z.string().trim().min(1).max(255).optional(),
  category: payableCategorySchema.optional(),
  amount: z.number().positive().optional(),
  dueDate: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "dueDate inválida",
    })
    .optional(),
  supplier: z.string().trim().max(255).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  recurrent: z.boolean().optional(),
  status: payableStatusSchema.optional(),
  paidAt: z.string().trim().optional().nullable(),
});

export type CreatePayableInput = z.infer<typeof createPayableSchema>;
export type UpdatePayableInput = z.infer<typeof updatePayableSchema>;

export interface AccountPayable {
  id: string;
  description: string;
  category: PayableCategory;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: PayableStatus;
  supplier: string | null;
  notes: string | null;
  recurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PayableSummary {
  totalPending: number;
  totalPaid: number;
  totalOverdue: number;
  projectedProfitCoverage: number;
  projectedProfitBalance: number;
}
