/**
 * Express app configuration (separated from server for testing)
 *
 * WHY SEPARATE?
 * This pattern is essential for testing. We export the app WITHOUT
 * calling .listen(), so tests can use supertest to make requests
 * without starting a real server.
 */
import express from "express";
import cors from "cors";
import workflowsRouter from "./workflows";
import executionsRouter from "./executions";
import NodeDefinitionRouter from "./node-definition";
import { errorHandler } from "../middleware/errorHandler";

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use("/api/workflows", workflowsRouter);
app.use("/api/executions", executionsRouter);
app.use("/api/node-definitions", NodeDefinitionRouter);

// Centralized error handling middleware — must be registered AFTER routes
app.use(errorHandler);

export default app;
