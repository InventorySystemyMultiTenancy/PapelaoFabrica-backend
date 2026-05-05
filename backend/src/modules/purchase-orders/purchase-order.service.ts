import { AppError } from "../../utils/app-error";
import { purchaseOrderRepository } from "./purchase-order.repository";
import {
  CreatePurchaseOrderInput,
  PurchaseOrder,
  UpdatePurchaseOrderInput,
} from "./purchase-order.schema";

async function list(): Promise<PurchaseOrder[]> {
  return purchaseOrderRepository.findAll();
}
async function getById(id: string): Promise<PurchaseOrder> {
  const po = await purchaseOrderRepository.findById(id);
  if (!po) throw new AppError("Pedido de compra não encontrado", 404);
  return po;
}
async function create(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
  return purchaseOrderRepository.create(input);
}
async function update(
  id: string,
  input: UpdatePurchaseOrderInput,
): Promise<PurchaseOrder> {
  const existing = await purchaseOrderRepository.findById(id);
  if (!existing) throw new AppError("Pedido de compra não encontrado", 404);
  if (
    existing.status === "received" &&
    input.status &&
    input.status !== "received"
  )
    throw new AppError("Pedido já recebido não pode ser alterado", 400);
  if (input.status === "sent" && !input.sentAt && !existing.sentAt)
    input = { ...input, sentAt: new Date().toISOString() };
  if (input.status === "received" && !input.receivedAt && !existing.receivedAt)
    input = { ...input, receivedAt: new Date().toISOString() };
  const updated = await purchaseOrderRepository.update(id, input);
  if (!updated) throw new AppError("Pedido de compra não encontrado", 404);
  return updated;
}
async function remove(id: string): Promise<void> {
  const existing = await purchaseOrderRepository.findById(id);
  if (!existing) throw new AppError("Pedido de compra não encontrado", 404);
  if (!["draft", "cancelled"].includes(existing.status))
    throw new AppError(
      "Somente pedidos em rascunho ou cancelados podem ser excluídos",
      400,
    );
  await purchaseOrderRepository.remove(id);
}
export const purchaseOrderService = { list, getById, create, update, remove };
