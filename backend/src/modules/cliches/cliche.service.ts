import { AppError } from "../../utils/app-error";
import { clicheRepository } from "./cliche.repository";
import { Cliche, CreateClicheInput, UpdateClicheInput } from "./cliche.schema";

async function list(clientId?: string): Promise<Cliche[]> {
  return clicheRepository.findAll(clientId);
}

async function getById(id: string): Promise<Cliche> {
  const cliche = await clicheRepository.findById(id);
  if (!cliche) throw new AppError("Clichê não encontrado", 404);
  return cliche;
}

async function create(input: CreateClicheInput): Promise<Cliche> {
  return clicheRepository.create(input);
}

async function update(id: string, input: UpdateClicheInput): Promise<Cliche> {
  const existing = await clicheRepository.findById(id);
  if (!existing) throw new AppError("Clichê não encontrado", 404);

  // Marca data de pagamento automaticamente se marcado como pago
  if (input.paid === true && !input.paidAt && !existing.paidAt) {
    input = { ...input, paidAt: new Date().toISOString() };
  }

  const updated = await clicheRepository.update(id, input);
  if (!updated) throw new AppError("Clichê não encontrado", 404);
  return updated;
}

async function remove(id: string): Promise<void> {
  const existing = await clicheRepository.findById(id);
  if (!existing) throw new AppError("Clichê não encontrado", 404);
  await clicheRepository.remove(id);
}

export const clicheService = { list, getById, create, update, remove };
