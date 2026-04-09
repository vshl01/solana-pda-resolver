import express from "express";
import { registryRouter } from "./routes/registry.routes";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/registry", registryRouter);
  return app;
}
