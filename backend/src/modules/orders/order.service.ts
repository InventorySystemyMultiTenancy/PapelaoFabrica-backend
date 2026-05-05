import { AppError } from "../../utils/app-error";
import { budgetRepository } from "../../repositories/budget.repository";
import { orderRepository } from "./order.repository";
import {
  CreateOrderInput,
  ListOrdersQueryInput,
  Order,
  OrderItem,
  UpdateOrderItemInput,
} from "./order.schema";

async function listOrders(query: ListOrdersQueryInput): Promise<Order[]> {
  return orderRepository.findAll(query);
}

async function getOrderById(id: string): Promise<Order> {
  const order = await orderRepository.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  return order;
}

async function createOrder(input: CreateOrderInput): Promise<Order> {
  const budget = await budgetRepository.findById(input.budgetId);
  if (!budget) throw new AppError("Budget not found", 404);
  if (budget.status !== "approved") {
    throw new AppError("Pedido só pode ser criado a partir de um orçamento aprovado", 422);
  }
  return orderRepository.create(input);
}

async function updateItemProduced(
  orderId: string,
  itemId: string,
  input: UpdateOrderItemInput,
): Promise<OrderItem> {
  const order = await orderRepository.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);

  const item = order.items.find((i) => i.id === itemId);
  if (!item) throw new AppError("Order item not found", 404);

  if (input.quantityProduced !== undefined) {
    if (input.quantityProduced > item.quantityTotal) {
      throw new AppError("quantityProduced não pode ser maior que quantityTotal", 422);
    }
    if (input.quantityProduced < item.quantityShipped) {
      throw new AppError("quantityProduced não pode ser menor que quantityShipped", 422);
    }
  }

  const updated = await orderRepository.updateItemProduced(itemId, input.quantityProduced ?? item.quantityProduced);
  if (!updated) throw new AppError("Order item not found", 404);
  return updated;
}

export const orderService = { listOrders, getOrderById, createOrder, updateItemProduced };
