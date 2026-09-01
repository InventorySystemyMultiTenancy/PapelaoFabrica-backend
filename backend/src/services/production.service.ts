import {
  ApprovedBudgetProductionSummary,
  AdvanceProductionStatusInput,
  CreateProductionInput,
  Production,
  ProductionStageOption,
  SetProductionStatusesInput,
} from "../models/production.model";
import { budgetRepository } from "../repositories/budget.repository";
import { employeeRepository } from "../repositories/employee.repository";
import { productionRepository } from "../repositories/production.repository";
import { teamRepository } from "../repositories/team.repository";
import { AppError } from "../utils/app-error";

async function listProductions(
  employeeId?: string,
  activeOnly = false,
): Promise<Production[]> {
  if (employeeId) {
    const employee = await employeeRepository.findById(employeeId);

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }
  }

  return productionRepository.findAll({
    employeeId,
    activeOnly,
  });
}

async function createProduction(
  payload: CreateProductionInput,
): Promise<Production> {
  let installationTeamName: string | null = null;

  if (payload.installationTeamId) {
    const team = await teamRepository.findById(payload.installationTeamId);
    if (team) {
      installationTeamName = team.name;
    }
  }

  return productionRepository.create({
    ...payload,
    installationTeam: installationTeamName,
  });
}

async function listApprovedBudgetsForProduction(): Promise<
  ApprovedBudgetProductionSummary[]
> {
  const result = await budgetRepository.findAll({
    status: "approved",
    page: 1,
    limit: 100,
  });

  return result.data.map((budget) => ({
    id: budget.id,
    clientName: budget.clientName,
    description: budget.description,
    category: budget.category,
    totalCost: budget.totalCost,
    costsApplicableValue: budget.costsApplicableValue,
    profitValue: budget.profitValue,
    profitMargin: budget.profitMargin,
    profitMarginPercentage: budget.profitMarginPercentage,
    finalPrice: budget.finalPrice,
  }));
}

async function listProductionStatusOptions(): Promise<ProductionStageOption[]> {
  return productionRepository.listStatusOptions();
}

async function completeProduction(id: string): Promise<Production> {
  const production = await productionRepository.complete(id);

  if (!production) {
    throw new AppError("Production not found", 404, { productionId: id });
  }

  return production;
}

async function setProductionStatuses(
  id: string,
  payload: SetProductionStatusesInput,
): Promise<Production> {
  const production = await productionRepository.setStatuses(id, payload);

  if (!production) {
    throw new AppError("Production not found", 404, { productionId: id });
  }

  return production;
}

async function advanceProductionStatus(
  id: string,
  payload: AdvanceProductionStatusInput,
): Promise<Production> {
  const production = await productionRepository.advanceStatus(id, payload);

  if (!production) {
    throw new AppError("Production not found", 404, { productionId: id });
  }

  return production;
}

async function removeProduction(id: string): Promise<void> {
  const removed = await productionRepository.remove(id);

  if (!removed) {
    throw new AppError("Production not found", 404, { productionId: id });
  }
}

export const productionService = {
  listProductions,
  listProductionStatusOptions,
  listApprovedBudgetsForProduction,
  createProduction,
  completeProduction,
  setProductionStatuses,
  advanceProductionStatus,
  removeProduction,
};
