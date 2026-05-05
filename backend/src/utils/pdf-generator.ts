import PDFDocument from "pdfkit";
import { Budget, BudgetMaterial } from "../models/budget.model";

// ─── Paleta fiel ao modelo 4D Embalagens ───────────────────────────────────
const DARK = "#1a1a1a";
const GRAY = "#555555";
const LIGHT_GRAY = "#f2f2f2";
const MID_GRAY = "#dddddd";
const BLACK = "#000000";

// Empresa – dados centralizados (idênticos ao PDF modelo)
const COMPANY = {
  name: "4D EMBALAGENS LTDA",
  address: "Rua Benedito Passos, 160 - Vila Matilde - SP",
  cnpj: "CNPJ: 62.728.414/0001-99",
  tel: "Tel: (11) 2651-4292 | Cel: (11) 95266-1751",
  email: "daniel@4dembalagens.com.br",
  contact: "Daniel Visnardi",
  dept: "Dpto Comercial",
  cell: "(11) 95266-1751",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function generateBudgetPDF(
  budget: Budget,
  res: import("express").Response,
): void {
  const doc = new PDFDocument({ margin: 45, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="orcamento-${budget.id.slice(0, 8)}.pdf"`,
  );
  doc.pipe(res);

  const W = doc.page.width; // 595.28
  const margin = 45;
  const cW = W - margin * 2; // usable content width

  // ── 1. CABEÇALHO: logo à esquerda + dados empresa à direita ─────────────────
  // Bloco empresa (canto superior direito, alinhado à direita)
  const companyX = W / 2;
  const companyW = W - companyX - margin;
  let headerY = margin;

  doc
    .fillColor(DARK)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(COMPANY.name, companyX, headerY, { width: companyW, align: "right" });
  headerY += 14;
  doc
    .fillColor(GRAY)
    .fontSize(9)
    .font("Helvetica")
    .text(COMPANY.address, companyX, headerY, {
      width: companyW,
      align: "right",
    });
  headerY += 12;
  doc.text(COMPANY.cnpj, companyX, headerY, {
    width: companyW,
    align: "right",
  });
  headerY += 12;
  doc.text(COMPANY.tel, companyX, headerY, { width: companyW, align: "right" });

  // ── 2. TÍTULO ────────────────────────────────────────────────────────────────
  const titleY = margin + 70;
  doc
    .fillColor(BLACK)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text("Orçamento", margin, titleY, { width: cW, align: "center" });

  // ── 3. BLOCO CLIENTE / PROPOSTA (caixa cinza dividida em 2 colunas) ─────────
  const boxY = titleY + 28;
  const boxH = 70;
  const halfW = cW / 2;

  // Fundo cinza claro
  doc.rect(margin, boxY, cW, boxH).fill(LIGHT_GRAY).stroke();

  // Linha vertical divisória
  doc
    .moveTo(margin + halfW, boxY)
    .lineTo(margin + halfW, boxY + boxH)
    .strokeColor(MID_GRAY)
    .lineWidth(0.8)
    .stroke();

  // Bordas da caixa
  doc.rect(margin, boxY, cW, boxH).stroke(MID_GRAY);

  // Coluna esquerda: dados do cliente
  const lX = margin + 8;
  const rX = margin + halfW + 8;
  let bY = boxY + 8;

  const fieldLine = (
    label: string,
    value: string,
    x: number,
    y: number,
    w: number,
  ) => {
    doc
      .fillColor(BLACK)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text(`${label}: `, x, y, { continued: true, width: w });
    doc.font("Helvetica").text(value || "");
  };

  // Nome do cliente pode estar em budget.clientName
  const clientName = (budget as { clientName?: string }).clientName ?? "";
  const responsible = (budget as { responsible?: string }).responsible ?? "";
  const clientEmail = (budget as { clientEmail?: string }).clientEmail ?? "";
  const clientPhone = (budget as { clientPhone?: string }).clientPhone ?? "";

  fieldLine("Cliente", clientName, lX, bY, halfW - 16);
  bY += 13;
  fieldLine("Responsável", responsible, lX, bY, halfW - 16);
  bY += 13;
  fieldLine("E-mail", clientEmail, lX, bY, halfW - 16);
  bY += 13;
  fieldLine("Telefone", clientPhone, lX, bY, halfW - 16);

  // Coluna direita: número da proposta + data de entrega
  let rY = boxY + 8;
  fieldLine(
    "Nº da Proposta",
    budget.id.slice(0, 8).toUpperCase(),
    rX,
    rY,
    halfW - 16,
  );
  rY += 13;
  fieldLine(
    "Data da Entrega",
    formatDate(budget.deliveryDate),
    rX,
    rY,
    halfW - 16,
  );
  rY += 13;
  if (budget.paymentTerms) {
    fieldLine("Pagamento", budget.paymentTerms, rX, rY, halfW - 16);
    rY += 13;
  }
  if (budget.estimatedDeliveryBusinessDays) {
    fieldLine(
      "Prazo (d.u.)",
      `${budget.estimatedDeliveryBusinessDays} dia(s)`,
      rX,
      rY,
      halfW - 16,
    );
  }

  // ── 4. TABELA DE PRODUTOS ────────────────────────────────────────────────────
  let tY = boxY + boxH + 20;

  // Cabeçalho da tabela
  const colDesc = margin;
  const colQty = margin + cW - 185;
  const colUnit = margin + cW - 130;
  const colTotal = margin + cW - 70;
  const descW = cW - 185;
  const numW = 55;

  // Fundo cabeçalho
  doc.rect(margin, tY, cW, 18).fill(LIGHT_GRAY).stroke(MID_GRAY);

  doc.fillColor(DARK).fontSize(8).font("Helvetica-Bold");
  doc.text("Descrição dos Produtos", colDesc + 4, tY + 5, {
    width: descW,
    align: "left",
  });
  doc.text("Qtd.", colQty, tY + 5, { width: numW, align: "center" });
  doc.text("R$ Unid.", colUnit, tY + 5, { width: numW, align: "right" });
  doc.text("R$ TOTAL", colTotal, tY + 5, { width: numW, align: "right" });
  tY += 18;

  // Linhas dos produtos
  budget.materials.forEach((mat: BudgetMaterial, idx: number) => {
    const rowH = 20;
    const fill = idx % 2 === 0 ? "#ffffff" : LIGHT_GRAY;
    doc.rect(margin, tY, cW, rowH).fill(fill).stroke(MID_GRAY);

    const total = mat.unitPrice != null ? mat.quantity * mat.unitPrice : null;

    doc.fillColor(BLACK).fontSize(8.5).font("Helvetica");
    doc.text(mat.productName, colDesc + 4, tY + 5, {
      width: descW - 8,
      ellipsis: true,
    });
    doc.text(String(mat.quantity), colQty, tY + 5, {
      width: numW,
      align: "center",
    });
    doc.text(
      mat.unitPrice != null
        ? mat.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
        : "",
      colUnit,
      tY + 5,
      { width: numW, align: "right" },
    );
    doc.text(
      total != null
        ? total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
        : "",
      colTotal,
      tY + 5,
      { width: numW, align: "right" },
    );

    tY += rowH;
  });

  // Linha final da tabela
  doc
    .rect(
      margin,
      tY - budget.materials.length * 20,
      cW,
      budget.materials.length * 20,
    )
    .stroke(MID_GRAY);

  // Última célula de "Total R$" no canto inferior direito da tabela
  doc
    .rect(colTotal - 4, tY, numW + 4, 18)
    .fill(LIGHT_GRAY)
    .stroke(MID_GRAY);
  doc
    .fillColor(DARK)
    .fontSize(8)
    .font("Helvetica-Bold")
    .text("Total R$", colTotal, tY + 5, { width: numW - 2, align: "right" });
  tY += 18;

  // ── 5. TOTAIS + DADOS ADICIONAIS (duas colunas) ──────────────────────────────
  tY += 20;
  const totalsX = margin;
  const totalsW = cW / 2 - 10;
  const dadosX = margin + cW / 2 + 10;
  const totalsStartY = tY;

  // "Totais" (sublinhado)
  doc
    .fillColor(BLACK)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Totais", totalsX, tY);
  doc
    .moveTo(totalsX, tY + 13)
    .lineTo(totalsX + 50, tY + 13)
    .strokeColor(BLACK)
    .lineWidth(0.8)
    .stroke();
  tY += 20;

  const totalRow = (label: string, value: string) => {
    doc
      .fillColor(BLACK)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text(label, totalsX, tY, { continued: true, width: totalsW });
    doc.font("Helvetica").text(value);
    tY += 14;
  };

  const freight = (budget as { freightValue?: number }).freightValue ?? 0;
  const grandTotal = budget.totalPrice + freight;

  totalRow("Valor do Frete:", freight > 0 ? formatCurrency(freight) : "");
  totalRow("Valor Total:", formatCurrency(grandTotal));

  // "Dados Adicionais" (sublinhado)
  let dY = totalsStartY;
  doc
    .fillColor(BLACK)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Dados Adicionais", dadosX, dY);
  doc
    .moveTo(dadosX, dY + 13)
    .lineTo(dadosX + 110, dY + 13)
    .strokeColor(BLACK)
    .lineWidth(0.8)
    .stroke();
  dY += 20;

  if (budget.notes) {
    doc
      .fillColor(GRAY)
      .fontSize(8.5)
      .font("Helvetica")
      .text(budget.notes, dadosX, dY, { width: cW / 2 - 10 });
  }

  // ── 6. ASSINATURA DO VENDEDOR ────────────────────────────────────────────────
  const sigY = Math.max(tY, dY) + 30;
  doc.fillColor(BLACK).fontSize(9).font("Helvetica").text("Att", margin, sigY);
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").text(COMPANY.contact, margin);
  doc
    .font("Helvetica")
    .text(COMPANY.dept, margin)
    .text(COMPANY.cell, margin)
    .text(COMPANY.email, margin);

  doc.end();
}
