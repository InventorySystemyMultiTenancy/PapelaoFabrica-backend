import { AppError } from "../../utils/app-error";
import { payableRepository } from "./payable.repository";
import {
  AccountPayable,
  CreatePayableInput,
  PayableSummary,
  UpdatePayableInput,
} from "./payable.schema";

const PAID_RETENTION_DAYS = 60;

async function runCleanup(): Promise<void> {
  await payableRepository.purgePaidOlderThan(PAID_RETENTION_DAYS);
}

async function list(status?: string): Promise<AccountPayable[]> {
  await runCleanup();
  return payableRepository.findAll(status);
}

async function getById(id: string): Promise<AccountPayable> {
  const payable = await payableRepository.findById(id);
  if (!payable) throw new AppError("Conta a pagar não encontrada", 404);
  return payable;
}

async function create(input: CreatePayableInput): Promise<AccountPayable> {
  return payableRepository.create(input);
}

async function update(
  id: string,
  input: UpdatePayableInput,
): Promise<AccountPayable> {
  const existing = await payableRepository.findById(id);
  if (!existing) throw new AppError("Conta a pagar não encontrada", 404);

  if (input.status === "paid" && !input.paidAt && !existing.paidAt) {
    input = { ...input, paidAt: new Date().toISOString() };
  }

  const updated = await payableRepository.update(id, input);
  if (!updated) throw new AppError("Conta a pagar não encontrada", 404);
  return updated;
}

async function remove(id: string): Promise<void> {
  const existing = await payableRepository.findById(id);
  if (!existing) throw new AppError("Conta a pagar não encontrada", 404);
  await payableRepository.remove(id);
}

async function getSummary(): Promise<PayableSummary> {
  await runCleanup();
  return payableRepository.getSummary();
}

export const payableService = {
  list,
  getById,
  create,
  update,
  remove,
  getSummary,
};
