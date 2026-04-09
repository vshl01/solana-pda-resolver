import { Request, Response } from "express";
import { HttpError } from "../types/api.types";
import { registryService } from "../services/registry.service";

function handleError(error: unknown, res: Response): Response {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  return res.status(500).json({ error: "Internal server error" });
}

export class RegistryController {
  registerTopLevel(req: Request, res: Response): Response {
    try {
      const result = registryService.registerTopLevel(req.body);
      return res.status(201).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  resolveTopLevel(req: Request, res: Response): Response {
    try {
      const { programId, name } = req.params;
      const result = registryService.resolveTopLevel(programId, name);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  registerSubName(req: Request, res: Response): Response {
    try {
      const result = registryService.registerSubName(req.body);
      return res.status(201).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  resolveSubName(req: Request, res: Response): Response {
    try {
      const { programId, parentName, subName } = req.params;
      const result = registryService.resolveSubName(programId, parentName, subName);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  transferOwnership(req: Request, res: Response): Response {
    try {
      const result = registryService.transferOwnership(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  verifyPda(req: Request, res: Response): Response {
    try {
      const result = registryService.verifyPda(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  listTopLevel(req: Request, res: Response): Response {
    try {
      const { programId } = req.params;
      const owner =
        typeof req.query.owner === "string" ? req.query.owner : undefined;
      const result = registryService.listTopLevel(programId, owner);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }

  listSubNames(req: Request, res: Response): Response {
    try {
      const { programId, name } = req.params;
      const result = registryService.listSubNames(programId, name);
      return res.status(200).json(result);
    } catch (error) {
      return handleError(error, res);
    }
  }
}

export const registryController = new RegistryController();
