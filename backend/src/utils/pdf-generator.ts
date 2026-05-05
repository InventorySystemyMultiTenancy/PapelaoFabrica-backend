import PDFDocument from "pdfkit";
import { Budget } from "../../models/budget.model";

const BRAND_COLOR = "#f97316"; // orange-500
const DARK = "#1e1e1e";
const GRAY = "#6b7280";
const LIGHT_GRAY = "#f3f4f6";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function generateBudgetPDF(
  budget: Budget,
  res: import("express").Response,
): void {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="orcamento-${budget.id.slice(0, 8)}.pdf"`,
  );
  doc.pipe(res);

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 80).fill(DARK);

  // Company name
  doc
    .fillColor("#ffffff")
    .fontSize(20)
    .font("Helvetica-Bold")
    .text("4D PAPELÃO EMBALAGENS", 50, 22);

  doc
    .fillColor(BRAND_COLOR)
    .fontSize(10)
    .font("Helvetica")
    .text("Embalagens industriais de papelão", 50, 46);

  // Document label on right
  doc
    .fillColor("#ffffff")
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("ORÇAMENTO", doc.page.width - 160, 28, {
      width: 110,
      align: "right",
    });

  doc
    .fillColor(BRAND_COLOR)
    .fontSize(9)
    .font("Helvetica")
    .text(
      `Nº ${budget.id.slice(0, 8).toUpperCase()}`,
      doc.page.width - 160,
      47,
      { width: 110, align: "right" },
    );

  // ── Info block ───────────────────────────────────────────────────────────────
  const infoY = 100;
  doc
    .fillColor(DARK)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("DADOS DO ORÇAMENTO", 50, infoY);

  doc
    .moveTo(50, infoY + 14)
    .lineTo(doc.page.width - 50, infoY + 14)
    .strokeColor(BRAND_COLOR)
    .lineWidth(1.5)
    .stroke();

  const col1x = 50;
  const col2x = 300;
  let iy = infoY + 24;

  const info = (label: string, value: string, x: number, y: number) => {
    doc
      .fillColor(GRAY)
      .fontSize(8)
      .font("Helvetica")
      .text(label.toUpperCase(), x, y);
    doc
      .fillColor(DARK)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(value, x, y + 11);
  };

  info("Cliente", budget.clientName, col1x, iy);
  info("Emissão", formatDate(budget.createdAt), col2x, iy);
  iy += 38;

  info(
    "Categoria",
    budget.category === "arquitetonico" ? "Arquitetônico" : "Executivo",
    col1x,
    iy,
  );
  info(
    "Validade",
    `${budget.validityBusinessDays} dias úteis${!budget.isExpired ? ` (${budget.remainingValidityBusinessDays} restantes)` : " — EXPIRADO"}`,
    col2x,
    iy,
  );
  iy += 38;

  if (budget.estimatedDeliveryBusinessDays) {
    info(
      "Prazo de Entrega",
      `${budget.estimatedDeliveryBusinessDays} dia(s) útil(eis)`,
      col1x,
      iy,
    );
  }
  if (budget.paymentTerms) {
    info("Condições de Pagamento", budget.paymentTerms, col2x, iy);
  }
  iy += 38;

  if (budget.notes) {
    info("Observações", budget.notes, col1x, iy);
    iy += 38;
  }

  // ── Materials table ───────────────────────────────────────────────────────────
  iy += 10;
  doc
    .fillColor(DARK)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("ITENS DO ORÇAMENTO", 50, iy);
  doc
    .moveTo(50, iy + 14)
    .lineTo(doc.page.width - 50, iy + 14)
    .strokeColor(BRAND_COLOR)
    .lineWidth(1.5)
    .stroke();
  iy += 22;

  // Table header
  doc.rect(50, iy, doc.page.width - 100, 20).fill(DARK);
  doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
  const colItem = 55;
  const colQty = 310;
  const colUnit = 360;
  const colPrice = 410;
  const colTotal = 470;

  doc.text("ITEM / PRODUTO", colItem, iy + 6);
  doc.text("QTD", colQty, iy + 6, { width: 45, align: "right" });
  doc.text("UN", colUnit, iy + 6, { width: 40, align: "center" });
  doc.text("UNIT.", colPrice, iy + 6, { width: 55, align: "right" });
  doc.text("TOTAL", colTotal, iy + 6, { width: 65, align: "right" });
  iy += 20;

  // Table rows
  budget.materials.forEach((mat, idx) => {
    const rowH = 22;
    if (idx % 2 === 0) {
      doc.rect(50, iy, doc.page.width - 100, rowH).fill(LIGHT_GRAY);
    }

    const total = mat.unitPrice != null ? mat.quantity * mat.unitPrice : null;

    doc.fillColor(DARK).fontSize(9).font("Helvetica");
    doc.text(mat.productName, colItem, iy + 6, { width: 250, ellipsis: true });
    doc.text(String(mat.quantity), colQty, iy + 6, {
      width: 45,
      align: "right",
    });
    doc.text(mat.unit, colUnit, iy + 6, { width: 40, align: "center" });
    doc.text(
      mat.unitPrice != null ? formatCurrency(mat.unitPrice) : "—",
      colPrice,
      iy + 6,
      { width: 55, align: "right" },
    );
    doc.text(total != null ? formatCurrency(total) : "—", colTotal, iy + 6, {
      width: 65,
      align: "right",
    });

    iy += rowH;
  });

  // Bottom line
  doc
    .moveTo(50, iy)
    .lineTo(doc.page.width - 50, iy)
    .strokeColor("#d1d5db")
    .lineWidth(0.5)
    .stroke();
  iy += 12;

  // ── Totals ────────────────────────────────────────────────────────────────────
  const totalBlockX = doc.page.width - 220;
  const totalBlockW = 170;

  const totalRow = (
    label: string,
    value: string,
    bold = false,
    color = DARK,
  ) => {
    doc
      .fillColor(GRAY)
      .fontSize(8)
      .font("Helvetica")
      .text(label, totalBlockX, iy, { width: totalBlockW - 75 });
    doc
      .fillColor(color)
      .fontSize(bold ? 11 : 9)
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .text(value, totalBlockX + totalBlockW - 75, iy, {
        width: 75,
        align: "right",
      });
    iy += bold ? 18 : 14;
  };

  totalRow("Subtotal", formatCurrency(budget.totalPrice));
  totalRow(
    "TOTAL DO ORÇAMENTO",
    formatCurrency(budget.totalPrice),
    true,
    BRAND_COLOR,
  );

  // ── Footer ────────────────────────────────────────────────────────────────────
  const footerY = doc.page.height - 70;
  doc.rect(0, footerY, doc.page.width, 70).fill(DARK);

  doc
    .fillColor("#ffffff")
    .fontSize(8)
    .font("Helvetica")
    .text(
      "Este orçamento não tem valor fiscal. Sujeito a alterações sem aviso prévio após o prazo de validade.",
      50,
      footerY + 14,
      { width: doc.page.width - 100, align: "center" },
    );

  doc
    .fillColor(BRAND_COLOR)
    .fontSize(8)
    .text("4D Papelão Embalagens — www.4dpapelao.com.br", 50, footerY + 32, {
      width: doc.page.width - 100,
      align: "center",
    });

  doc.end();
}
