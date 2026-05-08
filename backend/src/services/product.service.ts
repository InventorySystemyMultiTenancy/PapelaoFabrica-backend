import { CreateProductInput, Product, UpdateProductInput } from "../models/product.model";
import { productRepository } from "../repositories/product.repository";
import { AppError } from "../utils/app-error";

type PaperboardQuality = "CMCB" | "CMCBC";

interface NormalizedPaperboardFields {
  isPaperboardMaterial: boolean;
  length: number | null;
  width: number | null;
  height: number | null;
  quality: PaperboardQuality | null;
  gramatura: number | null;
}

const PAPERBOARD_GRAMATURA_BY_QUALITY: Record<PaperboardQuality, number> = {
  CMCB: 511,
  CMCBC: 651,
};

async function ensureProductNameAvailable(name: string, excludedId?: string): Promise<void> {
  const existingProduct = await productRepository.findByName(name);

  if (existingProduct && existingProduct.id !== excludedId) {
    throw new AppError("Product name is already in use", 409);
  }
}

async function listProducts(search?: string): Promise<Product[]> {
  return productRepository.findAll(search);
}

async function getProductById(id: string): Promise<Product> {
  const product = await productRepository.findById(id);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
}

function validateDimension(name: string, value: number | null): void {
  if (value === null || value === undefined) {
    throw new AppError("length, width and height are required for paperboard materials", 400);
  }

  if (value <= 0) {
    throw new AppError(`${name} must be greater than zero for paperboard materials`, 400);
  }
}

function normalizePaperboardFields(input: {
  isPaperboardMaterial: boolean;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  quality?: string | null;
}): NormalizedPaperboardFields {
  if (!input.isPaperboardMaterial) {
    return {
      isPaperboardMaterial: false,
      length: null,
      width: null,
      height: null,
      quality: null,
      gramatura: null,
    };
  }

  validateDimension("length", input.length ?? null);
  validateDimension("width", input.width ?? null);
  validateDimension("height", input.height ?? null);

  if (!input.quality) {
    throw new AppError("quality is required for paperboard materials", 400);
  }

  if (input.quality !== "CMCB" && input.quality !== "CMCBC") {
    throw new AppError("quality must be CMCB or CMCBC", 400);
  }

  const quality = input.quality;
  const gramatura = PAPERBOARD_GRAMATURA_BY_QUALITY[quality];

  return {
    isPaperboardMaterial: true,
    length: input.length ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    quality,
    gramatura,
  };
}

async function createProduct(payload: CreateProductInput): Promise<Product> {
  await ensureProductNameAvailable(payload.name);

  const paperboardFields = normalizePaperboardFields({
    isPaperboardMaterial: payload.isPaperboardMaterial ?? false,
    length: payload.length,
    width: payload.width,
    height: payload.height,
    quality: payload.quality,
  });

  return productRepository.create({
    ...payload,
    ...paperboardFields,
  });
}

async function updateProduct(id: string, payload: UpdateProductInput): Promise<Product> {
  const existingProduct = await productRepository.findById(id);

  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  const nextName = payload.name ?? existingProduct.name;
  const nextLowStockAlertQuantity =
    payload.lowStockAlertQuantity ?? existingProduct.lowStockAlertQuantity;

  if (nextName !== existingProduct.name) {
    await ensureProductNameAvailable(nextName, id);
  }

  const updatedProduct = await productRepository.update(id, {
    name: nextName,
    lowStockAlertQuantity: nextLowStockAlertQuantity,
    ...normalizePaperboardFields({
      isPaperboardMaterial: payload.isPaperboardMaterial ?? existingProduct.isPaperboardMaterial,
      length: payload.length !== undefined ? payload.length : existingProduct.length,
      width: payload.width !== undefined ? payload.width : existingProduct.width,
      height: payload.height !== undefined ? payload.height : existingProduct.height,
      quality: payload.quality !== undefined ? payload.quality : existingProduct.quality,
    }),
    sheetsPerBundle:
      payload.sheetsPerBundle !== undefined
        ? payload.sheetsPerBundle
        : existingProduct.sheetsPerBundle,
  });

  if (!updatedProduct) {
    throw new AppError("Product not found", 404);
  }

  return updatedProduct;
}

export const productService = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
};
