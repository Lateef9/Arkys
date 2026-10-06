import cors from "cors";
import express from "express";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { encounterRouter } from "./routes/encounter.routes.js";
import { evaluationRouter } from "./routes/evaluation.routes.js";
import { eventRouter } from "./routes/event.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { patientRouter } from "./routes/patient.routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/health", healthRouter);
  app.use("/api/patients", patientRouter);
  app.use("/api/encounters", encounterRouter);
  app.use("/api/events", eventRouter);
  app.use("/api/evaluation", evaluationRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
