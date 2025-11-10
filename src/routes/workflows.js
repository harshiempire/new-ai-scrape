"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var prisma_1 = require("../lib/prisma");
var zod_1 = require("zod");
var WorkflowExecutor_1 = require("../WorkflowExecutor");
var workflowRouter = express_1.default.Router();
// Schema validation
var workflowSchema = zod_1.z.object({
    name: zod_1.z.string(),
    nodes: zod_1.z.array(zod_1.z.any()),
    edges: zod_1.z.array(zod_1.z.any()),
});
var runWorkflowSchema = zod_1.z.object({
    initialInputs: zod_1.z.record(zod_1.z.any(), zod_1.z.any()),
});
// Helper function to get the next run number for a workflow
function getNextRunNumber(workflowId) {
    return __awaiter(this, void 0, void 0, function () {
        var lastExecution, lastRunMatch;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma_1.prisma.execution.findFirst({
                        where: { workflowId: workflowId },
                        orderBy: { startedAt: "desc" },
                    })];
                case 1:
                    lastExecution = _a.sent();
                    if (!lastExecution)
                        return [2 /*return*/, 1];
                    lastRunMatch = lastExecution.runNumber;
                    if (!lastRunMatch)
                        return [2 /*return*/, 1];
                    return [2 /*return*/, lastRunMatch + 1];
            }
        });
    });
}
// POST /api/workflows
workflowRouter.post("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validation, _a, name_1, nodes, edges, workflow, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                validation = workflowSchema.safeParse(req.body);
                if (!validation.success) {
                    return [2 /*return*/, res.status(400).json({ error: validation.error })];
                }
                _a = req.body, name_1 = _a.name, nodes = _a.nodes, edges = _a.edges;
                return [4 /*yield*/, prisma_1.prisma.workflow.create({
                        data: {
                            name: name_1,
                            nodes: nodes,
                            edges: edges,
                        },
                    })];
            case 1:
                workflow = _b.sent();
                res.status(201).json(workflow);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error("Error creating workflow:", error_1);
                res.status(500).json({ error: "Failed to create workflow" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/workflows
workflowRouter.get("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var workflows, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma_1.prisma.workflow.findMany({
                        include: {
                            executions: {
                                orderBy: { startedAt: "desc" },
                                take: 5, // Get last 5 executions
                            },
                        },
                    })];
            case 1:
                workflows = _a.sent();
                res.json(workflows);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error("Error fetching workflows:", error_2);
                res.status(500).json({ error: "Failed to fetch workflows" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/workflows/:id
workflowRouter.get("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var workflow, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma_1.prisma.workflow.findUnique({
                        where: { id: req.params.id },
                        include: {
                            executions: {
                                include: {
                                    executionData: true,
                                },
                                orderBy: { startedAt: "desc" },
                            },
                        },
                    })];
            case 1:
                workflow = _a.sent();
                if (!workflow) {
                    return [2 /*return*/, res.status(404).json({ error: "Workflow not found" })];
                }
                res.json(workflow);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error("Error fetching workflow:", error_3);
                res.status(500).json({ error: "Failed to fetch workflow" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// PATCH /api/workflows/:id
workflowRouter.patch("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_2, nodes, edges, workflow, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, name_2 = _a.name, nodes = _a.nodes, edges = _a.edges;
                return [4 /*yield*/, prisma_1.prisma.workflow.update({
                        where: { id: req.params.id },
                        data: __assign(__assign(__assign({}, (name_2 && { name: name_2 })), (nodes && { nodes: nodes })), (edges && { edges: edges })),
                    })];
            case 1:
                workflow = _b.sent();
                res.json(workflow);
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                console.error("Error updating workflow:", error_4);
                res.status(500).json({ error: "Failed to update workflow" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// DELETE /api/workflows/:id
workflowRouter.delete("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma_1.prisma.workflow.delete({
                        where: { id: req.params.id },
                    })];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error("Error deleting workflow:", error_5);
                res.status(500).json({ error: "Failed to delete workflow" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/workflows/:id/run
workflowRouter.post("/:id/run", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validation, id, initialInputs, workflow, nextRunNumber, execution, executor, result, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                validation = runWorkflowSchema.safeParse(req.body);
                if (!validation.success) {
                    return [2 /*return*/, res.status(400).json({ error: validation.error })];
                }
                id = req.params.id;
                initialInputs = req.body.initialInputs;
                return [4 /*yield*/, prisma_1.prisma.workflow.findUnique({
                        where: { id: id },
                    })];
            case 1:
                workflow = _a.sent();
                if (workflow === null) {
                    return [2 /*return*/, res.status(404).json({ error: "Workflow not found" })];
                }
                return [4 /*yield*/, getNextRunNumber(id)];
            case 2:
                nextRunNumber = _a.sent();
                return [4 /*yield*/, prisma_1.prisma.execution.create({
                        data: {
                            workflowId: id,
                            status: "Started",
                            runNumber: nextRunNumber,
                            executionData: {
                                create: {
                                    initialInputs: initialInputs,
                                    variablePool: {},
                                },
                            },
                        },
                        include: {
                            executionData: true,
                        },
                    })];
            case 3:
                execution = _a.sent();
                if (!(execution.executionData && execution.executionData.id !== null)) return [3 /*break*/, 5];
                executor = new WorkflowExecutor_1.WorkflowExecutor(workflow, initialInputs, execution.executionData.id);
                return [4 /*yield*/, executor.execute()];
            case 4:
                result = _a.sent();
                return [2 /*return*/, res.json({
                        message: "Workflow executed successfully",
                        executionId: execution.id,
                        executionDataId: execution.executionData.id,
                        result: result,
                    })];
            case 5: throw new Error("Execution data not found for the execution");
            case 6: return [3 /*break*/, 8];
            case 7:
                error_6 = _a.sent();
                console.error("Error running workflow:", error_6);
                res.status(500).json({ error: "Failed to execute workflow \n" + error_6 });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
// Options for CORS
workflowRouter.options("/", function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
});
workflowRouter.options("/:id", function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
});
exports.default = workflowRouter;
