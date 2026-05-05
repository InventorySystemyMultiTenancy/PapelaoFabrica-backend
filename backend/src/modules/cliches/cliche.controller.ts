import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { clicheService } from "./cliche.service";

const list = asyncHandler(async (req: Request, res: Response) => {
  const clientId =
    typeof req.query.clientId === "string" ? req.query.clientId : undefined;
  const cliches = await clicheService.list(clientId);
  res.status(200).json({ data: cliches });
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const cliche = await clicheService.getById(req.params.id);
  res.status(200).json({ data: cliche });
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const cliche = await clicheService.create(req.body);
  res.status(201).json({ data: cliche });
});

const update = asyncHandler(async (req: Request, res: Response) => {
  const cliche = await clicheService.update(req.params.id, req.body);
  res.status(200).json({ data: cliche });
});

const remove = asyncHandler(async (req: Request, res: Response) => {
  await clicheService.remove(req.params.id);
  res.status(204).send();
});

export const clicheController = { list, getById, create, update, remove };
