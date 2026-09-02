import { AppError } from "../../utils/app-error";
import { orderRepository } from "../orders/order.repository";
import { financialRepository } from "./financial.repository";
import {
  AccountReceivable,
  CashflowSummary,
  GenerateInstallmentsInput,
  PeriodQueryInput,
  UpdateReceivableInput,
} from "./financial.schema";

async function getReceivablesByOrder(orderId: string): Promise<AccountReceivable[]> {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  return financialRepository.findByOrderId(orderId);
}

async function generateInstallments(input: GenerateInstallmentsInput): Promise<AccountReceivable[]> {
  const order = await orderRepository.findById(input.orderId);
  if (!order) throw new AppError("Order not found", 404);

  const baseDate = new Date();
  const amountPerInstallment = input.totalAmount / input.installmentDays.length;

  const installments = input.installmentDays.map((days, idx) => {
    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + days);
    return { amount: amountPerInstallment, dueDate, installment: idx + 1 };
  });

  return financialRepository.createInstallments(input, installments);
}

async function updateReceivable(id: string, input: UpdateReceivableInput): Promise<AccountReceivable> {
  const existing = await financialRepository.findById(id);
  if (!existing) throw new AppError("Account receivable not found", 404);

  // Mark as paid: require paidAt
  if (input.status === "paid" && !input.paidAt && !existing.paidAt) {
    input = { ...input, paidAt: new Date().toISOString() };
  }

  const updated = await financialRepository.updateReceivable(id, input);
  if (!updated) throw new AppError("Account receivable not found", 404);
  return updated;
}

async function getCashflow(query: PeriodQueryInput = {}): Promise<CashflowSummary> {
  return financialRepository.getCashflowSummary(query);
}

export const financialService = {
  getReceivablesByOrder,
  generateInstallments,
  updateReceivable,
  getCashflow,
};
