import { AppError } from "../../utils/app-error";
import { budgetRepository } from "../../repositories/budget.repository";
import { paperboardRepository } from "./paperboard.repository";
import { CreatePaperboardConfigInput, PaperboardConfig } from "./paperboard.schema";

async function getConfig(budgetId: string): Promise<PaperboardConfig> {
  const config = await paperboardRepository.findByBudgetId(budgetId);
  if (!config) {
    throw new AppError("Paperboard config not found for this budget", 404);
  }
  return config;
}

async function upsertConfig(budgetId: string, input: CreatePaperboardConfigInput): Promise<PaperboardConfig> {
  const budget = await budgetRepository.findById(budgetId);
  if (!budget) {
    throw new AppError("Budget not found", 404);
  }

  // outsourcedCut only allowed when quantity >= 500
  if (input.outsourcedCut && input.quantity < 500) {
    throw new AppError("outsourcedCut só é permitido quando quantity >= 500kg", 422);
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

  return paperboardRepository.upsert(budgetId, input);
}

async function removeConfig(budgetId: string): Promise<void> {
  const budget = await budgetRepository.findById(budgetId);
  if (!budget) {
    throw new AppError("Budget not found", 404);
  }
  await paperboardRepository.remove(budgetId);
}

export const paperboardService = { getConfig, upsertConfig, removeConfig };
