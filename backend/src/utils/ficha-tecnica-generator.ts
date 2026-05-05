import PDFDocument from "pdfkit";
import { Response } from "express";

// ─── Paleta ──────────────────────────────────────────────────────────────────
const BLACK = "#000000";
const DARK = "#1a1a1a";
const GRAY = "#777777";
const LIGHT = "#f5f5f5";
const MID = "#cccccc";
const BLUE_FILL = "#c5d9f1"; // azul claro dos campos destacados (Cliente, Qtd.)

// ─── Dados da empresa ────────────────────────────────────────────────────────
const COMPANY_NAME = "4D EMBALAGENS LTDA";

// ─── Interface pública ───────────────────────────────────────────────────────
export interface FichaTecnicaData {
  // Cabeçalho
  orderNumber?: string;
  clientName?: string;
  openingDate?: string; // ISO ou dd/mm/yyyy

  // Identificação
  reference?: string;
  model?: string; // ex.: "CORTE VINCO" | "MALETA"

  // Dimensões em mm
  dimWidth?: number; // largura
  dimHeight?: number; // altura / comprimento
  dimDepth?: number; // profundidade (para maleta)

  // Qualidade / material
  quality?: string; // ex.: "CMCB"
  gramatura?: number; // ex.: 0.370
  impression?: boolean; // true = SIM
  colors?: string;

  // Fechamento / quantidade
  closing?: string;
  quantity?: number;

  // Cálculos automáticos (opcionais – calculados se ausentes)
  areaUnit?: number; // m²
  weightUnit?: number; // kg
  weightTotal?: number; // kg

  // Formatos (arrays com os valores numéricos da linha)
  formatImpressora?: number[]; // 9 valores
  formatRiscador?: number[]; // 9 valores
  numberOfBundles?: number;

  // Rodapé
  bundleCount?: string;
  pieceCount?: string;
  responsible?: string;
  observations?: string;
}

// ─── Função principal ────────────────────────────────────────────────────────
export function generateFichaTecnicaPDF(
  data: FichaTecnicaData,
  res: Response,
): void {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    info: { Title: "Ficha Técnica" },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="ficha-tecnica-${(data.orderNumber ?? "s-n").replace(/\s+/g, "-")}.pdf"`,
  );
  doc.pipe(res);

  const W = doc.page.width; // 595.28
  const H = doc.page.height; // 841.89
  const ML = 28; // margem esquerda
  const MR = 28; // margem direita
  const cW = W - ML - MR;

  let y = 18;

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const cell = (
    label: string,
    value: string,
    x: number,
    cy: number,
    w: number,
    h: number,
    opts: {
      fill?: string;
      bold?: boolean;
      labelSize?: number;
      valueSize?: number;
    } = {},
  ) => {
    // borda
    doc.rect(x, cy, w, h).stroke(MID);
    // fill opcional
    if (opts.fill) doc.rect(x, cy, w, h).fill(opts.fill).stroke(MID);

    const ls = opts.labelSize ?? 6.5;
    const vs = opts.valueSize ?? 8.5;
    const pad = 3;

    if (label) {
      doc
        .fillColor(GRAY)
        .fontSize(ls)
        .font("Helvetica")
        .text(label, x + pad, cy + pad, {
          width: w - pad * 2,
          lineBreak: false,
        });
    }
    if (value) {
      doc
        .fillColor(DARK)
        .fontSize(vs)
        .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
        .text(value, x + pad, cy + pad + (label ? ls + 1 : (h - vs) / 2 - 1), {
          width: w - pad * 2,
          lineBreak: false,
        });
    }
  };

  // label + valor na mesma linha horizontal
  const inlineCell = (
    label: string,
    value: string,
    x: number,
    cy: number,
    w: number,
    h: number,
    fill?: string,
  ) => {
    doc.rect(x, cy, w, h).stroke(MID);
    if (fill) doc.rect(x, cy, w, h).fill(fill).stroke(MID);
    const pad = 3;
    doc
      .fillColor(DARK)
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text(label, x + pad, cy + (h - 8) / 2, { continued: true });
    doc.font("Helvetica").fontSize(8).text(` ${value}`, { lineBreak: false });
  };

  const fmt = (v?: number) => (v != null ? String(v) : "");
  const fmtDate = (s?: string) => {
    if (!s) return "";
    if (s.includes("T")) return new Date(s).toLocaleDateString("pt-BR");
    return s;
  };
  const fmtDec = (v?: number) => (v != null ? v.toFixed(3) : "0,000");

  // ────────────────────────────────────────────────────────────────────────────
  // 1. CABEÇALHO
  // ────────────────────────────────────────────────────────────────────────────
  const HDR_H = 28;

  // Título central
  doc
    .fillColor(BLACK)
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(COMPANY_NAME, ML, y + (HDR_H - 14) / 2, {
      width: cW,
      align: "center",
    });

  // Caixa "Ficha Técnica" (canto superior direito)
  const ftW = 90;
  doc.rect(W - MR - ftW, y, ftW, HDR_H).stroke(DARK);
  doc
    .fillColor(DARK)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("Ficha Técnica", W - MR - ftW, y + (HDR_H - 9) / 2, {
      width: ftW,
      align: "center",
    });

  y += HDR_H + 6;

  // ────────────────────────────────────────────────────────────────────────────
  // 2. LINHA: NR. PEDIDO | CLIENTE | DATA DA ABERTURA
  // ────────────────────────────────────────────────────────────────────────────
  const ROW1_H = 22;
  const nrW = 90;
  const dateW = 95;
  const cliW = cW - nrW - dateW;

  inlineCell(`NR. PEDIDO -  ${data.orderNumber ?? ""}`, "", ML, y, nrW, ROW1_H);
  cell("Cliente.:", data.clientName ?? "", ML + nrW, y, cliW, ROW1_H, {
    fill: BLUE_FILL,
  });
  cell(
    "Data da Abertura",
    fmtDate(data.openingDate),
    W - MR - dateW,
    y,
    dateW,
    ROW1_H,
  );

  y += ROW1_H + 5;

  // ────────────────────────────────────────────────────────────────────────────
  // 3. BLOCO DE IDENTIFICAÇÃO (2 colunas)
  // ────────────────────────────────────────────────────────────────────────────
  const FIELD_H = 24;
  const halfW = cW / 2;

  // Linha: Referência | Modelo | Área / Peso
  const refW = halfW * 0.55;
  const modW = halfW * 0.45;
  const metrW = cW - halfW;

  cell("Referência.:", data.reference ?? "", ML, y, refW, FIELD_H);
  cell("Modelo.:", data.model ?? "CORTE VINCO", ML + refW, y, modW, FIELD_H);

  // Coluna direita: métricas empilhadas
  const metricH = FIELD_H / 3 + 1;
  const mx = ML + halfW;
  const mw = metrW;
  const metrics = [
    { label: "Área da Unidade (m2).:", value: fmtDec(data.areaUnit) },
    { label: "Peso da Unidade( Kg).:", value: fmtDec(data.weightUnit) },
    { label: "Peso Total.:( Kg).:", value: fmtDec(data.weightTotal) },
  ];
  metrics.forEach((m, i) => {
    const my = y + i * (FIELD_H / 3);
    doc.rect(mx, my, mw, FIELD_H / 3 + 0.5).stroke(MID);
    doc
      .fillColor(GRAY)
      .fontSize(6)
      .font("Helvetica")
      .text(m.label, mx + 2, my + 2, { width: mw * 0.65, lineBreak: false });
    doc
      .fillColor(DARK)
      .fontSize(7.5)
      .font("Helvetica-Bold")
      .text(m.value, mx + mw * 0.65, my + 2, {
        width: mw * 0.3,
        align: "right",
        lineBreak: false,
      });
  });

  y += FIELD_H + 2;

  // Linha: Dimensões
  const dimLabelW = 95;
  const dimValW = (halfW - dimLabelW) / 2;
  cell("Dimensões I. (mm).:", "", ML, y, dimLabelW, FIELD_H);
  cell("", fmt(data.dimWidth), ML + dimLabelW, y, dimValW, FIELD_H, {
    valueSize: 10,
    bold: true,
  });
  // "x" separador
  doc
    .fillColor(GRAY)
    .fontSize(9)
    .font("Helvetica")
    .text("x", ML + dimLabelW + dimValW + 2, y + 7, { lineBreak: false });
  cell(
    "",
    fmt(data.dimHeight),
    ML + dimLabelW + dimValW * 1 + 8,
    y,
    dimValW,
    FIELD_H,
    { valueSize: 10, bold: true },
  );
  if (data.dimDepth != null) {
    doc
      .fillColor(GRAY)
      .fontSize(9)
      .font("Helvetica")
      .text("x", ML + dimLabelW + dimValW * 2 + 10, y + 7, {
        lineBreak: false,
      });
    cell(
      "",
      fmt(data.dimDepth),
      ML + dimLabelW + dimValW * 2 + 18,
      y,
      dimValW,
      FIELD_H,
      { valueSize: 10, bold: true },
    );
  }

  y += FIELD_H + 2;

  // Linha: Qualidade | Gramatura | Impressão | Cores
  const qualW = halfW * 0.35;
  const qualVW = halfW * 0.15;
  const gramLW = halfW * 0.25;
  const gramVW = halfW * 0.25;
  const impW = metrW * 0.5;
  const coresW = metrW * 0.5;

  cell("Qualidade.:", data.quality ?? "CMCB", ML, y, qualW + qualVW, FIELD_H);
  cell(
    "Gramatura.:",
    data.gramatura != null ? data.gramatura.toFixed(3) : "",
    ML + qualW + qualVW,
    y,
    gramLW + gramVW,
    FIELD_H,
  );
  cell(
    "Impressão",
    data.impression !== false ? "SIM" : "NÃO",
    ML + halfW,
    y,
    impW,
    FIELD_H,
  );
  cell("Cores.:", data.colors ?? "", ML + halfW + impW, y, coresW, FIELD_H, {
    fill: data.colors ? BLUE_FILL : undefined,
  });

  y += FIELD_H + 2;

  // Linha: Fechamento | Quantidade
  const fechW = halfW * 0.35;
  const fechVW = halfW * 0.65;
  const qtdLW = metrW * 0.4;
  const qtdVW = metrW * 0.6;

  cell("Fechamento", data.closing ?? "", ML, y, fechW + fechVW, FIELD_H);
  cell(
    "Quantidade.:",
    data.quantity != null ? String(data.quantity) : "0",
    ML + halfW,
    y,
    qtdLW + qtdVW,
    FIELD_H,
    { fill: BLUE_FILL, bold: true, valueSize: 10 },
  );

  y += FIELD_H + 10;

  // ────────────────────────────────────────────────────────────────────────────
  // 4. ÁREA DO DIAGRAMA + TABELA DE APONTAMENTO
  // ────────────────────────────────────────────────────────────────────────────
  const DIAG_H = 160;
  const diagramW = cW * 0.62;
  const tableX = ML + diagramW + 10;
  const tableW = cW - diagramW - 10;

  // Diagrama simplificado da peça (retângulo + hachura no canto superior esquerdo)
  const dX = ML + 10;
  const dY = y + 8;
  const dW = diagramW - 30;
  const dH = DIAG_H - 20;

  // Dimensões acima do retângulo
  const wLabel = fmt(data.dimWidth ?? 0);
  doc
    .fillColor(DARK)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text(wLabel, dX + dW / 2 - 12, dY - 14, { lineBreak: false });
  doc
    .moveTo(dX, dY - 8)
    .lineTo(dX + dW / 2 - 16, dY - 8)
    .stroke(DARK);
  doc
    .moveTo(dX + dW / 2 + 4, dY - 8)
    .lineTo(dX + dW, dY - 8)
    .stroke(DARK);

  // Dimensão à esquerda do retângulo
  const hLabel = fmt(data.dimHeight ?? 0);
  doc
    .fillColor(DARK)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text(hLabel, dX - 24, dY + dH / 2 - 6, { lineBreak: false });
  doc
    .moveTo(dX - 8, dY)
    .lineTo(dX - 8, dY + dH / 2 - 10)
    .stroke(DARK);
  doc
    .moveTo(dX - 8, dY + dH / 2 + 8)
    .lineTo(dX - 8, dY + dH)
    .stroke(DARK);

  // Retângulo principal
  doc.rect(dX, dY, dW, dH).stroke(DARK);

  // Hachura triangular (canto superior esquerdo) imitando a dobra
  const hSize = Math.min(dW, dH) * 0.22;
  doc
    .moveTo(dX, dY + hSize)
    .lineTo(dX + hSize, dY)
    .lineTo(dX, dY)
    .closePath()
    .stroke(MID);
  // Linhas de hachura
  for (let i = 1; i <= 5; i++) {
    const s = (hSize / 6) * i;
    doc
      .moveTo(dX, dY + s)
      .lineTo(dX + s, dY)
      .stroke(MID);
  }

  // Tabela de apontamento (direita)
  const tRows = ["RISCADOR", "IMPRESSORA", "C. VINCO", "ACABAM."];
  const tCols = ["DATA", "QUANT.", "VISTO"];
  const tColW = [tableW * 0.36, tableW * 0.24, tableW * 0.22, tableW * 0.18];
  const tRowH = 18;
  const tHdrH = 16;

  // Cabeçalho da tabela
  doc.rect(tableX, y, tableW, tHdrH).fill(LIGHT).stroke(MID);
  let tx = tableX + tColW[0];
  tCols.forEach((col, i) => {
    doc
      .fillColor(DARK)
      .fontSize(7)
      .font("Helvetica-Bold")
      .text(col, tx, y + (tHdrH - 7) / 2, {
        width: tColW[i + 1],
        align: "center",
        lineBreak: false,
      });
    doc
      .moveTo(tx, y)
      .lineTo(tx, y + tHdrH)
      .stroke(MID);
    tx += tColW[i + 1];
  });
  let ty = y + tHdrH;

  // Linhas
  tRows.forEach((row) => {
    doc.rect(tableX, ty, tableW, tRowH).stroke(MID);
    doc
      .fillColor(DARK)
      .fontSize(7.5)
      .font("Helvetica")
      .text(row, tableX + 3, ty + (tRowH - 7.5) / 2, {
        width: tColW[0],
        lineBreak: false,
      });
    // divisórias verticais
    let vx = tableX + tColW[0];
    tColW.slice(1).forEach((w) => {
      doc
        .moveTo(vx, ty)
        .lineTo(vx, ty + tRowH)
        .stroke(MID);
      vx += w;
    });
    ty += tRowH;
  });

  y += DIAG_H + 8;

  // ────────────────────────────────────────────────────────────────────────────
  // 5. FORMATO IMPRESSORA / RISCADOR
  // ────────────────────────────────────────────────────────────────────────────
  const FMT_H = 18;
  const numCols = 9;
  const lblFmtW = 105;
  const numW = (cW - lblFmtW) / numCols;

  const drawFormatRow = (
    label: string,
    values: number[] | undefined,
    ry: number,
  ) => {
    cell(label, "", ML, ry, lblFmtW, FMT_H);
    const vals = values ?? Array(numCols).fill(0);
    vals.slice(0, numCols).forEach((v, i) => {
      doc.rect(ML + lblFmtW + i * numW, ry, numW, FMT_H).stroke(MID);
      doc
        .fillColor(DARK)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text(String(v || 0), ML + lblFmtW + i * numW, ry + (FMT_H - 8) / 2, {
          width: numW,
          align: "center",
          lineBreak: false,
        });
    });
  };

  drawFormatRow("FORMATO IMPRESSORA.:", data.formatImpressora, y);
  y += FMT_H + 2;
  drawFormatRow("FORMATO RISCADOR.:", data.formatRiscador, y);
  y += FMT_H + 4;

  // Numero de Amarrados
  const amarW = 90;
  cell("Numero de Amarrados.:", "", ML, y, lblFmtW, FMT_H);
  cell(
    "",
    data.numberOfBundles != null ? String(data.numberOfBundles) : "0",
    ML + lblFmtW,
    y,
    amarW,
    FMT_H,
    { fill: BLUE_FILL, bold: true },
  );

  y += FMT_H + 8;

  // ────────────────────────────────────────────────────────────────────────────
  // 6. RODAPÉ: CONTAGENS + RESPONSÁVEL
  // ────────────────────────────────────────────────────────────────────────────
  const ROD_H = 22;
  const thirdW = cW / 3;

  cell("CONTAGEM DE AMARRADOS.:", data.bundleCount ?? "", ML, y, thirdW, ROD_H);
  cell(
    "CONTAGEM DE PEÇAS.:",
    data.pieceCount ?? "",
    ML + thirdW,
    y,
    thirdW,
    ROD_H,
  );
  cell(
    "RESPONSAVEL.:",
    data.responsible ?? "",
    ML + thirdW * 2,
    y,
    thirdW,
    ROD_H,
  );

  y += ROD_H + 2;

  // Obs.
  const obsH = 22;
  const obsMinY = H - MR - obsH - 8;
  const obsY = Math.max(y, obsMinY - 2);

  cell("Obs.:", data.observations ?? "", ML, obsY, cW, obsH, {
    fill: "#ffff00",
  });

  doc.end();
}
