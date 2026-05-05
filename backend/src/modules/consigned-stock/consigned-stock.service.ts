import { AppError } from "../../utils/app-error";
import { consignedStockRepository } from "./consigned-stock.repository";
import {
  ConsignedMovementInput,
  ConsignedStockItem,
  UpsertConsignedStockInput,
} from "./consigned-stock.schema";

async function list(clientId?: string) {
  return consignedStockRepository.findAll(clientId);
}
async function getById(id: string) {
  const stock = await consignedStockRepository.findById(id);
  if (!stock) throw new AppError("Estoque consignado não encontrado", 404);
  return stock;
}
async function upsert(
  input: UpsertConsignedStockInput,
): Promise<ConsignedStockItem> {
  return consignedStockRepository.upsert(input);
}
async function addMovement(stockId: string, input: ConsignedMovementInput) {
  const stock = await consignedStockRepository.findById(stockId);
  if (!stock) throw new AppError("Estoque consignado não encontrado", 404);
  if (input.movementType === "saida" && stock.quantity < input.quantity)
    throw new AppError("Saldo insuficiente para saída", 400);
  return consignedStockRepository.addMovement(stockId, input);
}
async function getMovements(stockId: string) {
  const stock = await consignedStockRepository.findById(stockId);
  if (!stock) throw new AppError("Estoque consignado não encontrado", 404);
  return consignedStockRepository.findMovements(stockId);
}
export const consignedStockService = {
  list,
  getById,
  upsert,
  addMovement,
  getMovements,
};
