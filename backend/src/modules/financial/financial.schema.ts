import { z } from "zod";

export const receivableStatusSchema = z.enum(["pending", "paid", "overdue"]);
export type ReceivableStatus = z.infer<typeof receivableStatusSchema>;

export const generateInstallmentsSchema = z.object({
  orderId: z.string().trim().min(1, "orderId é obrigatório"),
  totalAmount: z
    .number({ required_error: "totalAmount é obrigatório" })
    .positive("totalAmount deve ser maior que zero"),
  paymentType: z.enum(["avista", "parcelado"]),
  installmentDays: z
    .array(
      z
        .number()
        .int()
        .nonnegative("Os dias de parcela não podem ser negativos"),
    )
    .min(1, "Pelo menos um prazo de parcela é obrigatório"),
});

export const updateReceivableSchema = z.object({
  paidAt: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "paidAt deve ser uma data válida",
    })
    .optional()
    .nullable(),
  status: receivableStatusSchema.optional(),
  dueDate: z
    .string()
    .trim()
    .refine((v) => !Number.isNaN(Date.parse(v)), {
      message: "dueDate deve ser uma data válida",
    })
    .optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export type GenerateInstallmentsInput = z.infer<
  typeof generateInstallmentsSchema
>;
export type UpdateReceivableInput = z.infer<typeof updateReceivableSchema>;

export interface AccountReceivable {
  id: string;
  orderId: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: ReceivableStatus;
  installment: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CashflowSummary {
  expectedIncome: number;
  expectedExpenses: number;
  cashflow: number;
  projectedProfit: number;
  projectedProfitCashflow: number;
  receivablesByMonth: Array<{ month: string; amount: number }>;
}
