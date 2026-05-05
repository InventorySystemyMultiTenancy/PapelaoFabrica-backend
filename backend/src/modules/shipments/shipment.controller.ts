import { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { shipmentService } from "./shipment.service";

const listByOrder = asyncHandler(async (req: Request, res: Response) => {
  const shipments = await shipmentService.listByOrder(req.params.orderId);
  res.status(200).json({ data: shipments });
});

const getById = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await shipmentService.getById(req.params.id);
  res.status(200).json({ data: shipment });
});

const create = asyncHandler(async (req: Request, res: Response) => {
  const shipment = await shipmentService.createShipment(req.body);
  res.status(201).json({ data: shipment });
});

export const shipmentController = { listByOrder, getById, create };
