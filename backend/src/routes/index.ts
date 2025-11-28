import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import workflowsRouter from "./workflows";
import executionsRouter from "./executions";
import NodeDefinitionRouter from "./node-definition";

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/workflows", workflowsRouter);
app.use("/api/executions", executionsRouter);
app.use("/api/node-definitions", NodeDefinitionRouter);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  }
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
