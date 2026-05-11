import { AppError } from "../../utils/app-error";
import { consignedStockRepository } from "./consigned-stock.repository";
import {
  ConsignedMovementInput,
  ConsignedStockItem,
  UpsertConsignedStockInput,
} from "./consigned-stock.schema";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertValidStockId(id: string): void {
  if (!uuidPattern.test(id)) {
    throw new AppError("ID do estoque consignado inválido", 400, { id });
  }
}

async function list(clientId?: string) {
  return consignedStockRepository.findAll(clientId);
}
async function getById(id: string) {
  assertValidStockId(id);
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
  assertValidStockId(stockId);
  const stock = await consignedStockRepository.findById(stockId);
  if (!stock) throw new AppError("Estoque consignado não encontrado", 404);
  if (input.movementType === "saida" && stock.quantity < input.quantity)
    throw new AppError("Saldo insuficiente para saída", 400);
  return consignedStockRepository.addMovement(stockId, input);
}
async function getMovements(stockId: string) {
  assertValidStockId(stockId);
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
