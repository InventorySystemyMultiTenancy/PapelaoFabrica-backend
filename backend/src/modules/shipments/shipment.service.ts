import { AppError } from "../../utils/app-error";
import { orderRepository } from "../orders/order.repository";
import { shipmentRepository } from "./shipment.repository";
import { CreateShipmentInput, Shipment } from "./shipment.schema";

async function listByOrder(orderId: string): Promise<Shipment[]> {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  return shipmentRepository.findByOrderId(orderId);
}

async function getById(id: string): Promise<Shipment> {
  const shipment = await shipmentRepository.findById(id);
  if (!shipment) throw new AppError("Shipment not found", 404);
  return shipment;
}

async function createShipment(input: CreateShipmentInput): Promise<Shipment> {
  const order = await orderRepository.findById(input.orderId);
  if (!order) throw new AppError("Order not found", 404);

  // Validate each item: quantity shipped cannot exceed quantity produced
  for (const inputItem of input.items) {
    const orderItem = order.items.find((i) => i.id === inputItem.orderItemId);
    if (!orderItem) {
      throw new AppError(`Order item ${inputItem.orderItemId} not found`, 404);
    }

    const newShipped = orderItem.quantityShipped + inputItem.quantity;
    if (newShipped > orderItem.quantityProduced) {
      throw new AppError(
        `Quantidade a expedir (${newShipped}) excede o produzido (${orderItem.quantityProduced}) para o item ${orderItem.description}`,
        422,
      );
    }
  }

  const shipment = await shipmentRepository.create(input);

  // Update quantity_shipped on each order item
  for (const item of input.items) {
    await orderRepository.addToItemShipped(item.orderItemId, item.quantity);
  }

  // Recalculate order status
  await orderRepository.recalcOrderStatus(input.orderId);

  return shipment;
}

export const shipmentService = { listByOrder, getById, createShipment };
