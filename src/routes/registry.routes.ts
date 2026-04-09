import { Router } from "express";
import { registryController } from "../controllers/registry.controller";

export const registryRouter = Router();

registryRouter.post("/register", (req, res) =>
  registryController.registerTopLevel(req, res),
);
registryRouter.get("/resolve/:programId/:name", (req, res) =>
  registryController.resolveTopLevel(req, res),
);
registryRouter.post("/sub/register", (req, res) =>
  registryController.registerSubName(req, res),
);
registryRouter.get("/sub/resolve/:programId/:parentName/:subName", (req, res) =>
  registryController.resolveSubName(req, res),
);
registryRouter.post("/transfer", (req, res) =>
  registryController.transferOwnership(req, res),
);
registryRouter.post("/verify", (req, res) =>
  registryController.verifyPda(req, res),
);
registryRouter.get("/list/:programId", (req, res) =>
  registryController.listTopLevel(req, res),
);
registryRouter.get("/list/:programId/:name/subs", (req, res) =>
  registryController.listSubNames(req, res),
);
