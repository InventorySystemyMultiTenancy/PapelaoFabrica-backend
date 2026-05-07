import { AppError } from "../../utils/app-error";
import { budgetRepository } from "../../repositories/budget.repository";
import { paperboardRepository } from "./paperboard.repository";
import {
  CreatePaperboardConfigInput,
  PaperboardConfig,
} from "./paperboard.schema";

async function getConfig(budgetId: string): Promise<PaperboardConfig> {
  const config = await paperboardRepository.findByBudgetId(budgetId);
  if (!config) {
    throw new AppError("Paperboard config not found for this budget", 404);
  }
  return config;
}

async function upsertConfig(
  budgetId: string,
  input: CreatePaperboardConfigInput,
): Promise<PaperboardConfig> {
  const budget = await budgetRepository.findById(budgetId);
  if (!budget) {
    throw new AppError("Budget not found", 404);
  }

  // outsourcedCut only allowed when quantity >= 500
  if (input.outsourcedCut && input.quantity < 500) {
    throw new AppError(
      "outsourcedCut só é permitido quando quantity >= 500kg",
      422,
    );
  }

  if (
    input.sheetsPerBundle !== undefined &&
    input.sheetsPerBundle !== null &&
    input.sheetsPerBundle <= 0
  ) {
    throw new AppError("sheetsPerBundle deve ser maior que zero", 422);
  }

  if (
    input.lossPercentage !== undefined &&
    (input.lossPercentage < 0 || input.lossPercentage > 100)
  ) {
    throw new AppError("lossPercentage deve estar entre 0 e 100", 422);
  }

  // clichê data required only on first purchase
  if (input.isFirstPurchase) {
    if (input.clicheCost === undefined || input.clicheCost === null) {
      throw new AppError("clicheCost é obrigatório na primeira compra", 422);
    }
    if (input.clichePrice === undefined || input.clichePrice === null) {
      throw new AppError("clichePrice é obrigatório na primeira compra", 422);
    }
  }

  const config = await paperboardRepository.upsert(budgetId, input);

  const totalCost = Number(config.estimatedCost.toFixed(2));
  const totalPrice = Number(config.suggestedPrice.toFixed(2));
  const safeProfitValue = Math.max(totalPrice - totalCost, 0);
  const safeProfitMargin = totalCost > 0 ? safeProfitValue / totalCost : 0;

  await budgetRepository.save(budgetId, {
    clientName: budget.clientName,
    category: budget.category,
    description: budget.description,
    status: budget.status,
    estimatedDeliveryBusinessDays: budget.estimatedDeliveryBusinessDays,
    paymentTerms: budget.paymentTerms,
    deliveryDate: budget.deliveryDate,
    totalPrice,
    totalCost,
    freightValue: budget.freightValue,
    costsApplicableValue: budget.costsApplicableValue,
    laborCost: budget.laborCost,
    profitMargin: safeProfitMargin,
    profitValue: safeProfitValue,
    notes: budget.notes,
    approvedAt: budget.approvedAt,
    materials: budget.materials,
    expenseDepartments: budget.expenseDepartments,
  });

  return config;
}

async function removeConfig(budgetId: string): Promise<void> {
  const budget = await budgetRepository.findById(budgetId);
  if (!budget) {
    throw new AppError("Budget not found", 404);
  }
  await paperboardRepository.remove(budgetId);
}

export const paperboardService = { getConfig, upsertConfig, removeConfig };
