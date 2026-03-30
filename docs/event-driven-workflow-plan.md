# Event-Driven Workflow Migration Plan

## Current State

The current backend executes an entire workflow synchronously inside `POST /api/workflows/:id/run`.

Relevant code:

- `backend/src/routes/workflows.ts`
- `backend/src/workflow/WorkflowExecutor.ts`
- `backend/src/nodes/Node.ts`
- `backend/prisma/schema.prisma`

Current behavior:

1. Create one `Execution` row and one `ExecutionData` row.
2. Build all nodes in memory.
3. Validate DAG with cycle detection.
4. Traverse the graph with an in-process topological queue.
5. Execute each node inline in the HTTP request.
6. Return only after the whole workflow succeeds or fails.

This is workflow-blocking, not node-blocking.

## Target State

Move to an event-driven execution model where:

1. `POST /api/workflows/:id/run` only creates an execution and enqueues ready nodes.
2. Workers consume node jobs from a queue.
3. Each node execution is persisted independently.
4. Retries happen at node level, not workflow level.
5. Workflow completion is derived from node states.
6. The API can return immediately with `executionId` and status `queued` or `running`.

## Core Design Change

Replace "topological execution in memory" with "dependency resolution in persistent state".

Important point:

- You do not remove DAG validation.
- You remove the requirement to keep an in-memory topological queue for the full workflow run.
- The graph still needs dependency metadata so workers know when a node is ready.

In practice, topological sort becomes a planning concern, not the runtime execution engine.

## Proposed Runtime Model

### 1. Workflow definition stays mostly the same

Keep:

- `Workflow.nodes`
- `Workflow.edges`

Still validate:

- at least one start node
- no cycles
- node config validity

### 2. Add persistent execution-level node state

Add a new table for each node inside an execution.

Suggested model:

```prisma
model ExecutionNode {
  id                 String   @id @default(uuid())
  executionId        String
  nodeId             String
  nodeType           String
  nodeLabel          String
  status             String
  attemptCount       Int      @default(0)
  maxAttempts        Int      @default(3)
  dependencyCount    Int
  resolvedCount      Int      @default(0)
  queuedAt           DateTime?
  startedAt          DateTime?
  completedAt        DateTime?
  nextRetryAt        DateTime?
  lastError          Json?
  output             Json?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  execution          Execution @relation(fields: [executionId], references: [id], onDelete: Cascade)

  @@unique([executionId, nodeId])
  @@index([executionId, status])
  @@index([status, nextRetryAt])
}
```

This is the main schema shift from workflow-blocking to node-blocking.

### 3. Add queue/job persistence

You need a queue that holds executable nodes.

Two options:

#### Option A: DB-backed queue

Create a table like:

```prisma
model NodeJob {
  id              String   @id @default(uuid())
  executionNodeId String
  executionId     String
  nodeId          String
  status          String
  attempts        Int      @default(0)
  availableAt     DateTime @default(now())
  lockedAt        DateTime?
  workerId        String?
  payload         Json
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status, availableAt])
  @@index([executionId])
}
```

Good for first migration because it is simple, transactional, and easy to debug.

#### Option B: External queue

Use Redis + BullMQ / SQS / RabbitMQ.

Better for scale, but adds infra and operational complexity. For this repo, DB-backed queue is the pragmatic first step.

## Execution Lifecycle

### Start workflow

`POST /api/workflows/:id/run`

New behavior:

1. Validate request.
2. Load workflow definition.
3. Validate graph and schema.
4. Create `Execution`.
5. Create `ExecutionData`.
6. Materialize all `ExecutionNode` rows for this execution.
7. Mark start-ready nodes as `queued`.
8. Insert queue jobs for those nodes.
9. Return `202 Accepted`.

Suggested response:

```json
{
  "message": "Workflow execution started",
  "executionId": "exec_123",
  "status": "queued"
}
```

This gives you the Postman behavior you described: execution starts immediately and the request does not wait for completion.

### Worker loop

Worker behavior:

1. Pull one available node job.
2. Lock it.
3. Mark `ExecutionNode.status = running`.
4. Execute the node.
5. Persist node output/error.
6. On success:
   - mark node `completed`
   - update downstream nodes' `resolvedCount`
   - enqueue any downstream node where `resolvedCount == dependencyCount`
7. On failure:
   - increment attempt count
   - retry if `attemptCount < maxAttempts`
   - otherwise mark node `failed`
8. Recompute workflow-level execution status.

### Completion rules

Workflow status should be derived:

- `queued`: execution created, no node started yet
- `running`: at least one node running or completed, and workflow not terminal
- `completed`: all required executable nodes completed
- `failed`: one node reached terminal failure and workflow cannot continue
- `partial_failed`: optional later, if you support branch-local failure behavior

## Dependency Handling Without Runtime Topological Sort

This is the key modeling point.

You do not need a full topological traversal loop at runtime if each `ExecutionNode` stores:

- `dependencyCount`
- `resolvedCount`

How to compute:

- `dependencyCount = number of inbound edges`
- Start nodes typically have `dependencyCount = 0`
- A node becomes runnable when `resolvedCount >= dependencyCount`

When a node completes:

1. Find all outgoing edges.
2. For each target node:
   - increment `resolvedCount`
   - if `resolvedCount == dependencyCount`, enqueue it

That replaces the current in-memory `indegree` mutation in `WorkflowExecutor`.

## What to Do About Start Nodes

You mentioned "some where on what nodes are connected to start as they are independent nodes".

Recommended rule:

- Keep explicit start nodes in the editor.
- At execution materialization time, enqueue all nodes with `dependencyCount = 0`.
- If your product semantics require a true trigger node, restrict this to explicit `start` nodes only.

Best near-term choice for this codebase:

- Keep one or more start nodes.
- Continue DAG validation.
- Treat all start nodes as initial runnable nodes.

This avoids changing the editor and validation model too aggressively in the same migration.

## Node-Level Blocking

This is the biggest behavior change.

Today:

- one failing node fails the whole synchronous request

Target:

- only that node instance is blocked/retried
- unrelated ready nodes can continue if they are independent
- downstream nodes of the failed node remain blocked because their dependencies are unresolved

That means blocking becomes dependency-local instead of workflow-global.

## Data Storage Strategy

Current state uses:

- `ExecutionData.variablePool` as shared JSON storage

Recommended next state:

1. Keep `ExecutionData.variablePool` for backwards compatibility.
2. Also persist node-level output in `ExecutionNode.output`.
3. Move UI reads gradually from `variablePool` to execution-node records.

Why:

- easier debugging
- better retry visibility
- cleaner node timeline
- easier progress UI

## API Changes

### Keep

- `POST /api/workflows`
- `PATCH /api/workflows/:id`
- `GET /api/workflows/:id`

### Change

`POST /api/workflows/:id/run`

From:

- synchronous full execution

To:

- async start endpoint returning `202`

### Add

`GET /api/executions/:id`

Return:

- workflow execution status
- aggregate counters:
  - queued nodes
  - running nodes
  - completed nodes
  - failed nodes

`GET /api/executions/:id/nodes`

Return:

- all node instances for an execution
- per-node status, attempts, output, error

Optional:

`POST /api/internal/workers/poll`

- only if you implement worker polling over HTTP instead of a direct worker process

## Frontend Impact

Current frontend still assumes:

- start node required
- end node required
- execution data is mostly variable-pool based

Recommended staged changes:

### Phase 1

- keep start and end node validation as-is
- update execution detail screen to poll execution status
- add node-run list for per-node progress

### Phase 2

- end node can become optional if completion is defined as "all reachable terminal paths settled"
- visualize queued/running/completed/failed state on each node

## Suggested Migration Phases

### Phase 0: Stabilize current semantics

Before changing architecture:

1. Formalize statuses as enums instead of free-form strings.
2. Add a single place for execution status transitions.
3. Add tests around current `POST /run`.

### Phase 1: Add execution-node schema

1. Add `ExecutionNode`.
2. Materialize node rows when a workflow starts.
3. Do not change execution engine yet.
4. Continue using current executor, but write mirrored node state as a shadow model.

Goal:

- prove schema and UI shape before introducing queue workers

### Phase 2: Convert `/run` to async kickoff

1. Change `/api/workflows/:id/run` to:
   - create execution
   - create execution nodes
   - enqueue start nodes
   - return `202`
2. Introduce worker process.

Goal:

- request is no longer workflow-blocking

### Phase 3: Move node execution into worker

1. Extract single-node execution service from `WorkflowExecutor`.
2. Worker executes one node job at a time.
3. Persist retries and downstream scheduling.

Goal:

- node-level retries and dependency-based scheduling

### Phase 4: Replace variable-pool-only UI

1. Read execution progress from `ExecutionNode`
2. Show node attempts, last error, timestamps, outputs

### Phase 5: Cleanup

1. Delete old full-workflow synchronous executor path
2. Keep graph validation utilities only
3. Keep topological sort only for validation/debug tooling if needed

## Recommended Refactor in This Repo

Break the current `WorkflowExecutor` into smaller services:

- `WorkflowRunInitializer`
  - validates workflow
  - creates execution + execution nodes
  - enqueues ready nodes

- `NodeExecutionService`
  - executes exactly one node for one execution

- `DependencyResolver`
  - updates downstream readiness after node completion

- `ExecutionStatusService`
  - computes overall workflow status from node states

- `NodeJobWorker`
  - queue consumer with retry logic

This is the cleanest path out of the current "entire DAG runs in one method" structure.

## Retry Policy

Recommended first version:

- max attempts: `3`
- retry only on transient execution failure
- linear or exponential backoff
- persist:
  - `attemptCount`
  - `lastError`
  - `nextRetryAt`

Suggested terminal rule:

- after 3 failed attempts, mark node `failed`
- mark workflow `failed` if any required downstream path can no longer complete

## Risks

1. Race conditions when two workers try to enqueue the same downstream node.
2. Double-processing if queue locking is weak.
3. Branch semantics for conditional nodes need explicit treatment.
4. Shared JSON `variablePool` updates can become contention-heavy.
5. Current node implementation reads execution data directly, which couples nodes to the old storage pattern.

## Important Implementation Detail

Conditional branches currently use `context.activeEdges`.

In the new model, this should be persisted as part of node execution result, for example:

```json
{
  "selectedOutgoingEdgeIds": ["edge_12"]
}
```

Then the dependency resolver should only unlock downstream nodes on selected edges.

Without this, branch nodes will incorrectly unlock all downstream paths.

## Recommendation

For this codebase, the safest first implementation is:

1. Keep workflows as DAGs.
2. Keep start nodes.
3. Add `ExecutionNode`.
4. Use a DB-backed queue first.
5. Change `/run` to async kickoff returning `202`.
6. Move retries to worker-owned node jobs.
7. Derive workflow status from node states.

Do not start by deleting topological logic entirely. Start by relocating it:

- DAG validation remains
- dependency metadata becomes persisted
- runtime scheduling becomes event-driven

## First Concrete Task List

1. Add `ExecutionNode` and queue schema to Prisma.
2. Add execution/node status enums.
3. Refactor `POST /api/workflows/:id/run` into "create execution + enqueue starts".
4. Extract single-node execution logic from `WorkflowExecutor`.
5. Implement worker consumer with 3 retries.
6. Add `GET /api/executions/:id/nodes`.
7. Update frontend execution screen to poll and render node-level state.
