import { AppError } from "../../utils/app-error";
import { deliveryRouteRepository } from "./delivery-route.repository";
import {
  ConfirmDeliveryItemInput,
  CreateDeliveryRouteInput,
  DeliveryRoute,
  UpdateDeliveryRouteInput,
} from "./delivery-route.schema";

async function list(): Promise<DeliveryRoute[]> {
  return deliveryRouteRepository.findAll();
}

async function getById(id: string): Promise<DeliveryRoute> {
  const route = await deliveryRouteRepository.findById(id);
  if (!route) throw new AppError("Roteiro de entrega não encontrado", 404);
  return route;
}

async function create(input: CreateDeliveryRouteInput): Promise<DeliveryRoute> {
  return deliveryRouteRepository.create(input);
}

async function update(
  id: string,
  input: UpdateDeliveryRouteInput,
): Promise<DeliveryRoute> {
  const existing = await deliveryRouteRepository.findById(id);
  if (!existing) throw new AppError("Roteiro de entrega não encontrado", 404);

  // Auto-set departure when moving to in_transit
  if (
    input.status === "in_transit" &&
    !input.departureAt &&
    !existing.departureAt
  ) {
    input = { ...input, departureAt: new Date().toISOString() };
  }
  // Auto-set completion when completing
  if (
    input.status === "completed" &&
    !input.completedAt &&
    !existing.completedAt
  ) {
    input = { ...input, completedAt: new Date().toISOString() };
  }

  const updated = await deliveryRouteRepository.update(id, input);
  if (!updated) throw new AppError("Roteiro de entrega não encontrado", 404);
  return updated;
}

async function confirmItem(
  routeId: string,
  itemId: string,
  input: ConfirmDeliveryItemInput,
) {
  const route = await deliveryRouteRepository.findById(routeId);
  if (!route) throw new AppError("Roteiro de entrega não encontrado", 404);
  const item = route.items.find((i) => i.id === itemId);
  if (!item) throw new AppError("Item do roteiro não encontrado", 404);
  const updated = await deliveryRouteRepository.confirmItem(itemId, input);
  if (!updated) throw new AppError("Item do roteiro não encontrado", 404);
  return updated;
}

async function remove(id: string): Promise<void> {
  const existing = await deliveryRouteRepository.findById(id);
  if (!existing) throw new AppError("Roteiro de entrega não encontrado", 404);
  if (existing.status === "in_transit")
    throw new AppError("Não é possível excluir um roteiro em trânsito", 400);
  await deliveryRouteRepository.remove(id);
}

export const deliveryRouteService = {
  list,
  getById,
  create,
  update,
  confirmItem,
  remove,
};
