"use strict";
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
var exectionRouter = express_1.default.Router();
// Schema validation
var executionSchema = zod_1.z.object({
    workflowId: zod_1.z.string(),
    status: zod_1.z.string(),
});
// POST /api/executions
exectionRouter.post("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var validation, _a, workflowId, status_1, workflow, execution, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                validation = executionSchema.safeParse(req.body);
                if (!validation.success) {
                    return [2 /*return*/, res.status(400).json({ error: validation.error })];
                }
                _a = req.body, workflowId = _a.workflowId, status_1 = _a.status;
                return [4 /*yield*/, prisma_1.prisma.workflow.findUnique({
                        where: { id: workflowId },
                    })];
            case 1:
                workflow = _b.sent();
                if (!workflow) {
                    return [2 /*return*/, res.status(404).json({ error: "Workflow not found" })];
                }
                return [4 /*yield*/, prisma_1.prisma.execution.create({
                        data: {
                            workflowId: workflowId,
                            status: status_1,
                        },
                    })];
            case 2:
                execution = _b.sent();
                res.status(201).json(execution);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                console.error("Error creating execution:", error_1);
                res.status(500).json({ error: "Failed to create execution" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// GET /api/executions
exectionRouter.get("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, workflowId, status_2, where, executions, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, workflowId = _a.workflowId, status_2 = _a.status;
                where = {};
                if (workflowId)
                    where.workflowId = workflowId;
                if (status_2)
                    where.status = status_2;
                return [4 /*yield*/, prisma_1.prisma.execution.findMany({
                        where: where,
                        include: {
                            workflow: true,
                            executionData: true,
                        },
                    })];
            case 1:
                executions = _b.sent();
                res.json(executions);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                console.error("Error fetching executions:", error_2);
                res.status(500).json({ error: "Failed to fetch executions" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// PUT /api/executions/:id
exectionRouter.put("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, status_3, completedAt, executionTime, variablePool, execution, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, status_3 = _a.status, completedAt = _a.completedAt, executionTime = _a.executionTime, variablePool = _a.variablePool;
                return [4 /*yield*/, prisma_1.prisma.execution.update({
                        where: { id: req.params.id },
                        data: {
                            status: status_3,
                            completedAt: completedAt ? new Date(completedAt) : undefined,
                            executionTime: executionTime,
                            executionData: variablePool
                                ? {
                                    upsert: {
                                        create: {
                                            initialInputs: {},
                                            variablePool: variablePool,
                                        },
                                        update: { variablePool: variablePool },
                                    },
                                }
                                : undefined,
                        },
                        include: {
                            executionData: true,
                        },
                    })];
            case 1:
                execution = _b.sent();
                res.json(execution);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                console.error("Error updating execution:", error_3);
                res.status(500).json({ error: "Failed to update execution" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = exectionRouter;
