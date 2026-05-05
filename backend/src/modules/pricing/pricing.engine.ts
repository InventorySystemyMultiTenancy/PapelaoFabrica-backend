import { z } from "zod";

/**
 * Motor de precificação de embalagens de papelão.
 *
 * Fórmula base:
 *  1. Calcular a área da chapa desenvolvida (blanck):
 *     blanck_width  = comprimento + 2 * altura + folga
 *     blanck_height = largura + 2 * altura + folga
 *
 *  2. Calcular quantas peças cabem por folha padrão (ex: 1600 x 2800 mm):
 *     pecas_por_folha = floor(sheet_w / blanck_w) * floor(sheet_h / blanck_h)
 *
 *  3. Calcular gramatura e peso por folha:
 *     area_folha_m2 = sheet_w * sheet_h / 1_000_000
 *     peso_folha_kg = area_folha_m2 * gramatura / 1000
 *
 *  4. Folhas necessárias por quantidade pedida (com perda):
 *     folhas_necessarias = ceil(quantidade / pecas_por_folha) * (1 + fator_perda)
 *     peso_total_kg = folhas_necessarias * peso_folha_kg
 *
 *  5. Custo de material:
 *     custo_material = peso_total_kg * preco_kg
 *
 *  6. Custo de impressão:
 *     custo_impressao = quantidade * custo_por_cor * num_cores
 *
 *  7. Custo total + margem:
 *     custo_total = custo_material + custo_impressao + custo_fixo
 *     preco_venda = custo_total / (1 - margem_percentual / 100)
 */

// Dimensões padrão de folha de papelão (em mm)
const DEFAULT_SHEET_WIDTH_MM = 1600;
const DEFAULT_SHEET_HEIGHT_MM = 2800;
// Folga de corte/vinco (mm)
const DEFAULT_FOLGA_MM = 10;
// Fator de perda padrão (10%)
const DEFAULT_LOSS_FACTOR = 0.1;

export const quotationInputSchema = z.object({
  // Dimensões da caixa em mm
  comprimentoMm: z.number().positive("comprimento deve ser positivo"),
  larguraMm: z.number().positive("largura deve ser positiva"),
  alturaMm: z.number().positive("altura deve ser positiva"),

  // Gramatura do papel (g/m²) — ex: 150, 200, 250
  gramatura: z.number().positive("gramatura deve ser positiva"),

  // Número de cores de impressão (0 = sem impressão)
  numCores: z.number().int().min(0).max(10).default(0),

  // Custo por kg de matéria-prima (R$)
  precoPorKg: z.number().positive("preço por kg deve ser positivo"),

  // Custo por cor por unidade (R$)
  custoPorCorUnidade: z.number().min(0).default(0),

  // Custo fixo por lote (ex: setup, frete) (R$)
  custoFixoLote: z.number().min(0).default(0),

  // Margem de lucro desejada (%) — ex: 30 = 30%
  margemPercent: z.number().min(0).max(99).default(30),

  // Dimensões da folha padrão (mm) — opcional, usa padrão se não informado
  sheetWidthMm: z.number().positive().optional(),
  sheetHeightMm: z.number().positive().optional(),

  // Fator de perda (0.10 = 10%) — opcional
  lossFactor: z.number().min(0).max(1).optional(),

  // Quantidades a cotar (ex: [300, 500, 1000])
  quantities: z.array(z.number().int().positive()).min(1).max(10),
});

export type QuotationInput = z.infer<typeof quotationInputSchema>;

export interface QuantityBreakdown {
  quantity: number;
  sheetsNeeded: number;
  totalWeightKg: number;
  materialCost: number;
  printingCost: number;
  fixedCost: number;
  totalCost: number;
  salePrice: number;
  unitCost: number;
  unitSalePrice: number;
  grossMarginPercent: number;
}

export interface QuotationResult {
  input: QuotationInput;
  blankWidthMm: number;
  blankHeightMm: number;
  piecesPerSheet: number;
  sheetWeightKg: number;
  breakdowns: QuantityBreakdown[];
}

export function calculateQuotation(input: QuotationInput): QuotationResult {
  const sheetW = input.sheetWidthMm ?? DEFAULT_SHEET_WIDTH_MM;
  const sheetH = input.sheetHeightMm ?? DEFAULT_SHEET_HEIGHT_MM;
  const folga = DEFAULT_FOLGA_MM;
  const lossFactor = input.lossFactor ?? DEFAULT_LOSS_FACTOR;

  // 1. Blanck (área desenvolvida da caixa)
  const blankW = input.comprimentoMm + 2 * input.alturaMm + folga;
  const blankH = input.larguraMm + 2 * input.alturaMm + folga;

  // 2. Peças por folha
  const piecesPerSheet =
    Math.floor(sheetW / blankW) * Math.floor(sheetH / blankH);
  if (piecesPerSheet < 1) {
    throw new Error(
      "As dimensões da caixa são maiores que a folha padrão. Ajuste as dimensões.",
    );
  }

  // 3. Peso por folha
  const sheetAreaM2 = (sheetW * sheetH) / 1_000_000;
  const sheetWeightKg = (sheetAreaM2 * input.gramatura) / 1000;

  // 4. Calcular por quantidade
  const breakdowns: QuantityBreakdown[] = input.quantities.map((qty) => {
    const sheetsBase = Math.ceil(qty / piecesPerSheet);
    const sheetsNeeded = Math.ceil(sheetsBase * (1 + lossFactor));
    const totalWeightKg = sheetsNeeded * sheetWeightKg;

    const materialCost = totalWeightKg * input.precoPorKg;
    const printingCost = qty * input.custoPorCorUnidade * input.numCores;
    const fixedCost = input.custoFixoLote;
    const totalCost = materialCost + printingCost + fixedCost;

    // Preço de venda com margem (markup sobre custo)
    const salePrice = totalCost / (1 - input.margemPercent / 100);

    const unitCost = totalCost / qty;
    const unitSalePrice = salePrice / qty;
    const grossMarginPercent = ((salePrice - totalCost) / salePrice) * 100;

    return {
      quantity: qty,
      sheetsNeeded,
      totalWeightKg: Math.round(totalWeightKg * 1000) / 1000,
      materialCost: Math.round(materialCost * 100) / 100,
      printingCost: Math.round(printingCost * 100) / 100,
      fixedCost: Math.round(fixedCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      salePrice: Math.round(salePrice * 100) / 100,
      unitCost: Math.round(unitCost * 10000) / 10000,
      unitSalePrice: Math.round(unitSalePrice * 10000) / 10000,
      grossMarginPercent: Math.round(grossMarginPercent * 100) / 100,
    };
  });

  return {
    input,
    blankWidthMm: Math.round(blankW * 100) / 100,
    blankHeightMm: Math.round(blankH * 100) / 100,
    piecesPerSheet,
    sheetWeightKg: Math.round(sheetWeightKg * 10000) / 10000,
    breakdowns,
  };
}
