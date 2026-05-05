import { Router, Request, Response } from "express";
import {
  generateFichaTecnicaPDF,
  FichaTecnicaData,
} from "../utils/ficha-tecnica-generator";
import { requireAuth } from "../middlewares/auth.middleware";

const fichaTecnicaRoutes = Router();

/**
 * POST /api/ficha-tecnica/pdf
 * Gera a Ficha Técnica em PDF a partir de um body JSON com os campos da FichaTecnicaData.
 */
fichaTecnicaRoutes.post("/pdf", requireAuth, (req: Request, res: Response) => {
  const data: FichaTecnicaData = req.body;
  generateFichaTecnicaPDF(data, res);
});

export { fichaTecnicaRoutes };
