import { AppError } from "../../utils/app-error";
import { wasteRepository } from "./waste.repository";
import {
  CreateWasteInput,
  UpdateWasteInput,
  UpdateWastePriceSettingInput,
  WastePriceSetting,
  WasteRecord,
  WasteSummary,
} from "./waste.schema";

async function list(): Promise<WasteRecord[]> {
  return wasteRepository.findAll();
}

async function getById(id: string): Promise<WasteRecord> {
  const waste = await wasteRepository.findById(id);
  if (!waste) throw new AppError("Registro de resíduo não encontrado", 404);
  return waste;
}

async function create(input: CreateWasteInput): Promise<WasteRecord> {
  return wasteRepository.create(input);
}

async function update(
  id: string,
  input: UpdateWasteInput,
): Promise<WasteRecord> {
  const existing = await wasteRepository.findById(id);
  if (!existing) throw new AppError("Registro de resíduo não encontrado", 404);
  if (input.sold === true && !input.soldAt && !existing.soldAt) {
    input = { ...input, soldAt: new Date().toISOString() };
  }
  const updated = await wasteRepository.update(id, input);
  if (!updated) throw new AppError("Registro de resíduo não encontrado", 404);
  return updated;
}

async function remove(id: string): Promise<void> {
  const existing = await wasteRepository.findById(id);
  if (!existing) throw new AppError("Registro de resíduo não encontrado", 404);
  await wasteRepository.remove(id);
}

async function getSummary(): Promise<WasteSummary> {
  return wasteRepository.getSummary();
}

async function getPriceSetting(): Promise<WastePriceSetting> {
  return wasteRepository.getPriceSetting();
}

async function updatePriceSetting(
  input: UpdateWastePriceSettingInput,
): Promise<WastePriceSetting> {
  return wasteRepository.updatePriceSetting(input.pricePerKg);
}

export const wasteService = {
  list,
  getById,
  create,
  update,
  remove,
  getSummary,
  getPriceSetting,
  updatePriceSetting,
};
