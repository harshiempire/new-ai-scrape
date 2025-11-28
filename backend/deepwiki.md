# DeepWiki Q&A with Code Context for Repository: n8n-io/n8n

## Q1

where is the execution context being stored

### Answer

Based on the code context, you're asking about where the **execution context** is stored during workflow execution in n8n.

## Answer

The execution context is stored in the `contextData` property within `runExecutionData.executionData` n8n:447-486 .

### Storage Structure

The context data is organized as a key-value map where:

- **Flow-level context**: Stored with key `'flow'`
- **Node-level context**: Stored with key `'node:{nodeName}'` n8n:464-485

### Access Pattern

Context data is accessed through the `getContext()` function, which retrieves or initializes the context object from `runExecutionData.executionData.contextData[key]` n8n:481-485 .

During workflow execution, nodes can access their context through the `$input.context` or `$node.context` proxies in expressions n8n:1281-1283 . These proxies internally call `NodeHelpers.getContext()` to retrieve the stored context data n8n:139-141 .

### Persistence

The execution context is part of the broader execution data structure that gets persisted to the database. Database migrations show that execution data (including `contextData`) is stored in the `execution_data` table n8n:6-11 .

## Notes

The `ExecuteContext` class you may have seen in `packages/core/src/execution-engine/node-execution-context/execute-context.ts` is a different concept - it's the execution context object passed to nodes during execution (providing helpers, parameters, etc.), not the storage location for context data. The actual context data storage is in the `IRunExecutionData` structure's `executionData.contextData` property.

Wiki pages you might want to explore:

- [Architecture Overview (n8n-io/n8n)](/wiki/n8n-io/n8n#1.2)

### Citations

**File:** packages/workflow/src/node-helpers.ts (L447-486)

```typescript
/**
 * Returns the context data
 *
 * @param {IRunExecutionData} runExecutionData The run execution data
 * @param {string} type The data type. "node"/"flow"
 * @param {INode} [node] If type "node" is set the node to return the context of has to be supplied
 */
export function getContext(
  runExecutionData: IRunExecutionData,
  type: string,
  node?: INode
): IContextObject {
  if (runExecutionData.executionData === undefined) {
    // TODO: Should not happen leave it for test now
    throw new ApplicationError("`executionData` is not initialized");
  }

  let key: string;
  if (type === "flow") {
    key = "flow";
  } else if (type === "node") {
    if (node === undefined) {
      // @TODO: What does this mean?
      throw new ApplicationError(
        'The request data of context type "node" the node parameter has to be set!'
      );
    }
    key = `node:${node.name}`;
  } else {
    throw new ApplicationError(
      "Unknown context type. Only `flow` and `node` are supported.",
      {
        extra: { contextType: type },
      }
    );
  }

  if (runExecutionData.executionData.contextData[key] === undefined) {
    runExecutionData.executionData.contextData[key] = {};
  }

  return runExecutionData.executionData.contextData[key];
}
```

**File:** packages/workflow/src/workflow-data-proxy.ts (L139-141)

```typescript
const contextData = NodeHelpers.getContext(
  that.runExecutionData!,
  "node",
  node
);

return contextData[name];
```

**File:** packages/workflow/src/workflow-data-proxy.ts (L1281-1283)

```typescript
if (property === "context") {
  return that.nodeContextGetter(nodeName);
}
```

**File:** packages/@n8n/db/src/migrations/postgresdb/1690000000020-SeparateExecutionData.ts (L6-11)

```typescript
			`CREATE TABLE "${tablePrefix}execution_data" (
				"executionId" integer NOT NULL,
				"workflowData" json NOT NULL,
				"data" text NOT NULL,
				CONSTRAINT "${tablePrefix}execution_data_fk" FOREIGN KEY ("executionId") REFERENCES ${tablePrefix}execution_entity(id) ON DELETE CASCADE
			)`,
```

## Q2

where is the execution context being stored

## Execution Context Storage in n8n

Traces the complete lifecycle of execution context storage in n8n, from initialization in [1a] through the data structure definitions in [2a-2c], proxy-based access patterns in [3a-3c], to final database persistence in [4a].

### 1. Context Initialization

How execution context storage is created when workflow execution begins

### 1a. Context Storage Initialization (`workflow-execute.ts:97`)

WorkflowExecute constructor initializes empty contextData object

```text
executionData: {
			contextData: {},
```

### 2. Context Data Structure

Core interfaces and functions that define how context is stored and accessed

### 2a. Context Data Interface (`interfaces.ts:435`)

Defines key-value structure for context storage

```text
export interface IExecuteContextData {
	// Keys are: "flow" | "node:<NODE_NAME>"
	[key: string]: IContextObject;
```

### 2b. Context in Execution Data (`interfaces.ts:2398`)

Shows contextData placement within IRunExecutionData

```text
executionData?: {
		contextData: IExecuteContextData;
```

### 2c. Context Access Logic (`node-helpers.ts:481`)

GetContext function retrieves or initializes context object

```text
if (runExecutionData.executionData.contextData[key] === undefined) {
		runExecutionData.executionData.contextData[key] = {};
	}

	return runExecutionData.executionData.contextData[key];
```

### 3. Context Access via Proxies

How nodes access context through expression proxies like $node.context

### 3a. Proxy Context Loading (`workflow-data-proxy.ts:124`)

NodeContextGetter loads context via NodeHelpers.getContext

```text
Object.assign(target, NodeHelpers.getContext(that.runExecutionData!, 'node', node));
```

### 3b. Proxy Context Retrieval (`workflow-data-proxy.ts:139`)

Proxy get handler returns context property values

```text
const contextData = NodeHelpers.getContext(that.runExecutionData!, 'node', node);

				return contextData[name];
```

### 3c. Context Proxy Assignment (`workflow-data-proxy.ts:1281`)

$node context proxy returns nodeContextGetter

```text
if (property === 'context') {
						return that.nodeContextGetter(nodeName);
					}
```

### 4. Database Persistence

How context data is persisted to the database as part of execution storage

### 4a. Execution Data Table Creation (`1690000000020-SeparateExecutionData.ts:6`)

Database migration creates table for storing execution data including context

```text
CREATE TABLE "${tablePrefix}execution_data" (
			"executionId" integer NOT NULL,
			"workflowData" json NOT NULL,
			"data" text NOT NULL,
```

## Q3

how is the workflow data is created and inserted

## Workflow Data Creation and Insertion in n8n

Traces the complete workflow data creation pipeline from HTTP request to database persistence, including entity instantiation [1a-1c], business logic processing [2a-2d], transactional database operations [3a-3d], and the underlying database schema foundation [4a-4c].

### 1. HTTP Request to Entity Creation

How incoming workflow creation requests are transformed into WorkflowEntity objects

### 1a. Entity Instantiation (`workflows.controller.ts:96`)

Creates new WorkflowEntity instance to hold workflow data

```text
const newWorkflow = new WorkflowEntity();
```

### 1b. Request Data Assignment (`workflows.controller.ts:98`)

Copies all properties from HTTP request body into the entity

```text
Object.assign(newWorkflow, req.body);
```

### 1c. Version ID Generation (`workflows.controller.ts:100`)

Assigns unique version identifier for workflow tracking

```text
newWorkflow.versionId = uuid();
```

### 2. Business Logic Processing and Validation

Validation, credential processing, and node preparation before database insertion

### 2a. Entity Validation (`workflows.controller.ts:102`)

Validates workflow data against schema constraints

```text
await validateEntity(newWorkflow);
```

### 2b. Credential Validation (`workflows.controller.ts:112`)

Checks and replaces invalid credential references

```text
await WorkflowHelpers.replaceInvalidCredentials(newWorkflow);
```

### 2c. Node ID Assignment (`workflows.controller.ts:114`)

Ensures all workflow nodes have unique identifiers

```text
WorkflowHelpers.addNodeIds(newWorkflow);
```

### 2d. External Hook Execution (`workflows.controller.ts:104`)

Triggers external plugins/hooks before workflow creation

```text
await this.externalHooks.run('workflow.create', [newWorkflow]);
```

### 3. Database Transaction and Persistence

Atomic database operations that save the workflow and related entities

### 3a. Transaction Start (`workflows.controller.ts:137`)

Begins database transaction for atomic operations

```text
const savedWorkflow = await dbManager.transaction(async (transactionManager) => {
```

### 3b. Workflow Persistence (`workflows.controller.ts:160`)

Saves WorkflowEntity to database within transaction

```text
const workflow = await transactionManager.save<WorkflowEntity>(newWorkflow);
```

### 3c. Shared Workflow Creation (`workflows.controller.ts:173`)

Creates sharing relationship entity for permissions

```text
const newSharedWorkflow = this.sharedWorkflowRepository.create({
```

### 3d. Shared Workflow Save (`workflows.controller.ts:179`)

Persists workflow sharing permissions in same transaction

```text
await transactionManager.save<SharedWorkflow>(newSharedWorkflow);
```

### 4. Database Schema Foundation

How the underlying database tables were created through migrations

### 4a. PostgreSQL Table Creation (`1587669153312-InitialMigration.ts:18`)

Initial migration creates workflow_entity table with core columns

```text
CREATE TABLE IF NOT EXISTS ${tablePrefix}workflow_entity ("id" SERIAL NOT NULL, "name" character varying(128) NOT NULL, "active" boolean NOT NULL, "nodes" json NOT NULL, "connections" json NOT NULL, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "settings" json, "staticData" json, CONSTRAINT PK_${tablePrefix}eded7d72664448da7745d551207 PRIMARY KEY ("id"))
```

### 4b. SQLite Table Creation (`1588102412422-InitialMigration.ts:18`)

SQLite version of workflow_entity table creation

```text
CREATE TABLE IF NOT EXISTS "${tablePrefix}workflow_entity" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(128) NOT NULL, "active" boolean NOT NULL, "nodes" text NOT NULL, "connections" text NOT NULL, "createdAt" datetime NOT NULL, "updatedAt" datetime NOT NULL, "settings" text, "staticData" text)
```

### 4c. TypeORM Entity Definition (`workflow-entity.ts:25`)

TypeORM entity class that maps to database table

```text
@Entity()
export class WorkflowEntity extends WithTimestampsAndStringId implements IWorkflowDb {
```

## Q4

Oh my god the whole thing is very confusing can you help me understand these things
When i am start the workflow what is are things happening - like how is the node getting executed, from where are the nodes are getting the context if they have get the node inputs, then where is it putitng the nodes output, how is the workflows status being updated and what is happening in the case of node failure

### Answer

# Workflow Execution in n8n

Workflow execution in n8n is managed by the **`WorkflowExecute`** class, which orchestrates the entire execution lifecycle. Here's how each aspect works:

## 1. How Nodes Are Executed

Workflow execution follows a **stack-based approach** with a main execution loop: n8n:1528-1541

The execution loop continuously processes nodes from the `nodeExecutionStack` until it's empty. For each node, the system:

1. **Pops a node** from the execution stack
2. **Calls `runNode()`** to execute it based on its type (execute/poll/trigger/webhook)
3. **Schedules downstream nodes** based on connections and output data n8n:1238-1326

The `runNode()` method determines the node type and dispatches to the appropriate execution method - either `executeNode()` for regular nodes, `executePollNode()` for polling nodes, or `executeTriggerNode()` for trigger nodes.

## 2. How Nodes Receive Context and Inputs

Nodes receive their execution context through the **`ExecuteContext`** class, which implements the `IExecuteFunctions` interface: n8n:1054-1084

The context provides:

- **Input data**: Accessible via `getInputData()` and `getInputConnectionData()` methods
- **Connection data**: The `connectionInputData` parameter contains the actual input items from connected nodes
- **Execution metadata**: Including workflow reference, run index, and additional data n8n:1-100

The ExecuteContext class manages how nodes access their inputs during execution, providing helper methods and workflow data proxy for expression resolution.

## 3. Where Node Outputs Are Stored

Node outputs are stored in the **`runExecutionData.resultData.runData`** structure: n8n:2383-2422

Each node's output is stored as an array of `ITaskData` objects, indexed by node name: n8n:2442-2445

When a node completes successfully, its output data is stored: n8n:1937-1964

The `taskData` object contains the execution time, status, metadata, and the actual output data in the `data` property.

## 4. How Workflow Status Is Updated

Workflow status is managed through multiple mechanisms:

**During Execution**: Status is tracked in the `WorkflowExecute` instance and updated based on execution outcomes: n8n:2393-2425

The `processSuccessExecution()` method determines the final status:

- **`success`**: Execution completed without errors
- **`waiting`**: Execution is paused (e.g., Wait node, Form trigger)
- **`canceled`**: Manually stopped or timed out
- **`error`**: Node execution failed

**Task-Level Status**: Individual node executions track their status: n8n:1859-1868

**Cancellation**: When execution is canceled, all running tasks are marked as canceled: n8n:2637-2646

## 5. What Happens in Case of Node Failure

Node failure handling includes **retry logic** and **error propagation options**: n8n:1649-1678

When a node fails, the system:

1. **Catches the error** and wraps it in an `ExecutionBaseError`
2. **Retries execution** if `retryOnFail` is enabled (up to `maxTries` attempts with `waitBetweenTries` delay)
3. **Reports the error** to Sentry for monitoring n8n:1819-1849

**Error Propagation Modes**: Based on node settings, the workflow can:

- **Stop execution** (default): Error is stored and execution halts
- **Continue with input data** (`continueOnFail: true`): Passes input data to next node
- **Continue with regular output** (`onError: 'continueRegularOutput'`): Passes error as regular output
- **Continue with error output** (`onError: 'continueErrorOutput'`): Routes errors to dedicated error output n8n:1866-1914

The `handleNodeErrorOutput()` method specifically handles separating error items from successful items when error output routing is enabled: n8n:2470-2568

## Notes

- The execution engine supports two modes: **regular mode** (direct execution) and **queue mode** (distributed via Bull/Redis)
- Nodes with multiple inputs use a **waiting execution** mechanism to collect all input data before executing
- The system maintains **pairedItem** information to track data lineage through the workflow
- Execution hooks (`nodeExecuteBefore`, `nodeExecuteAfter`, `workflowExecuteAfter`) enable monitoring and persistence throughout the execution lifecycle

### Citations

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1054-1084)

```typescript
	private async executeNode(
		workflow: Workflow,
		node: INode,
		nodeType: INodeType,
		customOperation: ReturnType<WorkflowExecute['getCustomOperation']>,
		additionalData: IWorkflowExecuteAdditionalData,
		mode: WorkflowExecuteMode,
		runExecutionData: IRunExecutionData,
		runIndex: number,
		connectionInputData: INodeExecutionData[],
		inputData: ITaskDataConnections,
		executionData: IExecuteData,
		abortSignal?: AbortSignal,
		subNodeExecutionResults?: EngineResponse,
	): Promise<IRunNodeResponse | EngineRequest> {
		const closeFunctions: CloseFunction[] = [];
		const context = new ExecuteContext(
			workflow,
			node,
			additionalData,
			mode,
			runExecutionData,
			runIndex,
			connectionInputData,
			inputData,
			executionData,
			closeFunctions,
			abortSignal,
			subNodeExecutionResults,
		);

```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1238-1326)

```typescript
	async runNode(
		workflow: Workflow,
		executionData: IExecuteData,
		runExecutionData: IRunExecutionData,
		runIndex: number,
		additionalData: IWorkflowExecuteAdditionalData,
		mode: WorkflowExecuteMode,
		abortSignal?: AbortSignal,
		subNodeExecutionResults?: EngineResponse,
	): Promise<IRunNodeResponse | EngineRequest> {
		const { node } = executionData;
		let inputData = executionData.data;

		if (node.disabled === true) {
			return this.handleDisabledNode(inputData);
		}

		const nodeType = workflow.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
		const customOperation = this.getCustomOperation(node, nodeType);

		const connectionInputData = this.prepareConnectionInputData(
			workflow,
			nodeType,
			customOperation,
			inputData,
		);

		if (connectionInputData === null) {
			return { data: undefined };
		}

		this.rethrowLastNodeError(runExecutionData, node);

		inputData = this.handleExecuteOnce(node, inputData);

		if (nodeType.execute || customOperation) {
			return await this.executeNode(
				workflow,
				node,
				nodeType,
				customOperation,
				additionalData,
				mode,
				runExecutionData,
				runIndex,
				connectionInputData,
				inputData,
				executionData,
				abortSignal,
				subNodeExecutionResults,
			);
		}

		if (nodeType.poll) {
			return await this.executePollNode(workflow, node, nodeType, additionalData, mode, inputData);
		}

		if (nodeType.trigger) {
			return await this.executeTriggerNode(
				workflow,
				node,
				additionalData,
				mode,
				inputData,
				abortSignal,
			);
		}

		const isDeclarativeNode = nodeType.description.requestDefaults !== undefined;
		if (nodeType.webhook && !isDeclarativeNode) {
			// Check if the node have requestDefaults(Declarative Node),
			// else for webhook nodes always simply pass the data through
			// as webhook method would be called by WebhookService
			return { data: inputData.main as INodeExecutionData[][] };
		}

		return await this.executeDeclarativeNodeInTest(
			workflow,
			node,
			nodeType,
			additionalData,
			mode,
			runExecutionData,
			runIndex,
			connectionInputData,
			inputData,
			executionData,
		);
	}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1528-1541)

```typescript
				executionLoop: while (
					this.runExecutionData.executionData!.nodeExecutionStack.length !== 0
				) {
					if (
						this.additionalData.executionTimeoutTimestamp !== undefined &&
						Date.now() >= this.additionalData.executionTimeoutTimestamp
					) {
						this.status = 'canceled';
						this.timedOut = true;
					}

					if (this.status === 'canceled') {
						return;
					}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1649-1678)

```typescript
					let maxTries = 1;
					if (executionData.node.retryOnFail === true) {
						// TODO: Remove the hardcoded default-values here and also in NodeSettings.vue
						maxTries = Math.min(5, Math.max(2, executionData.node.maxTries || 3));
					}

					let waitBetweenTries = 0;
					if (executionData.node.retryOnFail === true) {
						// TODO: Remove the hardcoded default-values here and also in NodeSettings.vue
						waitBetweenTries = Math.min(
							5000,
							Math.max(0, executionData.node.waitBetweenTries || 1000),
						);
					}

					for (let tryIndex = 0; tryIndex < maxTries; tryIndex++) {
						try {
							if (tryIndex !== 0) {
								// Reset executionError from previous error try
								executionError = undefined;
								if (waitBetweenTries !== 0) {
									// TODO: Improve that in the future and check if other nodes can
									//       be executed in the meantime

									await new Promise((resolve) => {
										setTimeout(() => {
											resolve(undefined);
										}, waitBetweenTries);
									});
								}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1819-1849)

```typescript
						} catch (error) {
							this.runExecutionData.resultData.lastNodeExecuted = executionData.node.name;

							let toReport: Error | undefined;
							if (error instanceof ApplicationError) {
								// Report any unhandled errors that were wrapped in by one of our error classes
								if (error.cause instanceof Error) toReport = error.cause;
							} else {
								// Report any unhandled and non-wrapped errors to Sentry
								toReport = error;
							}
							if (toReport) {
								Container.get(ErrorReporter).error(toReport, {
									extra: {
										nodeName: executionNode.name,
										nodeType: executionNode.type,
										nodeVersion: executionNode.typeVersion,
										workflowId: workflow.id,
									},
								});
							}

							const e = error as unknown as ExecutionBaseError;

							executionError = { ...e, message: e.message, stack: e.stack };

							Logger.debug(`Running node "${executionNode.name}" finished with error`, {
								node: executionNode.name,
								workflowId: workflow.id,
							});
						}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1859-1914)

```typescript
					const taskData: ITaskData = {
						...taskStartedData,
						executionTime: Date.now() - taskStartedData.startTime,
						metadata: executionData.metadata,
						executionStatus: this.runExecutionData.waitTill ? 'waiting' : 'success',
					};

					if (executionError !== undefined) {
						taskData.error = executionError;
						taskData.executionStatus = 'error';

						// Send error to the response if necessary
						await hooks?.runHook('sendChunk', [
							{
								type: 'error',
								content: executionError.description,
								metadata: {
									nodeId: executionNode.id,
									nodeName: executionNode.name,
									runIndex,
									itemIndex: 0,
								},
							},
						]);

						if (
							executionData.node.continueOnFail === true ||
							['continueRegularOutput', 'continueErrorOutput'].includes(
								executionData.node.onError || '',
							)
						) {
							// Workflow should continue running even if node errors
							if (Object.hasOwn(executionData.data, 'main') && executionData.data.main.length > 0) {
								// Simply get the input data of the node if it has any and pass it through
								// to the next node
								if (executionData.data.main[0] !== null) {
									nodeSuccessData = [executionData.data.main[0]];
								}
							}
						} else {
							// Node execution did fail so add error and stop execution
							this.runExecutionData.resultData.runData[executionNode.name].push(taskData);

							// Add the execution data again so that it can get restarted
							this.runExecutionData.executionData!.nodeExecutionStack.unshift(executionData);
							// Only execute the nodeExecuteAfter hook if the node did not get aborted
							if (!this.isCancelled) {
								await hooks.runHook('nodeExecuteAfter', [
									executionNode.name,
									taskData,
									this.runExecutionData,
								]);
							}

							break;
						}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1937-1964)

```typescript
// Node executed successfully. So add data and go on.
taskData.data = {
  main: nodeSuccessData,
} as ITaskDataConnections;

// Rewire output data log to the given connectionType
if (executionNode.rewireOutputLogTo) {
  // TODO: Remove when AI-723 lands.
  taskData.inputOverride =
    this.runExecutionData.resultData.runData[executionNode.name][runIndex]
      ?.inputOverride || {};
  taskData.data = {
    [executionNode.rewireOutputLogTo]: nodeSuccessData,
  } as ITaskDataConnections;
}

const runDataAlreadyExists =
  !!this.runExecutionData.resultData.runData[executionNode.name][runIndex];
if (runDataAlreadyExists) {
  // TODO: Remove when AI-723 lands. There is no need to merge
  // anymore, because the only reason to have this entry already is
  // because of `inputOverride`.
  const currentTaskData =
    this.runExecutionData.resultData.runData[executionNode.name][runIndex];
  Object.assign(currentTaskData, taskData);
} else {
  this.runExecutionData.resultData.runData[executionNode.name].push(taskData);
}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L2393-2425)

```typescript
	async processSuccessExecution(
		startedAt: Date,
		workflow: Workflow,
		executionError?: ExecutionBaseError,
		closeFunction?: Promise<void>,
	): Promise<IRun> {
		const fullRunData = this.getFullRunData(startedAt);

		if (executionError !== undefined) {
			Logger.debug('Workflow execution finished with error', {
				error: executionError,
				workflowId: workflow.id,
			});
			fullRunData.data.resultData.error = {
				...executionError,
				message: executionError.message,
				stack: executionError.stack,
			} as ExecutionBaseError;
			if (executionError.message?.includes('canceled')) {
				fullRunData.status = 'canceled';
			}
		} else if (this.runExecutionData.waitTill) {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			Logger.debug(`Workflow execution will wait until ${this.runExecutionData.waitTill}`, {
				workflowId: workflow.id,
			});
			fullRunData.waitTill = this.runExecutionData.waitTill;
			fullRunData.status = 'waiting';
		} else {
			Logger.debug('Workflow execution finished successfully', { workflowId: workflow.id });
			fullRunData.finished = true;
			fullRunData.status = 'success';
		}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L2470-2568)

```typescript
	handleNodeErrorOutput(
		workflow: Workflow,
		executionData: IExecuteData,
		nodeSuccessData: INodeExecutionData[][],
		runIndex: number,
	): void {
		const nodeType = workflow.nodeTypes.getByNameAndVersion(
			executionData.node.type,
			executionData.node.typeVersion,
		);
		const outputs = NodeHelpers.getNodeOutputs(workflow, executionData.node, nodeType.description);
		const outputTypes = NodeHelpers.getConnectionTypes(outputs);
		const mainOutputTypes = outputTypes.filter((output) => output === NodeConnectionTypes.Main);

		const errorItems: INodeExecutionData[] = [];
		const closeFunctions: CloseFunction[] = [];
		// Create a WorkflowDataProxy instance that we can get the data of the
		// item which did error
		const executeFunctions = new ExecuteContext(
			workflow,
			executionData.node,
			this.additionalData,
			this.mode,
			this.runExecutionData,
			runIndex,
			[],
			executionData.data,
			executionData,
			closeFunctions,
			this.abortController.signal,
		);

		const dataProxy = executeFunctions.getWorkflowDataProxy(0);

		// Loop over all outputs except the error output as it would not contain data by default
		for (let outputIndex = 0; outputIndex < mainOutputTypes.length - 1; outputIndex++) {
			const successItems: INodeExecutionData[] = [];
			const items = nodeSuccessData[outputIndex]?.length ? nodeSuccessData[outputIndex] : [];

			while (items.length) {
				const item = items.shift();
				if (item === undefined) {
					continue;
				}

				let errorData: GenericValue | undefined;
				if (item.error) {
					errorData = item.error;
					item.error = undefined;
				} else if (item.json.error && Object.keys(item.json).length === 1) {
					errorData = item.json.error;
				} else if (item.json.error && item.json.message && Object.keys(item.json).length === 2) {
					errorData = item.json.error;
				}

				if (errorData) {
					const pairedItemData =
						item.pairedItem && typeof item.pairedItem === 'object'
							? Array.isArray(item.pairedItem)
								? item.pairedItem[0]
								: item.pairedItem
							: undefined;

					if (executionData.source === null || pairedItemData === undefined) {
						// Source data is missing for some reason so we can not figure out the item
						errorItems.push(item);
					} else {
						const pairedItemInputIndex = pairedItemData.input || 0;

						const sourceData = executionData.source[NodeConnectionTypes.Main][pairedItemInputIndex];

						const constPairedItem = dataProxy.$getPairedItem(
							sourceData!.previousNode,
							sourceData,
							pairedItemData,
						);

						if (constPairedItem === null) {
							errorItems.push(item);
						} else {
							errorItems.push({
								...item,
								json: {
									...constPairedItem.json,
									...item.json,
								},
							});
						}
					}
				} else {
					successItems.push(item);
				}
			}

			nodeSuccessData[outputIndex] = successItems;
		}

		nodeSuccessData[mainOutputTypes.length - 1] = errorItems;
	}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L2637-2646)

```typescript
	private updateTaskStatusesToCancelled(): void {
		Object.keys(this.runExecutionData.resultData.runData).forEach((nodeName) => {
			const taskDataArray = this.runExecutionData.resultData.runData[nodeName];
			taskDataArray.forEach((taskData) => {
				if (taskData.executionStatus === 'running') {
					taskData.executionStatus = 'canceled';
				}
			});
		});
	}
```

**File:** packages/core/src/execution-engine/node-execution-context/execute-context.ts (L1-100)

```typescript
import type {
	AINodeConnectionType,
	CallbackManager,
	ChunkType,
	CloseFunction,
	IDataObject,
	IExecuteData,
	IExecuteFunctions,
	IExecuteResponsePromiseData,
	IGetNodeParameterOptions,
	INode,
	INodeExecutionData,
	IRunExecutionData,
	ITaskDataConnections,
	IWorkflowExecuteAdditionalData,
	NodeExecutionHint,
	StructuredChunk,
	Workflow,
	WorkflowExecuteMode,
	EngineResponse,
} from 'n8n-workflow';
import {
	ApplicationError,
	createDeferredPromise,
	jsonParse,
	NodeConnectionTypes,
} from 'n8n-workflow';

import { BaseExecuteContext } from './base-execute-context';
import {
	assertBinaryData,
	getBinaryDataBuffer,
	copyBinaryFile,
	getBinaryHelperFunctions,
	detectBinaryEncoding,
} from './utils/binary-helper-functions';
import { constructExecutionMetaData } from './utils/construct-execution-metadata';
import { copyInputItems } from './utils/copy-input-items';
import { getDataTableHelperFunctions } from './utils/data-table-helper-functions';
import { getDeduplicationHelperFunctions } from './utils/deduplication-helper-functions';
import { getFileSystemHelperFunctions } from './utils/file-system-helper-functions';
import { getInputConnectionData } from './utils/get-input-connection-data';
import { normalizeItems } from './utils/normalize-items';
import { getRequestHelperFunctions } from './utils/request-helper-functions';
import { returnJsonArray } from './utils/return-json-array';
import { getSSHTunnelFunctions } from './utils/ssh-tunnel-helper-functions';

export class ExecuteContext extends BaseExecuteContext implements IExecuteFunctions {
	readonly helpers: IExecuteFunctions['helpers'];

	readonly nodeHelpers: IExecuteFunctions['nodeHelpers'];

	readonly getNodeParameter: IExecuteFunctions['getNodeParameter'];

	readonly hints: NodeExecutionHint[] = [];

	constructor(
		workflow: Workflow,
		node: INode,
		additionalData: IWorkflowExecuteAdditionalData,
		mode: WorkflowExecuteMode,
		runExecutionData: IRunExecutionData,
		runIndex: number,
		connectionInputData: INodeExecutionData[],
		inputData: ITaskDataConnections,
		executeData: IExecuteData,
		private readonly closeFunctions: CloseFunction[],
		abortSignal?: AbortSignal,
		public subNodeExecutionResults?: EngineResponse,
	) {
		super(
			workflow,
			node,
			additionalData,
			mode,
			runExecutionData,
			runIndex,
			connectionInputData,
			inputData,
			executeData,
			abortSignal,
		);

		this.helpers = {
			createDeferredPromise,
			returnJsonArray,
			copyInputItems,
			normalizeItems,
			constructExecutionMetaData,
			...getRequestHelperFunctions(
				workflow,
				node,
				additionalData,
				runExecutionData,
				connectionInputData,
			),
			...getBinaryHelperFunctions(additionalData, workflow.id),
			...getDataTableHelperFunctions(additionalData, workflow, node),
			...getSSHTunnelFunctions(),
			...getFileSystemHelperFunctions(node),
```

**File:** packages/workflow/src/interfaces.ts (L2383-2422)

```typescript
// The RunData, ExecuteData and WaitForExecution contain often the same data.
export interface IRunExecutionData {
  startData?: {
    startNodes?: StartNodeData[];
    destinationNode?: string;
    originalDestinationNode?: string;
    runNodeFilter?: string[];
  };
  resultData: {
    error?: ExecutionError;
    runData: IRunData;
    pinData?: IPinData;
    lastNodeExecuted?: string;
    metadata?: Record<string, string>;
  };
  executionData?: {
    contextData: IExecuteContextData;
    nodeExecutionStack: IExecuteData[];
    metadata: {
      // node-name: metadata by runIndex
      [key: string]: ITaskMetadata[];
    };
    waitingExecution: IWaitingForExecution;
    waitingExecutionSource: IWaitingForExecutionSource | null;
  };
  parentExecution?: RelatedExecution;
  /**
   * This is used to prevent breaking change
   * for waiting executions started before signature validation was added
   */
  validateSignature?: boolean;
  waitTill?: Date;
  pushRef?: string;

  /** Data needed for a worker to run a manual execution. */
  manualData?: Pick<
    IWorkflowExecutionDataProcess,
    "dirtyNodeNames" | "triggerToStartFrom" | "userId"
  >;
}
```

**File:** packages/workflow/src/interfaces.ts (L2442-2445)

```typescript
export interface IRunData {
  // node-name: result-data
  [key: string]: ITaskData[];
}
```

## Q5

how are the nodes inserted in the stack? and also this func processRunExecutionData will this get trigered for one individual user or for many users at once?

### Answer

# How Nodes Are Inserted in the Stack

You're asking about how nodes get added to the `nodeExecutionStack` in the `WorkflowExecute` class, and whether `processRunExecutionData()` handles single or multiple users.

## Node Stack Insertion

Nodes are inserted into the execution stack through the **`addNodeToBeExecuted()`** method n8n:542-845 . This method is called whenever a node completes execution and needs to schedule its downstream nodes.

### Initial Stack Population

When a workflow starts, the initial node is pushed onto the stack in the `run()` method n8n:142-156 . The starting node (typically a trigger) is added with empty JSON data `{json: {}}` as its input.

For partial executions (like when re-running from a specific node), the stack is recreated using `recreateNodeExecutionStack()` n8n:72-213 . This function analyzes the workflow graph, existing run data, and pinned data to determine which nodes need to execute and in what order.

### Dynamic Stack Population During Execution

As nodes execute, `addNodeToBeExecuted()` is called to schedule downstream nodes n8n:2079-2088 . The method handles two scenarios:

1. **Nodes with single input**: Directly pushed onto the stack n8n:827-843

2. **Nodes with multiple inputs**: Added to `waitingExecution` until all inputs have data n8n:542-598 . Once all inputs are ready, the node is moved from `waitingExecution` to `nodeExecutionStack` n8n:558-579 .

The system also handles nodes that should execute even without input data (like nodes with no incoming connections) n8n:722-771 .

### Waiting Execution Mechanism

For nodes waiting on multiple inputs, there's a special check at the end of each execution loop. If the stack is empty but there are nodes in `waitingExecution`, the system checks if any can execute with partial data n8n:2103-2223 . This handles cases where some inputs may never receive data.

## Single User vs Multi-User Execution

**`processRunExecutionData()` is triggered for ONE execution at a time** n8n:1458-1474 . Each workflow execution gets its own `WorkflowExecute` instance.

### How Multi-User Concurrency Works

When multiple users trigger workflows simultaneously:

1. **Regular Mode**: Each execution runs in the main process but in separate `WorkflowExecute` instances. The `ActiveExecutions` service tracks all running executions in memory n8n:259-266 .

2. **Queue Mode**: Each execution becomes a separate job in the Bull queue (Redis-backed). Worker processes pick up jobs and each worker runs one execution at a time<cite />.

The key point is that **each execution is isolated** - they don't share the same `runExecutionData` or `nodeExecutionStack`. The execution ID uniquely identifies each run n8n:211-266 .

### Execution Lifecycle

1. User triggers workflow → `WorkflowRunner.run()` is called n8n:56-88
2. A unique execution ID is generated and tracked in `ActiveExecutions` n8n:141-143
3. New `WorkflowExecute` instance is created with its own `runExecutionData` n8n:100-105
4. `processRunExecutionData()` runs the execution loop for that specific execution n8n:81-87

## Notes

The execution stack uses a **shift/push pattern**: nodes are removed from the front with `shift()` n8n:1547-1548 and added to the back with `push()` n8n:2222-2223 . This creates a queue-like behavior (FIFO) for node execution order, though the execution order can be influenced by workflow settings like `executionOrder: 'v1'` which considers node positions n8n:2074-2088 .

Wiki pages you might want to explore:

- [Architecture Overview (n8n-io/n8n)](/wiki/n8n-io/n8n#1.2)

### Citations

**File:** packages/core/src/execution-engine/workflow-execute.ts (L142-156)

```typescript
const nodeExecutionStack: IExecuteData[] = [
  {
    node: startNode,
    data: triggerToStartFrom?.data?.data ?? {
      main: [
        [
          {
            json: {},
          },
        ],
      ],
    },
    source: null,
  },
];
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L542-845)

```typescript
				i++
			) {
				thisExecutionData =
					this.runExecutionData.executionData!.waitingExecution[connectionData.node][
						waitingNodeIndex
					].main[i];
				if (thisExecutionData === null) {
					allDataFound = false;
					break;
				}
			}

			if (allDataFound) {
				// All data exists for node to be executed
				// So add it to the execution stack

				const executionStackItem = {
					node: workflow.nodes[connectionData.node],
					data: this.runExecutionData.executionData!.waitingExecution[connectionData.node][
						waitingNodeIndex
					],
					source:
						this.runExecutionData.executionData!.waitingExecutionSource[connectionData.node][
							waitingNodeIndex
						],
				} as IExecuteData;

				if (
					this.runExecutionData.executionData!.waitingExecutionSource !== null &&
					this.runExecutionData.executionData!.waitingExecutionSource !== undefined
				) {
					executionStackItem.source =
						this.runExecutionData.executionData!.waitingExecutionSource[connectionData.node][
							waitingNodeIndex
						];
				}

				this.runExecutionData.executionData!.nodeExecutionStack[enqueueFn](executionStackItem);

				// Remove the data from waiting
				delete this.runExecutionData.executionData!.waitingExecution[connectionData.node][
					waitingNodeIndex
				];
				delete this.runExecutionData.executionData!.waitingExecutionSource[connectionData.node][
					waitingNodeIndex
				];

				if (
					Object.keys(this.runExecutionData.executionData!.waitingExecution[connectionData.node])
						.length === 0
				) {
					// No more data left for the node so also delete that one
					delete this.runExecutionData.executionData!.waitingExecution[connectionData.node];
					delete this.runExecutionData.executionData!.waitingExecutionSource[connectionData.node];
				}
				return;
			}
			stillDataMissing = true;

			if (!nodeWasWaiting) {
				// Get a list of all the output nodes that we can check for siblings easier
				const checkOutputNodes = [];
				// eslint-disable-next-line @typescript-eslint/no-for-in-array
				for (const outputIndexParent in workflow.connectionsBySourceNode[parentNodeName].main) {
					if (
						!Object.hasOwn(workflow.connectionsBySourceNode[parentNodeName].main, outputIndexParent)
					) {
						continue;
					}
					for (const connectionDataCheck of workflow.connectionsBySourceNode[parentNodeName].main[
						outputIndexParent
					] ?? []) {
						checkOutputNodes.push(connectionDataCheck.node);
					}
				}

				// Node was not on "waitingExecution" so it is the first time it gets
				// checked. So we have to go through all the inputs and check if they
				// are already on the list to be processed.
				// If that is not the case add it.

				for (
					let inputIndex = 0;
					inputIndex < workflow.connectionsByDestinationNode[connectionData.node].main.length;
					inputIndex++
				) {
					for (const inputData of workflow.connectionsByDestinationNode[connectionData.node].main[
						inputIndex
					] ?? []) {
						if (inputData.node === parentNodeName) {
							// Is the node we come from so its data will be available for sure
							continue;
						}

						const executionStackNodes = this.runExecutionData.executionData!.nodeExecutionStack.map(
							(stackData) => stackData.node.name,
						);

						// Check if that node is also an output connection of the
						// previously processed one
						if (inputData.node !== parentNodeName && checkOutputNodes.includes(inputData.node)) {
							// So the parent node will be added anyway which
							// will then process this node next. So nothing to do
							// unless the incoming data of the node is empty
							// because then it would not be executed
							if (
								!this.incomingConnectionIsEmpty(
									this.runExecutionData.resultData.runData,
									workflow.connectionsByDestinationNode[inputData.node].main[0] ?? [],
									runIndex,
								)
							) {
								continue;
							}
						}

						// Check if it is already in the execution stack
						if (executionStackNodes.includes(inputData.node)) {
							// Node is already on the list to be executed
							// so there is nothing to do
							continue;
						}

						// Check if node got processed already
						if (this.runExecutionData.resultData.runData[inputData.node] !== undefined) {
							// Node got processed already so no need to add it
							continue;
						}

						if (!this.isLegacyExecutionOrder(workflow)) {
							// Do not automatically follow all incoming nodes and force them
							// to execute
							continue;
						}

						// Check if any of the parent nodes does not have any inputs. That
						// would mean that it has to get added to the list of nodes to process.
						const parentNodes = workflow.getParentNodes(
							inputData.node,
							NodeConnectionTypes.Main,
							-1,
						);
						let nodeToAdd: string | undefined = inputData.node;
						parentNodes.push(inputData.node);
						parentNodes.reverse();

						for (const parentNode of parentNodes) {
							// Check if that node is also an output connection of the
							// previously processed one
							if (inputData.node !== parentNode && checkOutputNodes.includes(parentNode)) {
								// So the parent node will be added anyway which
								// will then process this node next. So nothing to do.
								nodeToAdd = undefined;
								break;
							}

							// Check if it is already in the execution stack
							if (executionStackNodes.includes(parentNode)) {
								// Node is already on the list to be executed
								// so there is nothing to do
								nodeToAdd = undefined;
								break;
							}

							// Check if node got processed already
							if (this.runExecutionData.resultData.runData[parentNode] !== undefined) {
								// Node got processed already so we can use the
								// output data as input of this node
								break;
							}

							nodeToAdd = parentNode;
						}
						const parentNodesNodeToAdd = workflow.getParentNodes(nodeToAdd as string);
						if (
							parentNodesNodeToAdd.includes(parentNodeName) &&
							nodeSuccessData[outputIndex].length === 0
						) {
							// We do not add the node if there is no input data and the node that should be connected
							// is a child of the parent node. Because else it would run a node even though it should be
							// specifically not run, as it did not receive any data.
							nodeToAdd = undefined;
						}

						if (nodeToAdd === undefined) {
							// No node has to get added so process
							continue;
						}

						let addEmptyItem = false;

						if (workflow.connectionsByDestinationNode[nodeToAdd] === undefined) {
							// Add empty item if the node does not have any input connections
							addEmptyItem = true;
						} else if (
							this.incomingConnectionIsEmpty(
								this.runExecutionData.resultData.runData,
								workflow.connectionsByDestinationNode[nodeToAdd].main[0] ?? [],
								runIndex,
							)
						) {
							// Add empty item also if the input data is empty
							addEmptyItem = true;
						}

						if (addEmptyItem) {
							// Add only node if it does not have any inputs because else it will
							// be added by its input node later anyway.
							this.runExecutionData.executionData!.nodeExecutionStack[enqueueFn]({
								node: workflow.getNode(nodeToAdd) as INode,
								data: {
									main: [
										[
											{
												json: {},
											},
										],
									],
								},
								source: {
									main: [
										{
											previousNode: parentNodeName,
											previousNodeOutput: outputIndex || undefined,
											previousNodeRun: runIndex || undefined,
										},
									],
								},
							});
						}
					}
				}
			}
		}

		let connectionDataArray: Array<INodeExecutionData[] | null> = get(
			this.runExecutionData,
			[
				'executionData',
				'waitingExecution',
				connectionData.node,
				waitingNodeIndex!,
				NodeConnectionTypes.Main,
			],
			null,
		);

		if (connectionDataArray === null) {
			connectionDataArray = [];
			for (let i: number = connectionData.index; i >= 0; i--) {
				connectionDataArray[i] = null;
			}
		}

		// Add the data of the current execution
		if (nodeSuccessData === null) {
			connectionDataArray[connectionData.index] = null;
		} else {
			connectionDataArray[connectionData.index] = nodeSuccessData[outputIndex];
		}

		if (stillDataMissing) {
			waitingNodeIndex = waitingNodeIndex!;
			const waitingExecutionSource =
				this.runExecutionData.executionData!.waitingExecutionSource![connectionData.node][
					waitingNodeIndex
				].main;

			// Additional data is needed to run node so add it to waiting
			this.prepareWaitingToExecution(
				connectionData.node,
				workflow.connectionsByDestinationNode[connectionData.node].main.length,
				waitingNodeIndex,
			);

			this.runExecutionData.executionData!.waitingExecution[connectionData.node][waitingNodeIndex] =
				{
					main: connectionDataArray,
				};

			this.runExecutionData.executionData!.waitingExecutionSource![connectionData.node][
				waitingNodeIndex
			].main = waitingExecutionSource;
		} else {
			// All data is there so add it directly to stack
			this.runExecutionData.executionData!.nodeExecutionStack[enqueueFn]({
				node: workflow.nodes[connectionData.node],
				data: {
					main: connectionDataArray,
				},
				source: {
					main: [
						{
							previousNode: parentNodeName,
							previousNodeOutput: outputIndex || undefined,
							previousNodeRun: runIndex || undefined,
						},
					],
				},
				runIndex: newRunIndex,
				metadata,
			});
		}
	}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1458-1474)

```typescript
	processRunExecutionData(workflow: Workflow): PCancelable<IRun> {
		Logger.debug('Workflow execution started', { workflowId: workflow.id });
		const { startedAt, hooks } = this.setupExecution();
		this.checkForWorkflowIssues(workflow);
		this.handleWaitingState(workflow);

		// Variables which hold temporary data for each node-execution
		let executionData: IExecuteData;
		let subNodeExecutionResults: EngineResponse = makeEngineResponse();
		let executionError: ExecutionBaseError | undefined;
		let executionNode: INode;
		let runIndex: number;
		let currentExecutionTry = '';
		let lastExecutionTry = '';
		let closeFunction: Promise<void> | undefined;

		return new PCancelable(async (resolve, _reject, onCancel) => {
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1547-1548)

```typescript
executionData =
  this.runExecutionData.executionData!.nodeExecutionStack.shift() as IExecuteData;
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L2074-2088)

```typescript
									}

									return 0;
								});

								for (const nodeData of nodesToAdd) {
									this.addNodeToBeExecuted(
										workflow,
										nodeData.connection,
										nodeData.outputIndex,
										executionNode.name,
										nodeSuccessData!,
										runIndex,
									);
								}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L2103-2223)

```typescript
					let waitingNodes: string[] = Object.keys(
						this.runExecutionData.executionData!.waitingExecution,
					);

					if (
						this.runExecutionData.executionData!.nodeExecutionStack.length === 0 &&
						waitingNodes.length
					) {
						// There are no more nodes in the execution stack. Check if there are
						// waiting nodes that do not require data on all inputs and execute them,
						// one by one.

						// TODO: Should this also care about workflow position (top-left first?)
						for (let i = 0; i < waitingNodes.length; i++) {
							const nodeName = waitingNodes[i];

							const checkNode = workflow.getNode(nodeName);
							if (!checkNode) {
								continue;
							}
							const nodeType = workflow.nodeTypes.getByNameAndVersion(
								checkNode.type,
								checkNode.typeVersion,
							);

							// Check if the node is only allowed execute if all inputs received data
							let requiredInputs =
								workflow.settings.executionOrder === 'v1'
									? nodeType.description.requiredInputs
									: undefined;
							if (requiredInputs !== undefined) {
								if (typeof requiredInputs === 'string') {
									requiredInputs = workflow.expression.getSimpleParameterValue(
										checkNode,
										requiredInputs,
										this.mode,
										{ $version: checkNode.typeVersion },
										undefined,
										[],
									) as number[];
								}

								if (
									(requiredInputs !== undefined &&
										Array.isArray(requiredInputs) &&
										requiredInputs.length === nodeType.description.inputs.length) ||
									requiredInputs === nodeType.description.inputs.length
								) {
									// All inputs are required, but not all have data so do not continue
									continue;
								}
							}

							const parentNodes = workflow.getParentNodes(nodeName);

							// Check if input nodes (of same run) got already executed

							const parentIsWaiting = parentNodes.some((value) => waitingNodes.includes(value));
							if (parentIsWaiting) {
								// Execute node later as one of its dependencies is still outstanding
								continue;
							}

							const runIndexes = Object.keys(
								this.runExecutionData.executionData!.waitingExecution[nodeName],
							).sort();

							// The run-index of the earliest outstanding one
							const firstRunIndex = parseInt(runIndexes[0]);

							// Find all the inputs which received any kind of data, even if it was an empty
							// array as this shows that the parent nodes executed but they did not have any
							// data to pass on.
							const inputsWithData = this.runExecutionData
								.executionData!.waitingExecution[nodeName][firstRunIndex].main.map((data, index) =>
									data === null ? null : index,
								)
								.filter((data) => data !== null);

							if (requiredInputs !== undefined) {
								// Certain inputs are required that the node can execute

								if (Array.isArray(requiredInputs)) {
									// Specific inputs are required (array of input indexes)
									let inputDataMissing = false;
									for (const requiredInput of requiredInputs) {
										if (!inputsWithData.includes(requiredInput)) {
											inputDataMissing = true;
											break;
										}
									}
									if (inputDataMissing) {
										continue;
									}
								} else {
									// A certain amount of inputs are required (amount of inputs)
									if (inputsWithData.length < requiredInputs) {
										continue;
									}
								}
							}

							const taskDataMain = this.runExecutionData.executionData!.waitingExecution[nodeName][
								firstRunIndex
							].main.map((data) => {
								// For the inputs for which never any data got received set it to an empty array
								return data === null ? [] : data;
							});

							if (taskDataMain.filter((data) => data.length).length !== 0) {
								// Add the node to be executed

								// Make sure that each input at least receives an empty array
								if (taskDataMain.length < nodeType.description.inputs.length) {
									for (; taskDataMain.length < nodeType.description.inputs.length; ) {
										taskDataMain.push([]);
									}
								}

								this.runExecutionData.executionData!.nodeExecutionStack.push({
									node: workflow.nodes[nodeName],
```

**File:** packages/core/src/execution-engine/partial-execution-utils/recreate-node-execution-stack.ts (L72-213)

```typescript
export function recreateNodeExecutionStack(
	graph: DirectedGraph,
	startNodes: Set<INode>,
	runData: IRunData,
	pinData: IPinData,
): {
	nodeExecutionStack: IExecuteData[];
	waitingExecution: IWaitingForExecution;
	waitingExecutionSource: IWaitingForExecutionSource;
} {
	// Validate invariants.

	// The graph needs to be free of disabled nodes. If it's not it hasn't been
	// passed through findSubgraph.
	for (const node of graph.getNodes().values()) {
		a.notEqual(
			node.disabled,
			true,
			`Graph contains disabled nodes. This is not supported. Make sure to pass the graph through "findSubgraph" before calling "recreateNodeExecutionStack". The node in question is "${node.name}"`,
		);
	}

	// Initialize the nodeExecutionStack and waitingExecution with
	// the data from runData
	const nodeExecutionStack: IExecuteData[] = [];
	const waitingExecution: IWaitingForExecution = {};
	const waitingExecutionSource: IWaitingForExecutionSource = {};

	for (const startNode of startNodes) {
		const incomingStartNodeConnections = graph
			.getDirectParentConnections(startNode)
			.filter((c) => c.type === NodeConnectionTypes.Main);

		let incomingData: INodeExecutionData[][] = [];
		let incomingSourceData: ITaskDataConnectionsSource | null = null;

		if (incomingStartNodeConnections.length === 0) {
			incomingData.push([{ json: {} }]);

			const executeData: IExecuteData = {
				node: startNode,
				data: { main: incomingData },
				source: incomingSourceData,
			};

			nodeExecutionStack.push(executeData);
		} else {
			const sourceDataSets = getSourceDataGroups(graph, startNode, runData, pinData);

			for (const sourceData of sourceDataSets) {
				if (sourceData.complete) {
					// All incoming connections have data, so let's put the node on the
					// stack!
					incomingData = [];

					incomingSourceData = { main: [] };

					for (const incomingConnection of sourceData.connections) {
						let runIndex = 0;
						const sourceNode = incomingConnection.from;

						if (pinData[sourceNode.name]) {
							incomingData.push(pinData[sourceNode.name]);
						} else {
							a.ok(
								runData[sourceNode.name],
								`Start node(${incomingConnection.to.name}) has an incoming connection with no run or pinned data. This is not supported. The connection in question is "${sourceNode.name}->${startNode.name}". Are you sure the start nodes come from the "findStartNodes" function?`,
							);

							const nodeIncomingData = getIncomingDataFromAnyRun(
								runData,
								sourceNode.name,
								incomingConnection.type,
								incomingConnection.outputIndex,
							);

							if (nodeIncomingData) {
								runIndex = nodeIncomingData.runIndex;
								incomingData.push(nodeIncomingData.data);
							}
						}

						incomingSourceData.main.push({
							previousNode: incomingConnection.from.name,
							previousNodeOutput: incomingConnection.outputIndex,
							previousNodeRun: runIndex,
						});
					}

					const executeData: IExecuteData = {
						node: startNode,
						data: { main: incomingData },
						source: incomingSourceData,
					};

					nodeExecutionStack.push(executeData);
				} else {
					const nodeName = startNode.name;
					const nextRunIndex = waitingExecution[nodeName]
						? Object.keys(waitingExecution[nodeName]).length
						: 0;

					for (const incomingConnection of sourceData.connections) {
						const sourceNode = incomingConnection.from;
						const maybeNodeIncomingData = getIncomingDataFromAnyRun(
							runData,
							sourceNode.name,
							incomingConnection.type,
							incomingConnection.outputIndex,
						);
						const nodeIncomingData = maybeNodeIncomingData?.data ?? null;

						if (nodeIncomingData) {
							addWaitingExecution(
								waitingExecution,
								nodeName,
								nextRunIndex,
								incomingConnection.type,
								incomingConnection.inputIndex,
								nodeIncomingData,
							);

							addWaitingExecutionSource(
								waitingExecutionSource,
								nodeName,
								nextRunIndex,
								incomingConnection.type,
								incomingConnection.inputIndex,
								nodeIncomingData
									? {
											previousNode: incomingConnection.from.name,
											previousNodeRun: nextRunIndex,
											previousNodeOutput: incomingConnection.outputIndex,
										}
									: null,
							);
						}
					}
				}
			}
		}
	}
```

**File:** packages/cli/src/workflow-execute-additional-data.ts (L211-266)

```typescript
	try {
		await Container.get(CredentialsPermissionChecker).check(workflowData.id, workflowData.nodes);
		await Container.get(SubworkflowPolicyChecker).check(
			workflow,
			options.parentWorkflowId,
			options.node,
			additionalData.userId,
		);

		// Create new additionalData to have different workflow loaded and to call
		// different webhooks
		const additionalDataIntegrated = await getBase();
		additionalDataIntegrated.hooks = getLifecycleHooksForSubExecutions(
			runData.executionMode,
			executionId,
			workflowData,
			additionalData.userId,
		);
		additionalDataIntegrated.executionId = executionId;
		additionalDataIntegrated.parentCallbackManager = options.parentCallbackManager;

		// Make sure we pass on the original executeWorkflow function we received
		// This one already contains changes to talk to parent process
		// and get executionID from `activeExecutions` running on main process
		additionalDataIntegrated.executeWorkflow = additionalData.executeWorkflow;
		if (additionalData.httpResponse) {
			additionalDataIntegrated.httpResponse = additionalData.httpResponse;
		}
		// Propagate streaming state to subworkflows
		additionalDataIntegrated.streamingEnabled = additionalData.streamingEnabled;

		let subworkflowTimeout = additionalData.executionTimeoutTimestamp;
		const workflowSettings = workflowData.settings;
		if (workflowSettings?.executionTimeout !== undefined && workflowSettings.executionTimeout > 0) {
			// We might have received a max timeout timestamp from the parent workflow
			// If we did, then we get the minimum time between the two timeouts
			// If no timeout was given from the parent, then we use our timeout.
			subworkflowTimeout = Math.min(
				additionalData.executionTimeoutTimestamp || Number.MAX_SAFE_INTEGER,
				startTime + workflowSettings.executionTimeout * 1000,
			);
		}

		additionalDataIntegrated.executionTimeoutTimestamp = subworkflowTimeout;

		const runExecutionData = runData.executionData as IRunExecutionData;

		// Execute the workflow
		const workflowExecute = new WorkflowExecute(
			additionalDataIntegrated,
			runData.executionMode,
			runExecutionData,
		);
		const execution = workflowExecute.processRunExecutionData(workflow);
		activeExecutions.attachWorkflowExecution(executionId, execution);
		data = await execution;
```

**File:** packages/cli/src/workflows/workflow-execution.service.ts (L56-88)

```typescript
const nodeExecutionStack: IExecuteData[] = [
  {
    node,
    data: {
      main: data,
    },
    source: null,
  },
];

const executionData: IRunExecutionData = {
  startData: {},
  resultData: {
    runData: {},
  },
  executionData: {
    contextData: {},
    metadata: {},
    nodeExecutionStack,
    waitingExecution: {},
    waitingExecutionSource: {},
  },
};

// Start the workflow
const runData: IWorkflowExecutionDataProcess = {
  userId: additionalData.userId,
  executionMode: mode,
  executionData,
  workflowData,
};

return await this.workflowRunner.run(
  runData,
  true,
  undefined,
  undefined,
  responsePromise
);
```

**File:** packages/cli/src/**tests**/workflow-runner.test.ts (L141-143)

```typescript
const activeExecutions = Container.get(ActiveExecutions);
jest.spyOn(activeExecutions, "add").mockResolvedValue("1");
jest.spyOn(activeExecutions, "attachWorkflowExecution").mockReturnValueOnce();
```

**File:** packages/cli/src/manual-execution.service.ts (L100-105)

```typescript
const workflowExecute = new WorkflowExecute(
  additionalData,
  data.executionMode,
  executionData
);
return workflowExecute.processRunExecutionData(workflow);
```

**File:** packages/core/src/execution-engine/**tests**/workflow-execute-process-process-run-execution-data.test.ts (L81-87)

```typescript
const workflowExecute = new WorkflowExecute(
  additionalData,
  executionMode,
  executionData
);

// ACT
const result = await workflowExecute.processRunExecutionData(workflow);

// ASSERT
expect(result.data.resultData.runData).toMatchObject({
  node: [{ data: taskDataConnection }],
});
```

## Q6

I am not getting theory like why are we using stacks for execution. isnt there like any global queue where it pushes all the next nodes once oone node excution is complete and also can u give me entire flow like once when users clicks on run workflow. what will happen in terms of code . also tell me how this is handling multiples users . be as verbose as possible

### Answer

I'll help you understand the workflow execution flow in n8n, explaining why stacks are used, the complete execution flow, and how multiple users are handled.

## Why Use a Stack for Execution?

The stack-based approach in n8n isn't actually a global queue - it's a **per-execution local stack** n8n:91-104 . Here's why this design makes sense:

**1. Execution Isolation**: Each workflow execution gets its own `WorkflowExecute` instance with its own `nodeExecutionStack` n8n:88-105 . This ensures that different users' executions don't interfere with each other<cite />.

**2. Dynamic Scheduling**: As nodes complete, they dynamically add their downstream nodes to the stack n8n:1998-2091 . This allows for flexible execution order based on data flow and node positions<cite />.

**3. Waiting Mechanism**: Nodes with multiple inputs need to wait until all inputs have data. The `waitingExecution` map tracks these nodes separately n8n:541-597 . Once all inputs are ready, they're moved to the execution stack<cite />.

## Complete Flow: User Clicks "Run Workflow"

Let me trace the entire execution flow with code references:

### Step 1: HTTP Request Arrives

When you click "Run Workflow" in the UI, it sends a POST request to the backend<cite />.

**Frontend → Backend**: The request hits `WorkflowExecutionService.executeManually()` n8n:103-118 .

### Step 2: Execution Registration

The `WorkflowRunner.run()` method is called, which first registers the execution with a unique ID n8n:141-149 :

```typescript
const executionId = await this.activeExecutions.add(data, restartExecutionId);
```

This creates an entry in the `ActiveExecutions` service that tracks all running executions in memory<cite />.

### Step 3: Mode Selection (Regular vs Queue)

The system checks the execution mode configuration n8n:174-183 :

- **Regular Mode**: Execution runs directly in the main process
- **Queue Mode**: Execution is enqueued to Redis/Bull queue for worker processes

For manual executions, it typically runs in regular mode unless `OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS=true`<cite />.

### Step 4: WorkflowExecute Instance Creation

A new `WorkflowExecute` instance is created with initial execution data n8n:100-104 :

```typescript
const workflowExecute = new WorkflowExecute(
  additionalData,
  data.executionMode,
  executionData
);
```

The constructor initializes the execution stack with the starting node n8n:142-156 :

```typescript
const nodeExecutionStack: IExecuteData[] = [
  {
    node: startNode,
    data: {
      main: [[{ json: {} }]],
    },
    source: null,
  },
];
```

### Step 5: Main Execution Loop

The `processRunExecutionData()` method starts the main execution loop n8n:1457-1473 . This is a **while loop** that continues until the stack is empty:

```typescript
executionLoop: while (
  this.runExecutionData.executionData!.nodeExecutionStack.length !== 0
) {
  // Pop node from stack
  const executionData =
    this.runExecutionData.executionData!.nodeExecutionStack.shift();

  // Execute the node
  // Add downstream nodes to stack
}
```

### Step 6: Node Execution

For each node popped from the stack n8n:1546-1547 :

1. **Execute the node** via `runNode()` n8n:1237-1325
2. **Store output** in `runExecutionData.resultData.runData[nodeName]` n8n:1936-1963
3. **Schedule downstream nodes** by calling `addNodeToBeExecuted()` for each connected node n8n:2079-2088

### Step 7: Adding Nodes to Stack

When a node completes, the system iterates through its output connections n8n:2012-2043 :

```typescript
for (outputIndex in workflow.connectionsBySourceNode[executionNode.name].main) {
  for (connectionData of workflow.connectionsBySourceNode[executionNode.name].main[outputIndex]) {
    // Add connected node to execution stack
    this.addNodeToBeExecuted(workflow, connectionData, ...);
  }
}
```

The `addNodeToBeExecuted()` method handles two cases n8n:541-844 :

- **Single input nodes**: Directly pushed to `nodeExecutionStack`
- **Multiple input nodes**: Added to `waitingExecution` until all inputs arrive

### Step 8: Completion

When the stack is empty and no nodes are waiting, the execution completes n8n:2392-2424 . The final status is determined:

- `success`: All nodes completed successfully
- `error`: A node failed and stopped execution
- `waiting`: Execution paused (Wait node, webhook response)

## How Multiple Users Are Handled

**Complete Isolation Per Execution**:

1. **Unique Execution ID**: Each execution gets a UUID n8n:149-149
2. **Separate WorkflowExecute Instance**: Each execution creates its own instance with isolated state n8n:100-104
3. **Independent Stack**: Each instance has its own `nodeExecutionStack` and `runExecutionData` n8n:91-104

**Concurrency Management**:

- **Regular Mode**: Multiple executions run concurrently in the same Node.js process, tracked by `ActiveExecutions`<cite />
- **Queue Mode**: Executions are distributed across worker processes via Bull/Redis queue n8n:87-106

**Example Scenario**: If User A and User B both click "Run Workflow" simultaneously:

1. User A's request → `executionId: "abc-123"` → `WorkflowExecute` instance #1 → Stack A
2. User B's request → `executionId: "def-456"` → `WorkflowExecute` instance #2 → Stack B

Both executions run independently with zero shared state<cite />.

## Why Not a Global Queue?

A global queue would create several problems:

1. **No execution isolation**: All nodes from all users would be in one queue
2. **Complex state management**: Tracking which nodes belong to which execution
3. **Difficult error handling**: One execution's failure could affect others
4. **No execution-specific context**: Each node needs access to its execution's data

The per-execution stack design provides **clean isolation, simple state management, and easy error recovery**<cite />.

## Notes

The stack uses FIFO (shift/push) behavior n8n:1546-1547 , but execution order can be influenced by workflow settings like `executionOrder: 'v1'` which considers node canvas positions n8n:2041-2077 . The `waitingExecution` mechanism ensures nodes with multiple inputs only execute when all inputs have data n8n:2103-2222 .

Wiki pages you might want to explore:

- [Architecture Overview (n8n-io/n8n)](/wiki/n8n-io/n8n#1.2)

### Citations

**File:** packages/core/src/execution-engine/workflow-execute.ts (L88-105)

```typescript
	constructor(
		private readonly additionalData: IWorkflowExecuteAdditionalData,
		private readonly mode: WorkflowExecuteMode,
		private runExecutionData: IRunExecutionData = {
			startData: {},
			resultData: {
				runData: {},
				pinData: {},
			},
			executionData: {
				contextData: {},
				nodeExecutionStack: [],
				metadata: {},
				waitingExecution: {},
				waitingExecutionSource: {},
			},
		},
	) {}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L142-156)

```typescript
const nodeExecutionStack: IExecuteData[] = [
  {
    node: startNode,
    data: triggerToStartFrom?.data?.data ?? {
      main: [
        [
          {
            json: {},
          },
        ],
      ],
    },
    source: null,
  },
];
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L541-844)

```typescript
					.main.length;
				i++
			) {
				thisExecutionData =
					this.runExecutionData.executionData!.waitingExecution[connectionData.node][
						waitingNodeIndex
					].main[i];
				if (thisExecutionData === null) {
					allDataFound = false;
					break;
				}
			}

			if (allDataFound) {
				// All data exists for node to be executed
				// So add it to the execution stack

				const executionStackItem = {
					node: workflow.nodes[connectionData.node],
					data: this.runExecutionData.executionData!.waitingExecution[connectionData.node][
						waitingNodeIndex
					],
					source:
						this.runExecutionData.executionData!.waitingExecutionSource[connectionData.node][
							waitingNodeIndex
						],
				} as IExecuteData;

				if (
					this.runExecutionData.executionData!.waitingExecutionSource !== null &&
					this.runExecutionData.executionData!.waitingExecutionSource !== undefined
				) {
					executionStackItem.source =
						this.runExecutionData.executionData!.waitingExecutionSource[connectionData.node][
							waitingNodeIndex
						];
				}

				this.runExecutionData.executionData!.nodeExecutionStack[enqueueFn](executionStackItem);

				// Remove the data from waiting
				delete this.runExecutionData.executionData!.waitingExecution[connectionData.node][
					waitingNodeIndex
				];
				delete this.runExecutionData.executionData!.waitingExecutionSource[connectionData.node][
					waitingNodeIndex
				];

				if (
					Object.keys(this.runExecutionData.executionData!.waitingExecution[connectionData.node])
						.length === 0
				) {
					// No more data left for the node so also delete that one
					delete this.runExecutionData.executionData!.waitingExecution[connectionData.node];
					delete this.runExecutionData.executionData!.waitingExecutionSource[connectionData.node];
				}
				return;
			}
			stillDataMissing = true;

			if (!nodeWasWaiting) {
				// Get a list of all the output nodes that we can check for siblings easier
				const checkOutputNodes = [];
				// eslint-disable-next-line @typescript-eslint/no-for-in-array
				for (const outputIndexParent in workflow.connectionsBySourceNode[parentNodeName].main) {
					if (
						!Object.hasOwn(workflow.connectionsBySourceNode[parentNodeName].main, outputIndexParent)
					) {
						continue;
					}
					for (const connectionDataCheck of workflow.connectionsBySourceNode[parentNodeName].main[
						outputIndexParent
					] ?? []) {
						checkOutputNodes.push(connectionDataCheck.node);
					}
				}

				// Node was not on "waitingExecution" so it is the first time it gets
				// checked. So we have to go through all the inputs and check if they
				// are already on the list to be processed.
				// If that is not the case add it.

				for (
					let inputIndex = 0;
					inputIndex < workflow.connectionsByDestinationNode[connectionData.node].main.length;
					inputIndex++
				) {
					for (const inputData of workflow.connectionsByDestinationNode[connectionData.node].main[
						inputIndex
					] ?? []) {
						if (inputData.node === parentNodeName) {
							// Is the node we come from so its data will be available for sure
							continue;
						}

						const executionStackNodes = this.runExecutionData.executionData!.nodeExecutionStack.map(
							(stackData) => stackData.node.name,
						);

						// Check if that node is also an output connection of the
						// previously processed one
						if (inputData.node !== parentNodeName && checkOutputNodes.includes(inputData.node)) {
							// So the parent node will be added anyway which
							// will then process this node next. So nothing to do
							// unless the incoming data of the node is empty
							// because then it would not be executed
							if (
								!this.incomingConnectionIsEmpty(
									this.runExecutionData.resultData.runData,
									workflow.connectionsByDestinationNode[inputData.node].main[0] ?? [],
									runIndex,
								)
							) {
								continue;
							}
						}

						// Check if it is already in the execution stack
						if (executionStackNodes.includes(inputData.node)) {
							// Node is already on the list to be executed
							// so there is nothing to do
							continue;
						}

						// Check if node got processed already
						if (this.runExecutionData.resultData.runData[inputData.node] !== undefined) {
							// Node got processed already so no need to add it
							continue;
						}

						if (!this.isLegacyExecutionOrder(workflow)) {
							// Do not automatically follow all incoming nodes and force them
							// to execute
							continue;
						}

						// Check if any of the parent nodes does not have any inputs. That
						// would mean that it has to get added to the list of nodes to process.
						const parentNodes = workflow.getParentNodes(
							inputData.node,
							NodeConnectionTypes.Main,
							-1,
						);
						let nodeToAdd: string | undefined = inputData.node;
						parentNodes.push(inputData.node);
						parentNodes.reverse();

						for (const parentNode of parentNodes) {
							// Check if that node is also an output connection of the
							// previously processed one
							if (inputData.node !== parentNode && checkOutputNodes.includes(parentNode)) {
								// So the parent node will be added anyway which
								// will then process this node next. So nothing to do.
								nodeToAdd = undefined;
								break;
							}

							// Check if it is already in the execution stack
							if (executionStackNodes.includes(parentNode)) {
								// Node is already on the list to be executed
								// so there is nothing to do
								nodeToAdd = undefined;
								break;
							}

							// Check if node got processed already
							if (this.runExecutionData.resultData.runData[parentNode] !== undefined) {
								// Node got processed already so we can use the
								// output data as input of this node
								break;
							}

							nodeToAdd = parentNode;
						}
						const parentNodesNodeToAdd = workflow.getParentNodes(nodeToAdd as string);
						if (
							parentNodesNodeToAdd.includes(parentNodeName) &&
							nodeSuccessData[outputIndex].length === 0
						) {
							// We do not add the node if there is no input data and the node that should be connected
							// is a child of the parent node. Because else it would run a node even though it should be
							// specifically not run, as it did not receive any data.
							nodeToAdd = undefined;
						}

						if (nodeToAdd === undefined) {
							// No node has to get added so process
							continue;
						}

						let addEmptyItem = false;

						if (workflow.connectionsByDestinationNode[nodeToAdd] === undefined) {
							// Add empty item if the node does not have any input connections
							addEmptyItem = true;
						} else if (
							this.incomingConnectionIsEmpty(
								this.runExecutionData.resultData.runData,
								workflow.connectionsByDestinationNode[nodeToAdd].main[0] ?? [],
								runIndex,
							)
						) {
							// Add empty item also if the input data is empty
							addEmptyItem = true;
						}

						if (addEmptyItem) {
							// Add only node if it does not have any inputs because else it will
							// be added by its input node later anyway.
							this.runExecutionData.executionData!.nodeExecutionStack[enqueueFn]({
								node: workflow.getNode(nodeToAdd) as INode,
								data: {
									main: [
										[
											{
												json: {},
											},
										],
									],
								},
								source: {
									main: [
										{
											previousNode: parentNodeName,
											previousNodeOutput: outputIndex || undefined,
											previousNodeRun: runIndex || undefined,
										},
									],
								},
							});
						}
					}
				}
			}
		}

		let connectionDataArray: Array<INodeExecutionData[] | null> = get(
			this.runExecutionData,
			[
				'executionData',
				'waitingExecution',
				connectionData.node,
				waitingNodeIndex!,
				NodeConnectionTypes.Main,
			],
			null,
		);

		if (connectionDataArray === null) {
			connectionDataArray = [];
			for (let i: number = connectionData.index; i >= 0; i--) {
				connectionDataArray[i] = null;
			}
		}

		// Add the data of the current execution
		if (nodeSuccessData === null) {
			connectionDataArray[connectionData.index] = null;
		} else {
			connectionDataArray[connectionData.index] = nodeSuccessData[outputIndex];
		}

		if (stillDataMissing) {
			waitingNodeIndex = waitingNodeIndex!;
			const waitingExecutionSource =
				this.runExecutionData.executionData!.waitingExecutionSource![connectionData.node][
					waitingNodeIndex
				].main;

			// Additional data is needed to run node so add it to waiting
			this.prepareWaitingToExecution(
				connectionData.node,
				workflow.connectionsByDestinationNode[connectionData.node].main.length,
				waitingNodeIndex,
			);

			this.runExecutionData.executionData!.waitingExecution[connectionData.node][waitingNodeIndex] =
				{
					main: connectionDataArray,
				};

			this.runExecutionData.executionData!.waitingExecutionSource![connectionData.node][
				waitingNodeIndex
			].main = waitingExecutionSource;
		} else {
			// All data is there so add it directly to stack
			this.runExecutionData.executionData!.nodeExecutionStack[enqueueFn]({
				node: workflow.nodes[connectionData.node],
				data: {
					main: connectionDataArray,
				},
				source: {
					main: [
						{
							previousNode: parentNodeName,
							previousNodeOutput: outputIndex || undefined,
							previousNodeRun: runIndex || undefined,
						},
					],
				},
				runIndex: newRunIndex,
				metadata,
			});
		}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1237-1325)

```typescript
	 */
	async runNode(
		workflow: Workflow,
		executionData: IExecuteData,
		runExecutionData: IRunExecutionData,
		runIndex: number,
		additionalData: IWorkflowExecuteAdditionalData,
		mode: WorkflowExecuteMode,
		abortSignal?: AbortSignal,
		subNodeExecutionResults?: EngineResponse,
	): Promise<IRunNodeResponse | EngineRequest> {
		const { node } = executionData;
		let inputData = executionData.data;

		if (node.disabled === true) {
			return this.handleDisabledNode(inputData);
		}

		const nodeType = workflow.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
		const customOperation = this.getCustomOperation(node, nodeType);

		const connectionInputData = this.prepareConnectionInputData(
			workflow,
			nodeType,
			customOperation,
			inputData,
		);

		if (connectionInputData === null) {
			return { data: undefined };
		}

		this.rethrowLastNodeError(runExecutionData, node);

		inputData = this.handleExecuteOnce(node, inputData);

		if (nodeType.execute || customOperation) {
			return await this.executeNode(
				workflow,
				node,
				nodeType,
				customOperation,
				additionalData,
				mode,
				runExecutionData,
				runIndex,
				connectionInputData,
				inputData,
				executionData,
				abortSignal,
				subNodeExecutionResults,
			);
		}

		if (nodeType.poll) {
			return await this.executePollNode(workflow, node, nodeType, additionalData, mode, inputData);
		}

		if (nodeType.trigger) {
			return await this.executeTriggerNode(
				workflow,
				node,
				additionalData,
				mode,
				inputData,
				abortSignal,
			);
		}

		const isDeclarativeNode = nodeType.description.requestDefaults !== undefined;
		if (nodeType.webhook && !isDeclarativeNode) {
			// Check if the node have requestDefaults(Declarative Node),
			// else for webhook nodes always simply pass the data through
			// as webhook method would be called by WebhookService
			return { data: inputData.main as INodeExecutionData[][] };
		}

		return await this.executeDeclarativeNodeInTest(
			workflow,
			node,
			nodeType,
			additionalData,
			mode,
			runExecutionData,
			runIndex,
			connectionInputData,
			inputData,
			executionData,
		);
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1457-1473)

```typescript
	// eslint-disable-next-line @typescript-eslint/promise-function-async
	processRunExecutionData(workflow: Workflow): PCancelable<IRun> {
		Logger.debug('Workflow execution started', { workflowId: workflow.id });
		const { startedAt, hooks } = this.setupExecution();
		this.checkForWorkflowIssues(workflow);
		this.handleWaitingState(workflow);

		// Variables which hold temporary data for each node-execution
		let executionData: IExecuteData;
		let subNodeExecutionResults: EngineResponse = makeEngineResponse();
		let executionError: ExecutionBaseError | undefined;
		let executionNode: INode;
		let runIndex: number;
		let currentExecutionTry = '';
		let lastExecutionTry = '';
		let closeFunction: Promise<void> | undefined;

```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1546-1547)

```typescript
					executionError = undefined;
					executionData =
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1936-1963)

```typescript

					// Node executed successfully. So add data and go on.
					taskData.data = {
						main: nodeSuccessData,
					} as ITaskDataConnections;

					// Rewire output data log to the given connectionType
					if (executionNode.rewireOutputLogTo) {
						// TODO: Remove when AI-723 lands.
						taskData.inputOverride =
							this.runExecutionData.resultData.runData[executionNode.name][runIndex]
								?.inputOverride || {};
						taskData.data = {
							[executionNode.rewireOutputLogTo]: nodeSuccessData,
						} as ITaskDataConnections;
					}

					const runDataAlreadyExists =
						!!this.runExecutionData.resultData.runData[executionNode.name][runIndex];
					if (runDataAlreadyExists) {
						// TODO: Remove when AI-723 lands. There is no need to merge
						// anymore, because the only reason to have this entry already is
						// because of `inputOverride`.
						const currentTaskData =
							this.runExecutionData.resultData.runData[executionNode.name][runIndex];
						Object.assign(currentTaskData, taskData);
					} else {
						this.runExecutionData.resultData.runData[executionNode.name].push(taskData);
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1998-2091)

```typescript
if (Object.hasOwn(workflow.connectionsBySourceNode, executionNode.name)) {
  if (
    Object.hasOwn(workflow.connectionsBySourceNode[executionNode.name], "main")
  ) {
    let outputIndex: string;
    let connectionData: IConnection;
    // Iterate over all the outputs

    const nodesToAdd: Array<{
      position: [number, number];
      connection: IConnection;
      outputIndex: number;
    }> = [];

    // Add the nodes to be executed
    // eslint-disable-next-line @typescript-eslint/no-for-in-array
    for (outputIndex in workflow.connectionsBySourceNode[executionNode.name]
      .main) {
      if (
        !Object.hasOwn(
          workflow.connectionsBySourceNode[executionNode.name].main,
          outputIndex
        )
      ) {
        continue;
      }

      // Iterate over all the different connections of this output
      for (connectionData of workflow.connectionsBySourceNode[
        executionNode.name
      ].main[outputIndex] ?? []) {
        if (!Object.hasOwn(workflow.nodes, connectionData.node)) {
          throw new ApplicationError("Destination node not found", {
            extra: {
              sourceNodeName: executionNode.name,
              destinationNodeName: connectionData.node,
            },
          });
        }

        if (
          nodeSuccessData![outputIndex] &&
          (nodeSuccessData![outputIndex].length !== 0 ||
            (connectionData.index > 0 && this.isLegacyExecutionOrder(workflow)))
        ) {
          // Add the node only if it did execute or if connected to second "optional" input
          if (workflow.settings.executionOrder === "v1") {
            const nodeToAdd = workflow.getNode(connectionData.node);
            nodesToAdd.push({
              position: nodeToAdd?.position || [0, 0],
              connection: connectionData,
              outputIndex: parseInt(outputIndex, 10),
            });
          } else {
            this.addNodeToBeExecuted(
              workflow,
              connectionData,
              parseInt(outputIndex, 10),
              executionNode.name,
              nodeSuccessData!,
              runIndex
            );
          }
        }
      }
    }

    if (workflow.settings.executionOrder === "v1") {
      // Always execute the node that is more to the top-left first
      nodesToAdd.sort((a, b) => {
        if (a.position[1] < b.position[1]) {
          return 1;
        }
        if (a.position[1] > b.position[1]) {
          return -1;
        }

        if (a.position[0] > b.position[0]) {
          return -1;
        }

        return 0;
      });

      for (const nodeData of nodesToAdd) {
        this.addNodeToBeExecuted(
          workflow,
          nodeData.connection,
          nodeData.outputIndex,
          executionNode.name,
          nodeSuccessData!,
          runIndex
        );
      }
    }
  }
}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L2103-2222)

```typescript
					let waitingNodes: string[] = Object.keys(
						this.runExecutionData.executionData!.waitingExecution,
					);

					if (
						this.runExecutionData.executionData!.nodeExecutionStack.length === 0 &&
						waitingNodes.length
					) {
						// There are no more nodes in the execution stack. Check if there are
						// waiting nodes that do not require data on all inputs and execute them,
						// one by one.

						// TODO: Should this also care about workflow position (top-left first?)
						for (let i = 0; i < waitingNodes.length; i++) {
							const nodeName = waitingNodes[i];

							const checkNode = workflow.getNode(nodeName);
							if (!checkNode) {
								continue;
							}
							const nodeType = workflow.nodeTypes.getByNameAndVersion(
								checkNode.type,
								checkNode.typeVersion,
							);

							// Check if the node is only allowed execute if all inputs received data
							let requiredInputs =
								workflow.settings.executionOrder === 'v1'
									? nodeType.description.requiredInputs
									: undefined;
							if (requiredInputs !== undefined) {
								if (typeof requiredInputs === 'string') {
									requiredInputs = workflow.expression.getSimpleParameterValue(
										checkNode,
										requiredInputs,
										this.mode,
										{ $version: checkNode.typeVersion },
										undefined,
										[],
									) as number[];
								}

								if (
									(requiredInputs !== undefined &&
										Array.isArray(requiredInputs) &&
										requiredInputs.length === nodeType.description.inputs.length) ||
									requiredInputs === nodeType.description.inputs.length
								) {
									// All inputs are required, but not all have data so do not continue
									continue;
								}
							}

							const parentNodes = workflow.getParentNodes(nodeName);

							// Check if input nodes (of same run) got already executed

							const parentIsWaiting = parentNodes.some((value) => waitingNodes.includes(value));
							if (parentIsWaiting) {
								// Execute node later as one of its dependencies is still outstanding
								continue;
							}

							const runIndexes = Object.keys(
								this.runExecutionData.executionData!.waitingExecution[nodeName],
							).sort();

							// The run-index of the earliest outstanding one
							const firstRunIndex = parseInt(runIndexes[0]);

							// Find all the inputs which received any kind of data, even if it was an empty
							// array as this shows that the parent nodes executed but they did not have any
							// data to pass on.
							const inputsWithData = this.runExecutionData
								.executionData!.waitingExecution[nodeName][firstRunIndex].main.map((data, index) =>
									data === null ? null : index,
								)
								.filter((data) => data !== null);

							if (requiredInputs !== undefined) {
								// Certain inputs are required that the node can execute

								if (Array.isArray(requiredInputs)) {
									// Specific inputs are required (array of input indexes)
									let inputDataMissing = false;
									for (const requiredInput of requiredInputs) {
										if (!inputsWithData.includes(requiredInput)) {
											inputDataMissing = true;
											break;
										}
									}
									if (inputDataMissing) {
										continue;
									}
								} else {
									// A certain amount of inputs are required (amount of inputs)
									if (inputsWithData.length < requiredInputs) {
										continue;
									}
								}
							}

							const taskDataMain = this.runExecutionData.executionData!.waitingExecution[nodeName][
								firstRunIndex
							].main.map((data) => {
								// For the inputs for which never any data got received set it to an empty array
								return data === null ? [] : data;
							});

							if (taskDataMain.filter((data) => data.length).length !== 0) {
								// Add the node to be executed

								// Make sure that each input at least receives an empty array
								if (taskDataMain.length < nodeType.description.inputs.length) {
									for (; taskDataMain.length < nodeType.description.inputs.length; ) {
										taskDataMain.push([]);
									}
								}

								this.runExecutionData.executionData!.nodeExecutionStack.push({
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L2392-2424)

```typescript
	 */
	async processSuccessExecution(
		startedAt: Date,
		workflow: Workflow,
		executionError?: ExecutionBaseError,
		closeFunction?: Promise<void>,
	): Promise<IRun> {
		const fullRunData = this.getFullRunData(startedAt);

		if (executionError !== undefined) {
			Logger.debug('Workflow execution finished with error', {
				error: executionError,
				workflowId: workflow.id,
			});
			fullRunData.data.resultData.error = {
				...executionError,
				message: executionError.message,
				stack: executionError.stack,
			} as ExecutionBaseError;
			if (executionError.message?.includes('canceled')) {
				fullRunData.status = 'canceled';
			}
		} else if (this.runExecutionData.waitTill) {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			Logger.debug(`Workflow execution will wait until ${this.runExecutionData.waitTill}`, {
				workflowId: workflow.id,
			});
			fullRunData.waitTill = this.runExecutionData.waitTill;
			fullRunData.status = 'waiting';
		} else {
			Logger.debug('Workflow execution finished successfully', { workflowId: workflow.id });
			fullRunData.finished = true;
			fullRunData.status = 'success';
```

**File:** packages/cli/src/workflows/workflow-execution.service.ts (L103-118)

```typescript
	async executeManually(
		{
			workflowData,
			runData,
			startNodes,
			destinationNode,
			dirtyNodeNames,
			triggerToStartFrom,
			agentRequest,
		}: WorkflowRequest.ManualRunPayload,
		user: User,
		pushRef?: string,
		streamingEnabled?: boolean,
		httpResponse?: Response,
	) {
		const pinData = workflowData.pinData;
```

**File:** packages/cli/src/workflow-runner.ts (L141-149)

```typescript
	async run(
		data: IWorkflowExecutionDataProcess,
		loadStaticData?: boolean,
		realtime?: boolean,
		restartExecutionId?: string,
		responsePromise?: IDeferredPromise<IExecuteResponsePromiseData>,
	): Promise<string> {
		// Register a new execution
		const executionId = await this.activeExecutions.add(data, restartExecutionId);
```

**File:** packages/cli/src/workflow-runner.ts (L174-183)

```typescript
const shouldEnqueue =
  process.env.OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS === "true"
    ? this.executionsMode === "queue"
    : this.executionsMode === "queue" && data.executionMode !== "manual";

if (shouldEnqueue) {
  await this.enqueueExecution(
    executionId,
    workflowId,
    data,
    loadStaticData,
    realtime
  );
} else {
  await this.runMainProcess(
    executionId,
    data,
    loadStaticData,
    restartExecutionId
  );
}
```

**File:** packages/cli/src/manual-execution.service.ts (L100-104)

```typescript
const workflowExecute = new WorkflowExecute(
  additionalData,
  data.executionMode,
  executionData
);
```

**File:** packages/cli/src/scaling/scaling.service.ts (L87-106)

```typescript
void this.queue.process(JOB_TYPE_NAME, concurrency, async (job: Job) => {
  try {
    this.eventService.emit("job-dequeued", {
      executionId: job.data.executionId,
      workflowId: job.data.workflowId,
      hostId: this.instanceSettings.hostId,
      jobId: job.id.toString(),
    });

    if (!this.hasValidJobData(job)) {
      throw new UnexpectedError("Worker received invalid job", {
        extra: { jobData: jsonStringify(job, { replaceCircularRefs: true }) },
      });
    }

    await this.jobProcessor.processJob(job);
  } catch (error) {
    await this.reportJobProcessingError(ensureError(error), job);
  }
});
```

## Q7

for a person who is trying to build this as a project from scratch, help me create a small scale mental diagram. Here is the whole code which i built until now

import express from "express";

const app = express();

app.use(express.json());
import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import { getNodeInputs } from "./utils";
import z from "zod";
import Mustache from "mustache";

/\*\*

- APINode - Makes HTTP requests with full configurability
-
- Features:
- - Supports all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- - Dynamic URL templating using Mustache with edge-scoped variables
- - Headers support (static from props, dynamic from inputs)
- - Body support for POST/PUT/PATCH
- - Automatic JSON serialization
- - Error handling with detailed logging
-
- Props configuration:
- - method: HTTP method (default: "GET")
- - url: URL template with Mustache syntax (e.g., "https://api.com?city={{e1.city}}")
- - headers: Static headers object
- - body: Static request body (for POST/PUT/PATCH)
-
- Input expectations:
- - url: Direct URL string (if props.url not provided)
- - headers: Additional headers to merge
- - body: Request body data
    \*/
    export class APINode extends Node {
    name = "APINode";

constructor({
id,
label,
props,
}: {
id: string;
label: string;
props?: Record<string, any>;
}) {
super({ id, label, type: "api", props });
this.description = "Makes HTTP API calls";

    // Default output schema for API responses
    this.outputSchema = z
      .object({
        status: z.number().optional(),
        data: z.any(),
      })
      .passthrough(); // Allow additional fields

}

async execute(context: ExecutionContext): Promise<void> {
console.log(`\n[APINode ${this.label}] Starting execution`);

    const inputs = getNodeInputs(context, this.id); // Now validates automatically!

    const templateModel: Record<string, any> = {};
    inputs.forEach((data, edgeId) => {
      templateModel[edgeId] = data;
    });

    const method = (this.props.method || "GET").toUpperCase();
    let url: string | undefined = this.props.url;

    if (url) {
      url = Mustache.render(url, templateModel);
    } else if (inputs.size === 1) {
      const singleInput = inputs.values().next().value;
      url = singleInput?.url;
    }

    if (!url) {
      throw new Error(`APINode [${this.label}] requires a URL`);
    }

    let headers: Record<string, string> = { ...(this.props.headers || {}) };
    inputs.forEach((data) => {
      if (data.headers) {
        headers = { ...headers, ...data.headers };
      }
    });

    let body: any = null;
    if (["POST", "PUT", "PATCH"].includes(method)) {
      body = this.props.body || null;
      if (!body) {
        for (const data of inputs.values()) {
          if (data.body) {
            body = data.body;
            break;
          }
        }
      }
      if (body && typeof body === "object") {
        if (!headers["Content-Type"]) {
          headers["Content-Type"] = "application/json";
        }
        body = JSON.stringify(body);
      }
    }

    let responseData: any;
    try {
      console.log(`[APINode ${this.label}] Calling ${method} ${url}`);
      const response = await fetch(url, {
        method,
        headers,
        body: body || undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("Content-Type") || "";
      const rawData = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      // Wrap response in standard format
      responseData = {
        status: response.status,
        data: rawData,
      };

      console.log(`[APINode ${this.label}] Response received`);
    } catch (error) {
      console.error(`[APINode ${this.label}] Error:`, error);
      throw error;
    }

    this.sendOutput(responseData, context); // Validates before sending!

}

toJSON(): Record<string, any> {
return {
id: this.id,
type: this.type,
label: this.label,
props: this.props,
};
}
}
import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import { getNodeInputs } from "./utils";

export class EndNode extends Node {
name = "EndNode";

constructor({ id, label }: { id: string; label: string }) {
super({ id, label, type: "end" });
this.description = "Marks the end of workflow execution";
}

execute(context: ExecutionContext): void {
const inputs = getNodeInputs(context, this.id);
console.log(
`[EndNode ${this.label}] Workflow completed with inputs:`,
Object.fromEntries(inputs)
);
}

toJSON(): Record<string, any> {
return {
id: this.id,
type: this.type,
label: this.label,
props: this.props,
};
}
}
import { WorkflowExecutor } from "./WorkflowExecutor";
import { WorkflowDefinition } from "./types";

const workflow: WorkflowDefinition = {
nodes: [
{
id: "start-1",
type: "start",
label: "Start",
outputSchema: {
latitude: "number",
longitude: "number",
city: "string",
},
},
{
id: "api-2",
type: "api",
label: "Fetch Weather",
props: {
method: "GET",
url: "https://api.open-meteo.com/v1/forecast?latitude={{e1.latitude}}&longitude={{e1.longitude}}&current_weather=true",
},
outputSchema: {
status: "number",
data: "any",
},
},
{
id: "end-3",
type: "end",
label: "End",
},
],
edges: [
{ id: "e1", source: "start-1", target: "api-2" },
{ id: "e2", source: "api-2", target: "end-3" },
],
};

const initialInputs = {
latitude: 52.52,
longitude: 13.41,
city: "Berlin",
};

const executor = new WorkflowExecutor();
executor.execute(workflow, initialInputs).catch(console.error);
import { Node } from "./Node";
import { Edge } from "./types";

/\*\*

- ExecutionContext - Central state container for workflow execution
-
- This class maintains all runtime state during workflow execution:
-
- 1.  variablePool: Map<edgeId, data>
- - THE CORE DATA STORAGE for inter-node communication
- - Key: Edge ID (e.g., "e1", "e2")
- - Value: Data flowing through that edge
- - Why edge-based? Allows multiple outputs per node without conflicts
- - Example: After StartNode executes:
-      variablePool.set("e1", {city: "Berlin", temp: 25})
-      variablePool.set("e2", {city: "Berlin", temp: 25})
-
- 2.  edges: Complete list of workflow edges
- - Used by nodes to find their incoming/outgoing connections
- - Used by sendOutput to write data to correct edges
-
- 3.  initialInputs: Starting data provided by workflow runner
- - Injected by StartNode into variablePool
-
- 4.  currentNodeId: ID of currently executing node
- - Used for debugging and logging
-
- 5.  activeEdges: Set of edge IDs to activate (for conditional nodes)
- - Empty for normal nodes (activate all outgoing edges)
- - Populated by IF-ELSE/SWITCH nodes to select specific branches
    \*/
    export class ExecutionContext {
    // ===== THE VARIABLE POOL - Where all data lives =====
    // This is keyed by EDGE ID, not node ID!
    // Example state after StartNode → APINode execution:
    // variablePool = Map {
    // "e1" => { city: "Berlin", latitude: 52.52 },
    // "e2" => { temperature: 25, weather: "sunny" }
    // }
    variablePool: Map<string, any>;

// All edges in the workflow
edges: Edge[];

// Initial inputs injected by StartNode
initialInputs: any;

// Currently executing node (for debugging)
currentNodeId: string;

// For conditional routing (IF-ELSE, SWITCH)
activeEdges: Set<string>;

nodes?: Map<string, Node>; // Add reference to nodes for validation

constructor(edges: Edge[], initialInputs: any, nodes: Map<string, Node>) {
this.variablePool = new Map(); // EMPTY at start, populated during execution
this.edges = edges;
this.initialInputs = initialInputs;
this.currentNodeId = "";
this.activeEdges = new Set();
this.nodes = nodes;
}

/\*\*

- Debug helper: Print current variablePool state
  \*/
  printVariablePool(): void {
  console.log("\n=== VariablePool State ===");
  this.variablePool.forEach((data, edgeId) => {
  console.log(`Edge ${edgeId}:`, data);
  });
  console.log("========================\n");
  }
  }
  import { ExecutionContext } from "./ExecutionContext";
  import { Edge } from "./types";
  import { z } from "zod";

export abstract class Node {
id: string;
label: string;
type: string;
description: string;
props: Record<string, any>;
inputSchema: Map<string, z.ZodTypeAny>;
outputSchema: z.ZodTypeAny;

constructor({
id,
label,
type,
props,
}: {
id: string;
label: string;
type: string;
props?: Record<string, any>;
}) {
this.id = id;
this.label = label;
this.type = type;
this.description = "";
this.props = props || {};
this.inputSchema = new Map();
this.outputSchema = z.any();
}

abstract execute(context: ExecutionContext): Promise<void> | void;

abstract toJSON(): Record<string, any>;

// protected sendOutput(
// output: any,
// context: ExecutionContext,
// edgeFilter?: (edge: Edge) => boolean
// ): void {
// const outgoingEdges = context.edges.filter(
// (edge) => edge.source === this.id && (!edgeFilter || edgeFilter(edge))
// );

// outgoingEdges.forEach((edge) => {
// context.variablePool.set(edge.id, output);
// console.log(`Node [${this.label}] pushed data to edge ${edge.id}`);
// });
// }

/\*\*

- Validate input data against the schema for a specific edge
- Made public so utils can call it
  \*/
  public validateInput(edgeId: string, data: any): any {
  const schema = this.inputSchema.get(edgeId);


    if (!schema) {
      // No schema defined, skip validation
      return data;
    }

    try {
      const validated = schema.parse(data);
      console.log(
        `[${this.label}] ✓ Input validation passed for edge ${edgeId}`
      );
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `[${this.label}] ✗ Input validation failed for edge ${edgeId}:`,
          error.issues
        );
        throw new Error(
          `Input validation failed for ${
            this.label
          } on edge ${edgeId}: ${JSON.stringify(error.issues)}`
        );
      }
      throw error;
    }

}

/\*\*

- Validate output data before writing to VariablePool
  \*/
  protected validateOutput(data: any): any {
  // If no specific schema, return as-is
  if (this.outputSchema === z.any() || !this.outputSchema) {
  return data;
  }


    try {
      const validated = this.outputSchema.parse(data);
      console.log(`[${this.label}] ✓ Output validation passed`);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `[${this.label}] ✗ Output validation failed:`,
          error.issues
        );
        throw new Error(
          `Output validation failed for ${this.label}: ${JSON.stringify(
            error.issues
          )}`
        );
      }
      throw error;
    }

}

protected sendOutput(
output: any,
context: ExecutionContext,
edgeFilter?: (edge: Edge) => boolean
): void {
// Validate output before sending
const validatedOutput = this.validateOutput(output);

    const outgoingEdges = context.edges.filter(
      (edge) => edge.source === this.id && (!edgeFilter || edgeFilter(edge))
    );

    outgoingEdges.forEach((edge) => {
      context.variablePool.set(edge.id, validatedOutput);
      console.log(
        `Node [${this.label}] pushed validated data to edge ${edge.id}`
      );
    });

}

/\*\*

- Set input schema for a specific edge
  \*/
  setInputSchemaForEdge(edgeId: string, schema: z.ZodTypeAny): void {
  this.inputSchema.set(edgeId, schema);
  console.log(`[${this.label}] Registered input schema for edge ${edgeId}`);
  }

/\*\*

- Set output schema
  \*/
  setOutputSchema(schema: z.ZodTypeAny): void {
  this.outputSchema = schema;
  console.log(`[${this.label}] Registered output schema`);
  }
  }
  import { Node } from "./Node";
  import { StartNode } from "./StartNode";
  import { APINode } from "./APINode";
  import { EndNode } from "./EndNode";
  import { NodeDefinition } from "./types";

export class NodeFactory {
static createNode(nodeDef: NodeDefinition): Node {
switch (nodeDef.type) {
case "start":
return new StartNode({ id: nodeDef.id, label: nodeDef.label });

      case "api":
        return new APINode({
          id: nodeDef.id,
          label: nodeDef.label,
          props: nodeDef.props,
        });

      case "end":
        return new EndNode({ id: nodeDef.id, label: nodeDef.label });

      default:
        throw new Error(`Unknown node type: ${nodeDef.type}`);
    }

}
}
import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import { z } from "zod";

export class StartNode extends Node {
name = "StartNode";

constructor({ id, label }: { id: string; label: string }) {
super({ id, label, type: "start" });
this.description = "Starts workflow execution by injecting initial inputs";

    // StartNode accepts any input, outputs whatever it receives
    this.outputSchema = z.any();

}

execute(context: ExecutionContext): void {
console.log(
`[StartNode ${this.label}] Injecting initial inputs:`,
context.initialInputs
);
this.sendOutput(context.initialInputs, context);
}

toJSON(): Record<string, any> {
return {
id: this.id,
type: this.type,
label: this.label,
props: this.props,
};
}
}
import { WorkflowExecutor } from "./WorkflowExecutor";
import { WorkflowDefinition } from "./types";

const workflow: WorkflowDefinition = {
nodes: [
{
id: "start-1",
type: "start",
label: "Start",
outputSchema: {
userId: "number", // Expects number
},
},
{
id: "api-2",
type: "api",
label: "Get User",
props: {
method: "GET",
url: "https://jsonplaceholder.typicode.com/users/{{e1.userId}}",
},
},
{ id: "end-3", type: "end", label: "End" },
],
edges: [
{ id: "e1", source: "start-1", target: "api-2" },
{ id: "e2", source: "api-2", target: "end-3" },
],
};

// INVALID: passing string instead of number
const initialInputs = {
userId: "not-a-number", // ❌ Should fail validation
};

const executor = new WorkflowExecutor();
executor.execute(workflow, initialInputs).catch((error) => {
console.error("Expected validation error:", error.message);
});
import { z } from "zod";

export interface Edge {
id: string;
source: string;
target: string;
sourceHandle?: string;
targetHandle?: string;
}

export interface NodeDefinition {
id: string;
type: string;
label: string;
props?: Record<string, any>;
// Schema definitions stored in workflow JSON
inputSchema?: Record<string, any>; // Map<edgeId, schema>
outputSchema?: Record<string, any>; // Schema for this node's output
}

export interface WorkflowDefinition {
nodes: NodeDefinition[];
edges: Edge[];
}

export type Indegree = Map<string, number>;

// Schema types
export type ZodSchemaDefinition = z.ZodTypeAny;
export type SchemaMap = Map<string, ZodSchemaDefinition>;
import { ExecutionContext } from "./ExecutionContext";
import { Node as WorkflowNode } from "./Node";
import { Edge, Indegree } from "./types";
import { z } from "zod";

/\*\*

- Get inputs for a node from the VariablePool WITHOUT direct validation
- (validation happens inside node.execute when it processes inputs)
  \*/
  export function getNodeInputs(
  context: ExecutionContext,
  nodeId: string
  ): Map<string, any> {
  const incomingEdges = context.edges.filter((edge) => edge.target === nodeId);
  const inputs = new Map<string, any>();

incomingEdges.forEach((edge) => {
const data = context.variablePool.get(edge.id);
if (data !== undefined) {
inputs.set(edge.id, data);
}
});

return inputs;
}

/\*\*

- Helper to validate input data against schema (used by nodes)
  \*/
  export function validateData(
  schema: z.ZodTypeAny,
  data: any,
  context: string
  ): any {
  try {
  const validated = schema.parse(data);
  console.log(`✓ Validation passed for ${context}`);
  return validated;
  } catch (error) {
  if (error instanceof z.ZodError) {
  console.error(`✗ Validation failed for ${context}:`, error.issues);
  throw new Error(
  `Validation failed for ${context}: ${JSON.stringify(error.issues)}`
  );
  }
  throw error;
  }
  }

/\*\*

- Parse schema definition from JSON to Zod schema
  \*/
  export function parseSchemaDefinition(schemaDef: any): z.ZodTypeAny {
  if (!schemaDef || typeof schemaDef !== "object") {
  return z.any();
  }

// Handle Zod schema objects (already parsed)
if (schemaDef.\_def) {
return schemaDef;
}

// Parse from JSON definition
const schemaObj: Record<string, z.ZodTypeAny> = {};

for (const [key, value] of Object.entries(schemaDef)) {
if (typeof value === "string") {
// Simple type definitions: "string", "number", "boolean"
switch (value) {
case "string":
schemaObj[key] = z.string();
break;
case "number":
schemaObj[key] = z.number();
break;
case "boolean":
schemaObj[key] = z.boolean();
break;
case "any":
schemaObj[key] = z.any();
break;
default:
schemaObj[key] = z.any();
}
} else if (value && typeof value === "object" && "type" in value) {
// More complex definitions: { type: "string", optional: true }
const valueObj = value as { type: string; optional?: boolean };
let fieldSchema: z.ZodTypeAny;

      switch (valueObj.type) {
        case "string":
          fieldSchema = z.string();
          break;
        case "number":
          fieldSchema = z.number();
          break;
        case "boolean":
          fieldSchema = z.boolean();
          break;
        case "array":
          fieldSchema = z.array(z.any());
          break;
        case "object":
          fieldSchema = z.object({}).passthrough();
          break;
        default:
          fieldSchema = z.any();
      }

      if (valueObj.optional) {
        fieldSchema = fieldSchema.optional();
      }

      schemaObj[key] = fieldSchema;
    }

}

return z.object(schemaObj);
}

export function buildIndegree(
nodes: Map<string, WorkflowNode>,
edges: Edge[]
): Indegree {
const indegree: Indegree = new Map();

nodes.forEach((node) => {
indegree.set(node.id, 0);
});

edges.forEach((edge) => {
const currentIndegree = indegree.get(edge.target) || 0;
indegree.set(edge.target, currentIndegree + 1);
});

return indegree;
}

export function hasCycle(
nodes: Map<string, WorkflowNode>,
edges: Edge[]
): boolean {
const indegree = buildIndegree(nodes, edges);
const queue: string[] = [];
const processed: string[] = [];

indegree.forEach((degree, nodeId) => {
if (degree === 0) {
queue.push(nodeId);
}
});

while (queue.length > 0) {
const nodeId = queue.shift()!;
processed.push(nodeId);

    const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
    outgoingEdges.forEach((edge) => {
      const targetId = edge.target;
      const newIndegree = indegree.get(targetId)! - 1;
      indegree.set(targetId, newIndegree);

      if (newIndegree === 0) {
        queue.push(targetId);
      }
    });

}

return processed.length !== nodes.size;
}
import { ExecutionContext } from "./ExecutionContext";
import { Node } from "./Node";
import { NodeFactory } from "./NodeFactory";
import { WorkflowDefinition } from "./types";
import { buildIndegree, hasCycle, parseSchemaDefinition } from "./utils";

export class WorkflowExecutor {
async execute(
workflow: WorkflowDefinition,
initialInputs: any
): Promise<void> {
console.log("=== Workflow Execution Started ===");
console.log("Initial Inputs:", initialInputs);

    // Initialize nodes
    const nodes = new Map<string, Node>();
    workflow.nodes.forEach((nodeDef) => {
      const node = NodeFactory.createNode(nodeDef);

      // Set output schema if provided in workflow definition
      if (nodeDef.outputSchema) {
        const schema = parseSchemaDefinition(nodeDef.outputSchema);
        node.setOutputSchema(schema);
      }

      nodes.set(node.id, node);
    });

    // Populate input schemas from connected source nodes
    workflow.edges.forEach((edge) => {
      const sourceNode = nodes.get(edge.source);
      const targetNode = nodes.get(edge.target);

      if (sourceNode && targetNode) {
        // Target node's input schema for this edge = source node's output schema
        targetNode.setInputSchemaForEdge(edge.id, sourceNode.outputSchema);
      }
    });

    // Check for cycles
    if (hasCycle(nodes, workflow.edges)) {
      throw new Error("Workflow contains cycles! DAG validation failed.");
    }

    const indegree = buildIndegree(nodes, workflow.edges);
    const context = new ExecutionContext(workflow.edges, initialInputs, nodes);

    const queue: string[] = [];
    indegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    if (queue.length === 0) {
      throw new Error("No starting nodes found");
    }

    // Execute workflow
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodes.get(nodeId)!;

      console.log(`\n--- Executing Node: ${node.label} (${node.type}) ---`);
      context.currentNodeId = nodeId;

      try {
        await node.execute(context);
      } catch (error) {
        console.error(`Error executing node ${node.label}:`, error);
        throw error;
      }

      const outgoingEdges = workflow.edges.filter(
        (edge) => edge.source === nodeId
      );

      if (context.activeEdges.size > 0) {
        context.activeEdges.forEach((edgeId) => {
          const edge = outgoingEdges.find((e) => e.id === edgeId);
          if (edge) {
            const targetId = edge.target;
            const newIndegree = indegree.get(targetId)! - 1;
            indegree.set(targetId, newIndegree);
            if (newIndegree === 0) {
              queue.push(targetId);
            }
          }
        });
        context.activeEdges.clear();
      } else {
        outgoingEdges.forEach((edge) => {
          const targetId = edge.target;
          const newIndegree = indegree.get(targetId)! - 1;
          indegree.set(targetId, newIndegree);
          if (newIndegree === 0) {
            queue.push(targetId);
          }
        });
      }
    }

    console.log("\n=== Workflow Execution Completed ===");
    context.printVariablePool();

}
}

### Answer

I'll help you create a mental model for building a workflow execution engine from scratch. Based on your code, you've built a **simplified version of n8n's execution system** using a **queue-based topological sort approach** instead of n8n's stack-based execution.

# Mental Model: Your Workflow Execution System

## Core Architecture Comparison

**Your System vs n8n:**

```
YOUR SYSTEM (Queue-based):
┌─────────────────────────────────────────┐
│ WorkflowExecutor                        │
│ ├─ Topological Sort (Kahn's Algorithm) │
│ ├─ Queue: [node1, node2, node3...]     │
│ └─ ExecutionContext (VariablePool)     │
└─────────────────────────────────────────┘

N8N SYSTEM (Stack-based):
┌─────────────────────────────────────────┐
│ WorkflowExecute                         │
│ ├─ Dynamic Stack (LIFO with shift)     │
│ ├─ Stack: [node1, node2, node3...]     │
│ └─ IRunExecutionData (contextData)     │
└─────────────────────────────────────────┘
```

## Your System's Execution Flow

Here's what happens when you call `executor.execute(workflow, initialInputs)`:

### 1. **Initialization Phase** (WorkflowExecutor.ts)

```typescript
// Step 1: Create Node Instances
const nodes = new Map<string, Node>();
workflow.nodes.forEach((nodeDef) => {
  const node = NodeFactory.createNode(nodeDef);
  nodes.set(node.id, node);
});
```

**What's happening:** You're converting JSON node definitions into actual Node class instances (StartNode, APINode, EndNode)<cite />.

### 2. **Schema Setup Phase**

```typescript
// Step 2: Wire up input/output schemas
workflow.edges.forEach((edge) => {
  const sourceNode = nodes.get(edge.source);
  const targetNode = nodes.get(edge.target);

  if (sourceNode && targetNode) {
    targetNode.setInputSchemaForEdge(edge.id, sourceNode.outputSchema);
  }
});
```

**What's happening:** Each node learns what data format to expect from its upstream nodes. This is your **type safety layer**<cite />.

### 3. **Cycle Detection**

```typescript
// Step 3: Validate DAG structure
if (hasCycle(nodes, workflow.edges)) {
  throw new Error("Workflow contains cycles!");
}
```

**What's happening:** You're ensuring the workflow is a **Directed Acyclic Graph (DAG)** - no infinite loops<cite />.

### 4. **Execution Context Creation**

```typescript
// Step 4: Create shared state container
const context = new ExecutionContext(workflow.edges, initialInputs, nodes);
```

**What's happening:** This creates the **VariablePool** - a `Map<edgeId, data>` that stores all data flowing between nodes<cite />.

**Key Insight:** Your system uses **edge-based storage** (data stored by edge ID), while n8n uses **node-based storage** (data stored by node name in `runData`) n8n:1936-1963 .

### 5. **Topological Sort Execution**

```typescript
// Step 5: Build execution queue using Kahn's algorithm
const indegree = buildIndegree(nodes, workflow.edges);
const queue: string[] = [];

indegree.forEach((degree, nodeId) => {
  if (degree === 0) {
    queue.push(nodeId); // Start nodes have indegree 0
  }
});

// Step 6: Execute nodes in topological order
while (queue.length > 0) {
  const nodeId = queue.shift()!;
  const node = nodes.get(nodeId)!;

  await node.execute(context); // Execute node

  // Step 7: Update indegrees and add ready nodes to queue
  outgoingEdges.forEach((edge) => {
    const targetId = edge.target;
    const newIndegree = indegree.get(targetId)! - 1;
    indegree.set(targetId, newIndegree);

    if (newIndegree === 0) {
      queue.push(targetId); // Node is ready when all inputs received
    }
  });
}
```

**What's happening:**

1. **Queue starts with nodes that have no dependencies** (indegree = 0)
2. **Each node executes when all its inputs are ready**
3. **After execution, downstream nodes' indegrees decrease**
4. **When a node's indegree reaches 0, it's added to the queue**

This is **Kahn's Algorithm** for topological sorting<cite />.

## How Data Flows Through Your System

### Example: Start → API → End

```
Initial State:
┌─────────────────────────────────────┐
│ VariablePool: {}                    │
│ Queue: ["start-1"]                  │
│ Indegree: {start-1: 0, api-2: 1,   │
│            end-3: 1}                │
└─────────────────────────────────────┘

Step 1: Execute StartNode
┌─────────────────────────────────────┐
│ StartNode.execute(context)          │
│ ├─ Reads: context.initialInputs    │
│ └─ Writes: variablePool.set("e1",  │
│            {lat: 52.52, ...})       │
└─────────────────────────────────────┘

After Step 1:
┌─────────────────────────────────────┐
│ VariablePool: {e1: {lat: 52.52}}   │
│ Queue: ["api-2"]                    │
│ Indegree: {api-2: 0, end-3: 1}     │
└─────────────────────────────────────┘

Step 2: Execute APINode
┌─────────────────────────────────────┐
│ APINode.execute(context)            │
│ ├─ Reads: getNodeInputs(context)   │
│ │   └─ Returns: Map{e1: {lat:...}} │
│ ├─ Makes HTTP request              │
│ └─ Writes: variablePool.set("e2",  │
│            {status: 200, data:...}) │
└─────────────────────────────────────┘

After Step 2:
┌─────────────────────────────────────┐
│ VariablePool: {e1: {...},          │
│                e2: {status: 200}}   │
│ Queue: ["end-3"]                    │
│ Indegree: {end-3: 0}                │
└─────────────────────────────────────┘

Step 3: Execute EndNode
┌─────────────────────────────────────┐
│ EndNode.execute(context)            │
│ ├─ Reads: getNodeInputs(context)   │
│ │   └─ Returns: Map{e2: {...}}     │
│ └─ Logs completion                  │
└─────────────────────────────────────┘

Final State:
┌─────────────────────────────────────┐
│ VariablePool: {e1: {...}, e2: {...}}│
│ Queue: []                           │
│ Execution Complete ✓                │
└─────────────────────────────────────┘
```

## Key Differences from n8n

### 1. **Execution Strategy**

**Your System:**

- **Pre-computed execution order** via topological sort
- **Queue-based** (FIFO)
- **All nodes scheduled upfront**

**n8n:**

- **Dynamic execution order** via stack n8n:1528-1548
- **Stack-based** (LIFO with shift - actually queue-like)
- **Nodes scheduled as parents complete** n8n:1998-2090

### 2. **Data Storage**

**Your System:**

- `variablePool: Map<edgeId, data>` - data keyed by edge
- Simple, flat structure

**n8n:**

- `runData: { [nodeName]: ITaskData[] }` - data keyed by node name n8n:1936-1963
- Supports multiple executions per node (array of ITaskData)
- Tracks execution metadata (startTime, executionIndex, etc.)

### 3. **Multi-Input Handling**

**Your System:**

- Handled automatically by topological sort
- Node executes when indegree reaches 0

**n8n:**

- Uses `waitingExecution` map n8n:2103-2163
- Nodes wait until all inputs have data
- More complex but supports partial execution

## Visual Mental Model

```
┌─────────────────────────────────────────────────────────┐
│                  YOUR WORKFLOW ENGINE                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. WORKFLOW DEFINITION (JSON)                          │
│     ┌──────────────────────────────────────┐            │
│     │ nodes: [{id, type, props}]           │            │
│     │ edges: [{id, source, target}]        │            │
│     └──────────────────────────────────────┘            │
│                      ↓                                   │
│  2. NODE FACTORY                                         │
│     ┌──────────────────────────────────────┐            │
│     │ Creates: StartNode, APINode, EndNode │            │
│     │ Each has: execute(), sendOutput()    │            │
│     └──────────────────────────────────────┘            │
│                      ↓                                   │
│  3. EXECUTION CONTEXT                                    │
│     ┌──────────────────────────────────────┐            │
│     │ variablePool: Map<edgeId, data>      │            │
│     │ edges: Edge[]                        │            │
│     │ initialInputs: any                   │            │
│     └──────────────────────────────────────┘            │
│                      ↓                                   │
│  4. TOPOLOGICAL SORT                                     │
│     ┌──────────────────────────────────────┐            │
│     │ indegree: Map<nodeId, count>         │            │
│     │ queue: [nodes with indegree 0]       │            │
│     └──────────────────────────────────────┘            │
│                      ↓                                   │
│  5. EXECUTION LOOP                                       │
│     ┌──────────────────────────────────────┐            │
│     │ while (queue.length > 0) {           │            │
│     │   node = queue.shift()               │            │
│     │   await node.execute(context)        │            │
│     │   updateIndegrees()                  │            │
│     │   addReadyNodesToQueue()             │            │
│     │ }                                    │            │
│     └──────────────────────────────────────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Strengths of Your Approach

1. **Simpler to understand** - topological sort is a well-known algorithm
2. **Predictable execution order** - computed upfront
3. **Clean separation** - VariablePool is separate from execution logic
4. **Type safety** - Zod schemas validate data at runtime

## Limitations vs n8n

1. **No partial execution** - can't resume from middle of workflow
2. **No retry logic** - n8n has built-in retry with exponential backoff n8n:1649-1677
3. **No error handling modes** - n8n supports continueOnFail, error outputs n8n:1865-1913
4. **No execution history** - n8n stores full execution metadata
5. **Single execution only** - n8n supports concurrent executions with isolation

## Next Steps to Match n8n

If you want to evolve your system toward n8n's capabilities:

1. **Add execution metadata storage** - track startTime, executionIndex per node
2. **Implement retry logic** - wrap node execution in try/catch with retry loop
3. **Add error handling modes** - support continueOnFail, error outputs
4. **Support partial execution** - allow resuming from specific nodes
5. **Add execution hooks** - nodeExecuteBefore, nodeExecuteAfter for monitoring

Your current implementation is a **solid foundation** for understanding workflow execution engines. The topological sort approach is actually **cleaner for learning** than n8n's dynamic stack approach, even though n8n's approach is more flexible for production use cases.

Wiki pages you might want to explore:

- [Architecture Overview (n8n-io/n8n)](/wiki/n8n-io/n8n#1.2)

### Citations

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1528-1548)

```typescript
				executionLoop: while (
					this.runExecutionData.executionData!.nodeExecutionStack.length !== 0
				) {
					if (
						this.additionalData.executionTimeoutTimestamp !== undefined &&
						Date.now() >= this.additionalData.executionTimeoutTimestamp
					) {
						this.status = 'canceled';
						this.timedOut = true;
					}

					if (this.status === 'canceled') {
						return;
					}

					subNodeExecutionResults = makeEngineResponse();

					let nodeSuccessData: INodeExecutionData[][] | null | undefined = null;
					executionError = undefined;
					executionData =
						this.runExecutionData.executionData!.nodeExecutionStack.shift() as IExecuteData;
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1649-1677)

```typescript
					let maxTries = 1;
					if (executionData.node.retryOnFail === true) {
						// TODO: Remove the hardcoded default-values here and also in NodeSettings.vue
						maxTries = Math.min(5, Math.max(2, executionData.node.maxTries || 3));
					}

					let waitBetweenTries = 0;
					if (executionData.node.retryOnFail === true) {
						// TODO: Remove the hardcoded default-values here and also in NodeSettings.vue
						waitBetweenTries = Math.min(
							5000,
							Math.max(0, executionData.node.waitBetweenTries || 1000),
						);
					}

					for (let tryIndex = 0; tryIndex < maxTries; tryIndex++) {
						try {
							if (tryIndex !== 0) {
								// Reset executionError from previous error try
								executionError = undefined;
								if (waitBetweenTries !== 0) {
									// TODO: Improve that in the future and check if other nodes can
									//       be executed in the meantime

									await new Promise((resolve) => {
										setTimeout(() => {
											resolve(undefined);
										}, waitBetweenTries);
									});
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1865-1913)

```typescript

					if (executionError !== undefined) {
						taskData.error = executionError;
						taskData.executionStatus = 'error';

						// Send error to the response if necessary
						await hooks?.runHook('sendChunk', [
							{
								type: 'error',
								content: executionError.description,
								metadata: {
									nodeId: executionNode.id,
									nodeName: executionNode.name,
									runIndex,
									itemIndex: 0,
								},
							},
						]);

						if (
							executionData.node.continueOnFail === true ||
							['continueRegularOutput', 'continueErrorOutput'].includes(
								executionData.node.onError || '',
							)
						) {
							// Workflow should continue running even if node errors
							if (Object.hasOwn(executionData.data, 'main') && executionData.data.main.length > 0) {
								// Simply get the input data of the node if it has any and pass it through
								// to the next node
								if (executionData.data.main[0] !== null) {
									nodeSuccessData = [executionData.data.main[0]];
								}
							}
						} else {
							// Node execution did fail so add error and stop execution
							this.runExecutionData.resultData.runData[executionNode.name].push(taskData);

							// Add the execution data again so that it can get restarted
							this.runExecutionData.executionData!.nodeExecutionStack.unshift(executionData);
							// Only execute the nodeExecuteAfter hook if the node did not get aborted
							if (!this.isCancelled) {
								await hooks.runHook('nodeExecuteAfter', [
									executionNode.name,
									taskData,
									this.runExecutionData,
								]);
							}

							break;
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1936-1963)

```typescript

					// Node executed successfully. So add data and go on.
					taskData.data = {
						main: nodeSuccessData,
					} as ITaskDataConnections;

					// Rewire output data log to the given connectionType
					if (executionNode.rewireOutputLogTo) {
						// TODO: Remove when AI-723 lands.
						taskData.inputOverride =
							this.runExecutionData.resultData.runData[executionNode.name][runIndex]
								?.inputOverride || {};
						taskData.data = {
							[executionNode.rewireOutputLogTo]: nodeSuccessData,
						} as ITaskDataConnections;
					}

					const runDataAlreadyExists =
						!!this.runExecutionData.resultData.runData[executionNode.name][runIndex];
					if (runDataAlreadyExists) {
						// TODO: Remove when AI-723 lands. There is no need to merge
						// anymore, because the only reason to have this entry already is
						// because of `inputOverride`.
						const currentTaskData =
							this.runExecutionData.resultData.runData[executionNode.name][runIndex];
						Object.assign(currentTaskData, taskData);
					} else {
						this.runExecutionData.resultData.runData[executionNode.name].push(taskData);
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1998-2090)

```typescript
					if (Object.hasOwn(workflow.connectionsBySourceNode, executionNode.name)) {
						if (Object.hasOwn(workflow.connectionsBySourceNode[executionNode.name], 'main')) {
							let outputIndex: string;
							let connectionData: IConnection;
							// Iterate over all the outputs

							const nodesToAdd: Array<{
								position: [number, number];
								connection: IConnection;
								outputIndex: number;
							}> = [];

							// Add the nodes to be executed
							// eslint-disable-next-line @typescript-eslint/no-for-in-array
							for (outputIndex in workflow.connectionsBySourceNode[executionNode.name].main) {
								if (
									!Object.hasOwn(
										workflow.connectionsBySourceNode[executionNode.name].main,
										outputIndex,
									)
								) {
									continue;
								}

								// Iterate over all the different connections of this output
								for (connectionData of workflow.connectionsBySourceNode[executionNode.name].main[
									outputIndex
								] ?? []) {
									if (!Object.hasOwn(workflow.nodes, connectionData.node)) {
										throw new ApplicationError('Destination node not found', {
											extra: {
												sourceNodeName: executionNode.name,
												destinationNodeName: connectionData.node,
											},
										});
									}

									if (
										nodeSuccessData![outputIndex] &&
										(nodeSuccessData![outputIndex].length !== 0 ||
											(connectionData.index > 0 && this.isLegacyExecutionOrder(workflow)))
									) {
										// Add the node only if it did execute or if connected to second "optional" input
										if (workflow.settings.executionOrder === 'v1') {
											const nodeToAdd = workflow.getNode(connectionData.node);
											nodesToAdd.push({
												position: nodeToAdd?.position || [0, 0],
												connection: connectionData,
												outputIndex: parseInt(outputIndex, 10),
											});
										} else {
											this.addNodeToBeExecuted(
												workflow,
												connectionData,
												parseInt(outputIndex, 10),
												executionNode.name,
												nodeSuccessData!,
												runIndex,
											);
										}
									}
								}
							}

							if (workflow.settings.executionOrder === 'v1') {
								// Always execute the node that is more to the top-left first
								nodesToAdd.sort((a, b) => {
									if (a.position[1] < b.position[1]) {
										return 1;
									}
									if (a.position[1] > b.position[1]) {
										return -1;
									}

									if (a.position[0] > b.position[0]) {
										return -1;
									}

									return 0;
								});

								for (const nodeData of nodesToAdd) {
									this.addNodeToBeExecuted(
										workflow,
										nodeData.connection,
										nodeData.outputIndex,
										executionNode.name,
										nodeSuccessData!,
										runIndex,
									);
								}
							}
						}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L2103-2163)

```typescript
					let waitingNodes: string[] = Object.keys(
						this.runExecutionData.executionData!.waitingExecution,
					);

					if (
						this.runExecutionData.executionData!.nodeExecutionStack.length === 0 &&
						waitingNodes.length
					) {
						// There are no more nodes in the execution stack. Check if there are
						// waiting nodes that do not require data on all inputs and execute them,
						// one by one.

						// TODO: Should this also care about workflow position (top-left first?)
						for (let i = 0; i < waitingNodes.length; i++) {
							const nodeName = waitingNodes[i];

							const checkNode = workflow.getNode(nodeName);
							if (!checkNode) {
								continue;
							}
							const nodeType = workflow.nodeTypes.getByNameAndVersion(
								checkNode.type,
								checkNode.typeVersion,
							);

							// Check if the node is only allowed execute if all inputs received data
							let requiredInputs =
								workflow.settings.executionOrder === 'v1'
									? nodeType.description.requiredInputs
									: undefined;
							if (requiredInputs !== undefined) {
								if (typeof requiredInputs === 'string') {
									requiredInputs = workflow.expression.getSimpleParameterValue(
										checkNode,
										requiredInputs,
										this.mode,
										{ $version: checkNode.typeVersion },
										undefined,
										[],
									) as number[];
								}

								if (
									(requiredInputs !== undefined &&
										Array.isArray(requiredInputs) &&
										requiredInputs.length === nodeType.description.inputs.length) ||
									requiredInputs === nodeType.description.inputs.length
								) {
									// All inputs are required, but not all have data so do not continue
									continue;
								}
							}

							const parentNodes = workflow.getParentNodes(nodeName);

							// Check if input nodes (of same run) got already executed

							const parentIsWaiting = parentNodes.some((value) => waitingNodes.includes(value));
							if (parentIsWaiting) {
								// Execute node later as one of its dependencies is still outstanding
								continue;
```

## Q8

Your current implementation is a solid foundation for understanding workflow execution engines. The topological sort approach is actually cleaner for learning than n8n's dynamic stack approach, even though n8n's approach is more flexible for production use cases.

here the problem is i am unable to figure out how to execute multiple nodes in parallel within one workflow as the indegree is shared

### Answer

You're asking about **parallel node execution** in your topological sort-based workflow engine. The issue is that your current implementation uses a **shared indegree map** that gets updated sequentially, preventing true parallel execution of nodes that are ready at the same time.

## The Problem

In your `WorkflowExecutor.execute()` method, you have: n8n:82-105

Your code processes nodes one at a time in a `while (queue.length > 0)` loop with `queue.shift()`, which is inherently sequential. Even if multiple nodes have `indegree === 0` (meaning they're ready to execute), they execute one after another.

## How n8n Handles Parallel Execution

n8n doesn't actually execute nodes in parallel within a single workflow execution by default. The `WorkflowExecute` class processes nodes sequentially from the stack: n8n:1954-2090

However, n8n **does support parallel execution** in specific scenarios:

### 1. Parallel Tool Execution (AI Workflows) n8n:1-33

This shows n8n executing multiple tools in parallel using `Promise.all()` or similar patterns.

### 2. Parallel Message Processing (MQTT Trigger) n8n:82-89

The `parallelProcessing` option allows processing multiple incoming messages concurrently.

## Solution for Your System

To add parallel execution to your topological sort approach, you need to:

### 1. **Batch Ready Nodes**

Instead of processing one node at a time, collect all nodes with `indegree === 0` and execute them in parallel:

```typescript
// Execute workflow with parallel batches
while (queue.length > 0) {
  // Collect all nodes ready to execute in this batch
  const batch: string[] = [];
  while (queue.length > 0) {
    batch.push(queue.shift()!);
  }

  // Execute batch in parallel
  await Promise.all(
    batch.map(async (nodeId) => {
      const node = nodes.get(nodeId)!;
      console.log(`\n--- Executing Node: ${node.label} (${node.type}) ---`);
      context.currentNodeId = nodeId;

      try {
        await node.execute(context);
      } catch (error) {
        console.error(`Error executing node ${node.label}:`, error);
        throw error;
      }

      // Update indegrees for downstream nodes
      const outgoingEdges = workflow.edges.filter(
        (edge) => edge.source === nodeId
      );

      outgoingEdges.forEach((edge) => {
        const targetId = edge.target;
        const newIndegree = indegree.get(targetId)! - 1;
        indegree.set(targetId, newIndegree);

        if (newIndegree === 0) {
          queue.push(targetId);
        }
      });
    })
  );
}
```

### 2. **Handle Race Conditions**

The shared `indegree` map needs synchronization. Use atomic operations or locks:

```typescript
// Use a mutex or atomic counter
const indegreeLock = new Map<string, Promise<void>>();

async function decrementIndegree(nodeId: string) {
  // Wait for any pending updates
  await indegreeLock.get(nodeId);

  const updatePromise = (async () => {
    const current = indegree.get(nodeId)!;
    indegree.set(nodeId, current - 1);
  })();

  indegreeLock.set(nodeId, updatePromise);
  await updatePromise;

  return indegree.get(nodeId)!;
}
```

### 3. **Thread-Safe Variable Pool**

Your `ExecutionContext.variablePool` also needs protection:

```typescript
export class ExecutionContext {
  private poolLock = new Map<string, Promise<void>>();

  async setVariable(edgeId: string, data: any) {
    await this.poolLock.get(edgeId);

    const setPromise = (async () => {
      this.variablePool.set(edgeId, data);
    })();

    this.poolLock.set(edgeId, setPromise);
    await setPromise;
  }
}
```

## Key Differences from n8n

Your topological sort approach is actually **better suited for parallel execution** than n8n's stack-based approach because:

1. **Clear dependency tracking**: Indegree explicitly shows when nodes are ready
2. **Batch processing**: You can easily identify all ready nodes at once
3. **No waiting mechanism needed**: Unlike n8n's `waitingExecution` map n8n:407-453 , your indegree naturally handles multi-input nodes

## Notes

- n8n's sequential execution is intentional for most workflows to maintain predictable execution order and simplify debugging
- Parallel execution adds complexity around error handling, cancellation, and resource management
- Consider adding a `parallelExecution: boolean` flag to your workflow definition to make it opt-in
- For production use, you'd need proper concurrency primitives (mutexes, semaphores) instead of Promise-based locks

Your topological sort foundation is actually **ideal for parallel execution** - you just need to batch nodes by execution level and add proper synchronization.

Wiki pages you might want to explore:

- [Architecture Overview (n8n-io/n8n)](/wiki/n8n-io/n8n#1.2)

### Citations

**File:** packages/core/src/execution-engine/workflow-execute.ts (L82-105)

```typescript
export class WorkflowExecute {
	private status: ExecutionStatus = 'new';

	private readonly abortController = new AbortController();
	timedOut: boolean = false;

	constructor(
		private readonly additionalData: IWorkflowExecuteAdditionalData,
		private readonly mode: WorkflowExecuteMode,
		private runExecutionData: IRunExecutionData = {
			startData: {},
			resultData: {
				runData: {},
				pinData: {},
			},
			executionData: {
				contextData: {},
				nodeExecutionStack: [],
				metadata: {},
				waitingExecution: {},
				waitingExecutionSource: {},
			},
		},
	) {}
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L407-453)

```typescript
	/**
	 * Prepares the waiting execution data structure for a node that needs to wait for data before it can execute.
	 * This function initializes arrays to store data and metadata for each connection of the node.
	 *
	 * @param nodeName - The name of the node to prepare waiting execution for
	 * @param numberOfConnections - Number of input connections the node has
	 * @param runIndex - The index of the current run (for nodes that may run multiple times)
	 */
	prepareWaitingToExecution(nodeName: string, numberOfConnections: number, runIndex: number) {
		const executionData = this.runExecutionData.executionData!;

		executionData.waitingExecution ??= {};
		executionData.waitingExecutionSource ??= {};

		const nodeWaiting = (executionData.waitingExecution[nodeName] ??= []);
		const nodeWaitingSource = (executionData.waitingExecutionSource[nodeName] ??= []);

		nodeWaiting[runIndex] = { main: [] };
		nodeWaitingSource[runIndex] = { main: [] };

		for (let i = 0; i < numberOfConnections; i++) {
			nodeWaiting[runIndex].main.push(null);
			nodeWaitingSource[runIndex].main.push(null);
		}
	}

	// eslint-disable-next-line complexity
	addNodeToBeExecuted(
		workflow: Workflow,
		connectionData: IConnection,
		outputIndex: number,
		parentNodeName: string,
		nodeSuccessData: INodeExecutionData[][],
		runIndex: number,
		newRunIndex?: number,
		metadata?: ITaskMetadata,
	): void {
		let stillDataMissing = false;
		const enqueueFn = workflow.settings.executionOrder === 'v1' ? 'unshift' : 'push';
		let waitingNodeIndex: number | undefined;

		// Check if node has multiple inputs as then we have to wait for all input data
		// to be present before we can add it to the node-execution-stack
		const numberOfInputs =
			workflow.connectionsByDestinationNode[connectionData.node]?.main?.length ?? 0;
		if (numberOfInputs > 1) {
			// Node has multiple inputs
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L1954-2090)

```typescript
						!!this.runExecutionData.resultData.runData[executionNode.name][runIndex];
					if (runDataAlreadyExists) {
						// TODO: Remove when AI-723 lands. There is no need to merge
						// anymore, because the only reason to have this entry already is
						// because of `inputOverride`.
						const currentTaskData =
							this.runExecutionData.resultData.runData[executionNode.name][runIndex];
						Object.assign(currentTaskData, taskData);
					} else {
						this.runExecutionData.resultData.runData[executionNode.name].push(taskData);
					}

					if (this.runExecutionData.waitTill) {
						await hooks.runHook('nodeExecuteAfter', [
							executionNode.name,
							taskData,
							this.runExecutionData,
						]);

						// Add the node back to the stack that the workflow can start to execute again from that node
						this.runExecutionData.executionData!.nodeExecutionStack.unshift(executionData);

						break;
					}

					if (
						this.runExecutionData.startData &&
						this.runExecutionData.startData.destinationNode &&
						this.runExecutionData.startData.destinationNode === executionNode.name
					) {
						// Before stopping, make sure we are executing hooks so
						// That frontend is notified for example for manual executions.
						await hooks.runHook('nodeExecuteAfter', [
							executionNode.name,
							taskData,
							this.runExecutionData,
						]);

						// If destination node is defined and got executed stop execution
						continue;
					}

					// Add the nodes to which the current node has an output connection to that they can
					// be executed next
					if (Object.hasOwn(workflow.connectionsBySourceNode, executionNode.name)) {
						if (Object.hasOwn(workflow.connectionsBySourceNode[executionNode.name], 'main')) {
							let outputIndex: string;
							let connectionData: IConnection;
							// Iterate over all the outputs

							const nodesToAdd: Array<{
								position: [number, number];
								connection: IConnection;
								outputIndex: number;
							}> = [];

							// Add the nodes to be executed
							// eslint-disable-next-line @typescript-eslint/no-for-in-array
							for (outputIndex in workflow.connectionsBySourceNode[executionNode.name].main) {
								if (
									!Object.hasOwn(
										workflow.connectionsBySourceNode[executionNode.name].main,
										outputIndex,
									)
								) {
									continue;
								}

								// Iterate over all the different connections of this output
								for (connectionData of workflow.connectionsBySourceNode[executionNode.name].main[
									outputIndex
								] ?? []) {
									if (!Object.hasOwn(workflow.nodes, connectionData.node)) {
										throw new ApplicationError('Destination node not found', {
											extra: {
												sourceNodeName: executionNode.name,
												destinationNodeName: connectionData.node,
											},
										});
									}

									if (
										nodeSuccessData![outputIndex] &&
										(nodeSuccessData![outputIndex].length !== 0 ||
											(connectionData.index > 0 && this.isLegacyExecutionOrder(workflow)))
									) {
										// Add the node only if it did execute or if connected to second "optional" input
										if (workflow.settings.executionOrder === 'v1') {
											const nodeToAdd = workflow.getNode(connectionData.node);
											nodesToAdd.push({
												position: nodeToAdd?.position || [0, 0],
												connection: connectionData,
												outputIndex: parseInt(outputIndex, 10),
											});
										} else {
											this.addNodeToBeExecuted(
												workflow,
												connectionData,
												parseInt(outputIndex, 10),
												executionNode.name,
												nodeSuccessData!,
												runIndex,
											);
										}
									}
								}
							}

							if (workflow.settings.executionOrder === 'v1') {
								// Always execute the node that is more to the top-left first
								nodesToAdd.sort((a, b) => {
									if (a.position[1] < b.position[1]) {
										return 1;
									}
									if (a.position[1] > b.position[1]) {
										return -1;
									}

									if (a.position[0] > b.position[0]) {
										return -1;
									}

									return 0;
								});

								for (const nodeData of nodesToAdd) {
									this.addNodeToBeExecuted(
										workflow,
										nodeData.connection,
										nodeData.outputIndex,
										executionNode.name,
										nodeSuccessData!,
										runIndex,
									);
								}
							}
						}
```

**File:** packages/@n8n/ai-workflow-builder.ee/src/utils/tool-executor.ts (L1-33)

```typescript
import type { BaseMessage } from '@langchain/core/messages';
import { isAIMessage, ToolMessage } from '@langchain/core/messages';
import { ToolInputParsingException } from '@langchain/core/tools';
import { isCommand } from '@langchain/langgraph';

import { ToolExecutionError, WorkflowStateError } from '../errors';
import type { ToolExecutorOptions } from '../types/config';
import type { WorkflowOperation } from '../types/workflow';
import type { WorkflowState } from '../workflow-state';

/**
 * PARALLEL TOOL EXECUTION
 *
 * This executor handles running multiple tools in parallel and collecting their results.
 * All workflow modifications are done through operations that are processed by the
 * operations processor node.
 *
 * This executor:
 * 1. Executes all tools in parallel
 * 2. Collects their operations and messages
 * 3. Returns a single update with all operations to be processed
 */

/**
 * Execute multiple tools in parallel and collect their state updates
 *
 * Tools return operations that will be processed by the operations processor node.
 * This function executes tools and collects all their operations and messages.
 *
 * @param options - Contains the current state and tool map
 * @returns Combined state updates from all tool executions
 */
export async function executeToolsInParallel(
```

**File:** packages/nodes-base/nodes/MQTT/MqttTrigger.node.ts (L82-89)

```typescript
					{
						displayName: 'Parallel Processing',
						name: 'parallelProcessing',
						type: 'boolean',
						default: true,
						description:
							'Whether to process messages in parallel or by keeping the message in order',
					},
```

## Q9

I would like to also use database how could you thing i can use it and what are the schemas that i need to have as a rough estimate

### Answer

# Database Integration for Your Workflow Engine

Based on your workflow execution engine code, you're asking how to add database persistence to store workflow definitions, execution history, and runtime state. Let me show you what schemas you'd need based on how n8n implements this.

## Core Database Tables You Need

### 1. **Workflow Storage** (`workflow_entity`)

This stores your workflow definitions (nodes, edges, settings): n8n:25-25

**Schema structure:**

```typescript
{
  id: string (UUID primary key)
  name: string
  active: boolean
  nodes: JSON // Your workflow.nodes array
  connections: JSON // Your workflow.edges array
  settings: JSON // Workflow-level config
  staticData: JSON // Persistent data between executions
  createdAt: timestamp
  updatedAt: timestamp
}
```

This maps directly to your `WorkflowDefinition` type - you'd serialize `nodes` and `edges` as JSON columns.

### 2. **Execution Tracking** (`execution_entity`)

This tracks each workflow run: n8n:355-384

**Schema structure:**

```typescript
{
  id: string (UUID primary key)
  workflowId: string (foreign key to workflow_entity)
  status: 'new' | 'running' | 'success' | 'error' | 'waiting' | 'canceled'
  mode: 'manual' | 'trigger' | 'webhook'
  startedAt: timestamp
  stoppedAt: timestamp
  finished: boolean
  createdAt: timestamp
}
```

This would track each time you call `executor.execute()`.

### 3. **Execution Data** (`execution_data`)

This stores the actual execution results and state: n8n:42-54

**Schema structure:**

```typescript
{
  executionId: string (foreign key to execution_entity)
  workflowData: JSON // Snapshot of workflow at execution time
  data: TEXT // Serialized IRunExecutionData containing:
    {
      startData: {},
      resultData: {
        runData: {} // Your variablePool equivalent
      },
      executionData: {
        contextData: {},
        nodeExecutionStack: [],
        waitingExecution: {}
      }
    }
}
```

This is where you'd store your `ExecutionContext.variablePool` and execution results.

## How to Integrate with Your Code

### 1. **Save Workflow Definitions**

When creating a workflow, insert into `workflow_entity`:

```typescript
// In your WorkflowExecutor or a new WorkflowRepository class
async saveWorkflow(workflow: WorkflowDefinition): Promise<string> {
  const workflowId = uuid();

  await db.insert('workflow_entity', {
    id: workflowId,
    name: workflow.name || 'Untitled',
    active: false,
    nodes: JSON.stringify(workflow.nodes),
    connections: JSON.stringify(workflow.edges),
    settings: JSON.stringify({}),
    staticData: JSON.stringify({}),
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return workflowId;
}
```

### 2. **Track Execution Start**

Before calling `executor.execute()`, create an execution record: n8n:355-384

```typescript
async startExecution(workflowId: string): Promise<string> {
  const executionId = uuid();

  // Insert execution record
  await db.insert('execution_entity', {
    id: executionId,
    workflowId: workflowId,
    status: 'running',
    mode: 'manual',
    finished: false,
    startedAt: new Date(),
    createdAt: new Date()
  });

  // Insert empty execution data
  await db.insert('execution_data', {
    executionId: executionId,
    workflowData: JSON.stringify(workflow),
    data: JSON.stringify({
      startData: {},
      resultData: { runData: {} },
      executionData: {
        contextData: {},
        nodeExecutionStack: [],
        waitingExecution: {}
      }
    })
  });

  return executionId;
}
```

### 3. **Save Execution Progress**

After each node executes, update the execution data: n8n:7-84

In your `Node.sendOutput()` method, add:

```typescript
protected async sendOutput(
  output: any,
  context: ExecutionContext,
  edgeFilter?: (edge: Edge) => boolean
): Promise<void> {
  const validatedOutput = this.validateOutput(output);

  const outgoingEdges = context.edges.filter(
    (edge) => edge.source === this.id && (!edgeFilter || edgeFilter(edge))
  );

  outgoingEdges.forEach((edge) => {
    context.variablePool.set(edge.id, validatedOutput);
  });

  // NEW: Save to database
  if (context.executionId) {
    await this.saveNodeExecution(context.executionId, {
      nodeName: this.label,
      data: validatedOutput,
      executionTime: Date.now() - context.nodeStartTime,
      status: 'success'
    });
  }
}
```

### 4. **Update Final Status**

After workflow completes: n8n:423-468

```typescript
async completeExecution(executionId: string, status: 'success' | 'error') {
  await db.update('execution_entity',
    { id: executionId },
    {
      status: status,
      finished: true,
      stoppedAt: new Date()
    }
  );

  // Update execution data with final variablePool state
  await db.update('execution_data',
    { executionId: executionId },
    {
      data: JSON.stringify({
        resultData: {
          runData: Object.fromEntries(context.variablePool)
        }
      })
    }
  );
}
```

## Minimal Schema SQL

Here's the minimal SQL to get started (PostgreSQL):

```sql
CREATE TABLE workflow_entity (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT false,
  nodes JSONB NOT NULL,
  connections JSONB NOT NULL,
  settings JSONB,
  static_data JSONB,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE execution_entity (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflow_entity(id),
  status VARCHAR(50) NOT NULL,
  mode VARCHAR(50) NOT NULL,
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  finished BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE execution_data (
  execution_id UUID PRIMARY KEY REFERENCES execution_entity(id),
  workflow_data JSONB NOT NULL,
  data TEXT NOT NULL
);

CREATE INDEX idx_execution_workflow ON execution_entity(workflow_id);
CREATE INDEX idx_execution_status ON execution_entity(status);
```

## Integration Points in Your Code

1. **ExecutionContext**: Add `executionId: string` property
2. **WorkflowExecutor.execute()**:
   - Call `startExecution()` before execution loop
   - Call `completeExecution()` after loop finishes
3. **Node.sendOutput()**: Save node results to database
4. **Error handling**: Update execution status to 'error' in catch blocks

## Notes

- n8n uses TypeORM for database abstraction, supporting PostgreSQL, MySQL, and SQLite
- The `execution_data.data` column stores the entire execution state as serialized JSON/TEXT
- For production, you'd want indexes on `workflow_id`, `status`, and `created_at` for efficient querying
- Consider adding a `user_id` column if you have multi-user support
- Binary data (file uploads) should be stored separately in a `binary_data` table or S3

Your topological sort execution model maps cleanly to this schema - just serialize your `variablePool` into the `runData` structure after each node execution.

Wiki pages you might want to explore:

- [Architecture Overview (n8n-io/n8n)](/wiki/n8n-io/n8n#1.2)

### Citations

**File:** packages/@n8n/db/src/repositories/execution.repository.ts (L355-384)

```typescript
	async createNewExecution(execution: CreateExecutionPayload): Promise<string> {
		const { data: dataObj, workflowData: currentWorkflow, ...rest } = execution;
		const { connections, nodes, name, settings } = currentWorkflow ?? {};
		const workflowData = { connections, nodes, name, settings, id: currentWorkflow.id };
		const data = stringify(dataObj);

		const { type: dbType, sqlite: sqliteConfig } = this.globalConfig.database;
		if (dbType === 'sqlite' && sqliteConfig.poolSize === 0) {
			// TODO: Delete this block of code once the sqlite legacy (non-pooling) driver is dropped.
			// In the non-pooling sqlite driver we can't use transactions, because that creates nested transactions under highly concurrent loads, leading to errors in the database
			const { identifiers: inserted } = await this.insert({ ...rest, createdAt: new Date() });
			const { id: executionId } = inserted[0] as { id: string };
			await this.executionDataRepository.insert({ executionId, workflowData, data });
			return String(executionId);
		} else {
			// All other database drivers should create executions and execution-data atomically
			return await this.manager.transaction(async (transactionManager) => {
				const { identifiers: inserted } = await transactionManager.insert(ExecutionEntity, {
					...rest,
					createdAt: new Date(),
				});
				const { id: executionId } = inserted[0] as { id: string };
				await this.executionDataRepository.createExecutionDataForExecution(
					{ executionId, workflowData, data },
					transactionManager,
				);
				return String(executionId);
			});
		}
	}
```

**File:** packages/@n8n/db/src/repositories/execution.repository.ts (L423-468)

```typescript
	async updateExistingExecution(executionId: string, execution: Partial<IExecutionResponse>) {
		const {
			id,
			data,
			workflowId,
			workflowData,
			createdAt, // must never change
			startedAt, // must never change
			customData,
			...executionInformation
		} = execution;

		const executionData: Partial<ExecutionData> = {};

		if (workflowData) executionData.workflowData = workflowData;
		if (data) executionData.data = stringify(data);

		const { type: dbType, sqlite: sqliteConfig } = this.globalConfig.database;

		if (dbType === 'sqlite' && sqliteConfig.poolSize === 0) {
			// TODO: Delete this block of code once the sqlite legacy (non-pooling) driver is dropped.
			// In the non-pooling sqlite driver we can't use transactions, because that creates nested transactions under highly concurrent loads, leading to errors in the database

			if (Object.keys(executionInformation).length > 0) {
				await this.update({ id: executionId }, executionInformation);
			}

			if (Object.keys(executionData).length > 0) {
				await this.executionDataRepository.update({ executionId }, executionData);
			}

			return;
		}

		// All other database drivers should update executions and execution-data atomically

		await this.manager.transaction(async (tx) => {
			if (Object.keys(executionInformation).length > 0) {
				await tx.update(ExecutionEntity, { id: executionId }, executionInformation);
			}

			if (Object.keys(executionData).length > 0) {
				await tx.update(ExecutionData, { executionId }, executionData);
			}
		});
	}
```

**File:** packages/cli/src/execution-lifecycle/save-execution-progress.ts (L7-84)

```typescript
export async function saveExecutionProgress(
	workflowId: string,
	executionId: string,
	nodeName: string,
	data: ITaskData,
	executionData: IRunExecutionData,
) {
	const logger = Container.get(Logger);
	const executionRepository = Container.get(ExecutionRepository);
	const errorReporter = Container.get(ErrorReporter);

	try {
		logger.debug(`Save execution progress to database for execution ID ${executionId} `, {
			executionId,
			nodeName,
		});

		const fullExecutionData = await executionRepository.findSingleExecution(executionId, {
			includeData: true,
			unflattenData: true,
		});

		if (!fullExecutionData) {
			// Something went badly wrong if this happens.
			// This check is here mostly to make typescript happy.
			return;
		}

		if (fullExecutionData.finished) {
			// We already received ´workflowExecuteAfter´ webhook, so this is just an async call
			// that was left behind. We skip saving because the other call should have saved everything
			// so this one is safe to ignore
			return;
		}

		fullExecutionData.data ??= {
			startData: {},
			resultData: {
				runData: {},
			},
			executionData: {
				contextData: {},
				metadata: {},
				nodeExecutionStack: [],
				waitingExecution: {},
				waitingExecutionSource: {},
			},
		};

		const { runData } = fullExecutionData.data.resultData;
		(runData[nodeName] ??= []).push(data);

		fullExecutionData.data.executionData = executionData.executionData;

		// Set last executed node so that it may resume on failure
		fullExecutionData.data.resultData.lastNodeExecuted = nodeName;

		// If the execution was canceled, we do not change the status
		// to running, because it is already canceled.
		if (fullExecutionData.status !== 'canceled') {
			fullExecutionData.status = 'running';
		}

		await executionRepository.updateExistingExecution(executionId, fullExecutionData);
	} catch (e) {
		const error = e instanceof Error ? e : new Error(`${e}`);

		errorReporter.error(error);
		// TODO: Improve in the future!
		// Errors here might happen because of database access
		// For busy machines, we may get "Database is locked" errors.

		// We do this to prevent crashes and executions ending in `unknown` state.
		logger.error(
			`Failed saving execution progress to database for execution ID ${executionId} (hookFunctionsSaveProgress, nodeExecuteAfter)`,
			{ error, executionId, workflowId },
		);
	}
```

## Q10

what are the differences with the schema that my application required and the n8n has

### Answer

You're asking about the **schema differences** between your simplified workflow engine and n8n's production database schema.

## Key Schema Differences

### 1. **Workflow Storage Complexity**

**Your Application Needs:**

```sql
CREATE TABLE workflow_entity (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  nodes JSONB,        -- Simple array of node definitions
  connections JSONB,  -- Simple array of edges
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**n8n Has:** n8n:24-24

n8n's `WorkflowEntity` includes many additional fields you don't need yet:

- `active` (boolean) - Whether workflow is enabled for triggers
- `settings` (JSON) - Workflow-level configuration (execution order, timezone, etc.)
- `staticData` (JSON) - Persistent data between executions
- `versionId` (UUID) - For tracking workflow versions
- `triggerCount` (number) - How many times workflow has been triggered
- `tags` (relation) - Workflow categorization
- `shared` (relation) - Multi-user permissions and sharing

**Why the difference?** n8n is a production system supporting multi-tenancy, workflow versioning, and complex permission models. Your system is single-user and doesn't need these features yet<cite />.

### 2. **Execution Tracking Granularity**

**Your Application Needs:**

```sql
CREATE TABLE execution_entity (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflow_entity(id),
  status VARCHAR(50),
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  finished BOOLEAN
);
```

**n8n Has:** n8n:354-383

n8n tracks additional execution metadata:

- `mode` - Distinguishes manual, trigger, webhook, retry executions
- `retryOf` - Links retry attempts to original execution
- `retrySuccessId` - Tracks which retry succeeded
- `waitTill` - For paused/waiting executions
- `workflowData` - Snapshot of workflow at execution time (for audit trail)
- `customData` - User-defined metadata
- `annotation` - User notes on execution

**Why the difference?** n8n needs to support execution recovery, retries, and detailed audit trails for enterprise use cases<cite />.

### 3. **Execution Data Storage**

**Your Application Needs:**

```sql
CREATE TABLE execution_data (
  execution_id UUID PRIMARY KEY,
  data TEXT  -- Just your variablePool serialized
);
```

**n8n Has:** n8n:365-366

n8n split execution data into a **separate table** in version 0.234.0 for performance reasons. The `execution_data` table stores:

- `workflowData` (JSONB) - Complete workflow definition snapshot
- `data` (TEXT) - Full `IRunExecutionData` including:
  - `resultData.runData` - Per-node execution results (your variablePool equivalent)
  - `executionData.contextData` - Context storage
  - `executionData.nodeExecutionStack` - Stack state for resumption
  - `executionData.waitingExecution` - Nodes waiting for multiple inputs
  - `executionData.metadata` - Additional execution metadata

**Why the difference?** n8n needs to support **partial execution resumption** and **workflow recovery** after crashes. Your topological sort approach executes workflows atomically, so you don't need to persist intermediate stack state<cite />.

### 4. **Missing Tables in Your Schema**

n8n has several tables you don't need yet:

**User Management:**

- `user` - User accounts
- `auth_identity` - Authentication providers (LDAP, SAML, etc.)
- `auth_provider_sync_history` - Sync logs

**Permissions:**

- `project` - Workspace organization
- `project_relation` - User-project memberships
- `shared_workflow` - Workflow sharing permissions
- `shared_credentials` - Credential sharing permissions

**Credentials:**

- `credentials_entity` - Encrypted credential storage
- `installed_packages` - Community nodes

**Monitoring:**

- `execution_metadata` - Additional execution annotations
- `execution_annotation` - User notes on executions
- `event_destinations` - Webhook/logging destinations

**Why you don't need these?** Your system is single-user and doesn't have:

- Multi-tenancy
- Credential management
- Community node packages
- External monitoring integrations

## Schema Evolution Path

If you want to evolve toward n8n's capabilities, add features in this order:

1. **Phase 1 (Current):** Basic workflow + execution tracking
2. **Phase 2:** Add `active` flag and `settings` to support scheduled workflows
3. **Phase 3:** Add `user` table and `shared_workflow` for multi-user support
4. **Phase 4:** Add `credentials_entity` for secure API key storage
5. **Phase 5:** Add execution recovery fields (`retryOf`, `waitTill`, stack state)

## Practical Differences

**Your Schema (Minimal):**

- 3 tables total
- ~10 columns across all tables
- Stores only essential execution data
- No user management
- No credential encryption
- No execution recovery

**n8n Schema (Production):**

- 30+ tables
- 200+ columns across all tables
- Stores complete execution state for recovery
- Full RBAC (Role-Based Access Control)
- Encrypted credential storage
- Execution retry and recovery support

## Notes

Your simplified schema is **perfectly appropriate** for a learning project. n8n's schema evolved over years to support enterprise features like multi-tenancy, audit compliance, and high availability. Start simple and add complexity only when you need specific features<cite />.

The most important difference is that n8n stores the **complete execution state** (including the node execution stack) to support resuming workflows after crashes, while your topological sort approach executes atomically and doesn't need this<cite />.

Wiki pages you might want to explore:

- [Distributed Execution and Scaling (n8n-io/n8n)](/wiki/n8n-io/n8n#2.2)

### Citations

**File:** packages/cli/BREAKING-CHANGES.md (L365-366)

```markdown
- The n8n database will use strings instead of numeric values to identify workflows and credentials
- Execution data is split into a separate database table
```

## Q11

Phase 1 (Current): Basic workflow + execution tracking

so here i should database right

### Answer

Yes, exactly! For **Phase 1 (Current): Basic workflow + execution tracking**, you should add database persistence to your workflow engine<cite />.

## What You Need to Implement

Based on your current code structure, here's what to add:

### 1. **Three Core Tables**

You need the minimal schema I outlined earlier:

````sql
CREATE TABLE workflow_entity (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  nodes JSONB NOT NULL,        -- Your workflow.nodes array
  connections JSONB NOT NULL,  -- Your workflow.edges array
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE execution_entity (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflow_entity(id),
  status VARCHAR(50) NOT NULL,  -- 'new', 'running', 'success', 'error'
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  finished BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE execution_data (
  execution_id UUID PRIMARY KEY REFERENCES execution_entity(id),
  workflow_data JSONB NOT NULL,  -- Snapshot of workflow at execution time
  data TEXT NOT NULL              -- Serialized variablePool
);
``` n8n:5-11

### 2. **Integration Points in Your Code**

**In `WorkflowExecutor.execute()`:**

```typescript
async execute(workflow: WorkflowDefinition, initialInputs: any): Promise<void> {
  // 1. Create execution record BEFORE starting
  const executionId = await this.createExecution(workflow);

  // 2. Add executionId to context
  const context = new ExecutionContext(workflow.edges, initialInputs, nodes);
  context.executionId = executionId; // Add this property

  // 3. Execute workflow (your existing code)
  while (queue.length > 0) {
    // ... your execution loop
  }

  // 4. Update final status AFTER completion
  await this.completeExecution(executionId, 'success');
}
``` n8n:53-76

**In `Node.sendOutput()`:**

After writing to `variablePool`, also save to database:

```typescript
protected sendOutput(output: any, context: ExecutionContext) {
  const validatedOutput = this.validateOutput(output);

  // Your existing code
  outgoingEdges.forEach((edge) => {
    context.variablePool.set(edge.id, validatedOutput);
  });

  // NEW: Save to database
  if (context.executionId) {
    await this.saveNodeResult(context.executionId, this.label, validatedOutput);
  }
}
``` n8n:7-23

### 3. **Why This Matters**

Without database persistence:
- ❌ Execution history is lost on restart
- ❌ Can't view past workflow runs
- ❌ No audit trail
- ❌ Can't debug failed executions

With database persistence:
- ✅ Full execution history
- ✅ Can query past runs by workflow, status, date
- ✅ Audit trail for compliance
- ✅ Debug failed executions by inspecting stored data

## Recommended Implementation Order

1. **Set up database connection** (use TypeORM, Prisma, or raw SQL)
2. **Create the 3 tables** using migrations
3. **Add `executionId` to `ExecutionContext`**
4. **Implement `createExecution()` and `completeExecution()` methods**
5. **Optionally: Save node results incrementally** (like n8n does)

This gives you the foundation for Phase 2 (scheduled workflows) and Phase 3 (multi-user support) later.

Wiki pages you might want to explore:
- [Architecture Overview (n8n-io/n8n)](/wiki/n8n-io/n8n#1.2)
### Citations
**File:** packages/@n8n/db/src/migrations/postgresdb/1690000000020-SeparateExecutionData.ts (L5-11)
```typescript
		await queryRunner.query(
			`CREATE TABLE "${tablePrefix}execution_data" (
				"executionId" integer NOT NULL,
				"workflowData" json NOT NULL,
				"data" text NOT NULL,
				CONSTRAINT "${tablePrefix}execution_data_fk" FOREIGN KEY ("executionId") REFERENCES ${tablePrefix}execution_entity(id) ON DELETE CASCADE
			)`,
````

**File:** packages/cli/src/active-executions.ts (L53-76)

```typescript
	async add(executionData: IWorkflowExecutionDataProcess, executionId?: string): Promise<string> {
		let executionStatus: ExecutionStatus = executionId ? 'running' : 'new';
		const mode = executionData.executionMode;
		if (executionId === undefined) {
			// Is a new execution so save in DB

			const fullExecutionData: CreateExecutionPayload = {
				data: executionData.executionData!,
				mode,
				finished: false,
				workflowData: executionData.workflowData,
				status: executionStatus,
				workflowId: executionData.workflowData.id,
			};

			fullExecutionData.retryOf = executionData.retryOf ?? undefined;

			const workflowId = executionData.workflowData.id;
			if (workflowId !== undefined && isWorkflowIdValid(workflowId)) {
				fullExecutionData.workflowId = workflowId;
			}

			executionId = await this.executionRepository.createNewExecution(fullExecutionData);
			assert(executionId);
```

**File:** packages/cli/src/execution-lifecycle/save-execution-progress.ts (L7-23)

```typescript
export async function saveExecutionProgress(
	workflowId: string,
	executionId: string,
	nodeName: string,
	data: ITaskData,
	executionData: IRunExecutionData,
) {
	const logger = Container.get(Logger);
	const executionRepository = Container.get(ExecutionRepository);
	const errorReporter = Container.get(ErrorReporter);

	try {
		logger.debug(`Save execution progress to database for execution ID ${executionId} `, {
			executionId,
			nodeName,
		});

```

## Q12

Phase 1 (Current): Basic workflow + execution tracking

so here i should database right

## Database Integration for Phase 1: Basic Workflow + Execution Tracking

Traces the complete database integration needed for Phase 1 workflow execution tracking, from workflow definition storage in [1a-1c], through execution lifecycle management in [2a-2d], to execution data persistence in [3a-3d].

### 1. Workflow Definition Storage

How workflow definitions are structured and persisted in the database

### 1a. Database Table Creation (`1587669153312-InitialMigration.ts:18`)

Initial migration creates workflow_entity table with core columns

```text
`CREATE TABLE IF NOT EXISTS ${tablePrefix}workflow_entity ("id" SERIAL NOT NULL, "name" character varying(128) NOT NULL, "active" boolean NOT NULL, "nodes" json NOT NULL, "connections" json NOT NULL, "createdAt" TIMESTAMP NOT NULL, "updatedAt" TIMESTAMP NOT NULL, "settings" json, "staticData" json, CONSTRAINT PK_${tablePrefix}eded7d72664448da7745d551207 PRIMARY KEY ("id"))`
```

### 1b. TypeORM Entity Definition (`workflow-entity.ts:26`)

WorkflowEntity class maps to database table

```text
@Entity()
export class WorkflowEntity extends WithTimestampsAndStringId implements IWorkflowDb {
```

### 1c. JSON Storage for Workflow Structure (`workflow-entity.ts:48`)

Nodes and connections stored as JSON columns for flexibility

```text
@JsonColumn()
nodes: INode[];

@JsonColumn()
connections: IConnections;
```

### 2. Execution Tracking Lifecycle

How workflow executions are created, tracked, and managed from start to finish

### 2a. Execution Registration (`active-executions.ts:53`)

ActiveExecutions.add() creates new execution record

```text
async add(executionData: IWorkflowExecutionDataProcess, executionId?: string): Promise<string> {
		let executionStatus: ExecutionStatus = executionId ? 'running' : 'new';
		const mode = executionData.executionMode;
		if (executionId === undefined) {
			// Is a new execution so save in DB
```

### 2b. Execution Payload Creation (`active-executions.ts:59`)

Prepares data structure for database insertion

```text
const fullExecutionData: CreateExecutionPayload = {
			data: executionData.executionData!,
			mode,
			finished: false,
			workflowData: executionData.workflowData,
			status: executionStatus,
			workflowId: executionData.workflowData.id,
		};
```

### 2c. Atomic Execution Creation (`execution.repository.ts:371`)

Creates both execution_entity and execution_data records in transaction

```text
return await this.manager.transaction(async (transactionManager) => {
				const { identifiers: inserted } = await transactionManager.insert(ExecutionEntity, {
					...rest,
					createdAt: new Date(),
				});
				const { id: executionId } = inserted[0] as { id: string };
				await this.executionDataRepository.createExecutionDataForExecution(
					{ executionId, workflowData, data },
					transactionManager,
				);
				return String(executionId);
			});
```

### 2d. Execution Status Update (`execution.repository.ts:415`)

Updates execution status to running when execution begins

```text
async setRunning(executionId: string) {
		const startedAt = new Date();

		await this.update({ id: executionId }, { status: 'running', startedAt });

		return startedAt;
	}
```

### 3. Execution Data Persistence

How execution progress and node results are saved to the database during workflow execution

### 3a. Progress Save Function (`save-execution-progress.ts:7`)

Function called after each node execution to save results

```text
export async function saveExecutionProgress(
	workflowId: string,
	executionId: string,
	nodeName: string,
	data: ITaskData,
	executionData: IRunExecutionData,
) {
```

### 3b. Execution Data Structure Initialization (`save-execution-progress.ts:42`)

Sets up the complete execution data structure

```text
fullExecutionData.data ??= {
			startData: {},
			resultData: {
				runData: {},
			},
			executionData: {
				contextData: {},
				metadata: {},
				nodeExecutionStack: [],
				waitingExecution: {},
				waitingExecutionSource: {},
			},
		};
```

### 3c. Node Result Storage (`save-execution-progress.ts:56`)

Stores each node's output data in runData array

```text
const { runData } = fullExecutionData.data.resultData;
		(runData[nodeName] ??= []).push(data);
```

### 3d. Database Update (`save-execution-progress.ts:70`)

Persists the updated execution data to database

```text
await executionRepository.updateExistingExecution(executionId, fullExecutionData);
```

## Q13

Execution entity and exection data why do we two things ?

### Answer

You're asking why n8n separates execution tracking into **two tables**: `execution_entity` and `execution_data`, instead of storing everything in a single table.

## The Separation Rationale

### 1. **Performance Optimization**

The split was introduced in migration `1690000000020-SeparateExecutionData` to improve query performance n8n:3-26 .

**`execution_entity`** stores **lightweight metadata**:

- Execution status, timestamps, workflow ID
- Used for listing, filtering, and searching executions
- Frequently queried but rarely needs full execution data

**`execution_data`** stores **heavy payload data**:

- Complete workflow definition snapshot (`workflowData`)
- Full execution results (`data` - serialized `IRunExecutionData`)
- Only loaded when viewing execution details n8n:9-36

### 2. **Query Efficiency**

When listing executions in the UI, n8n only needs metadata from `execution_entity`: n8n:265-350

The `findSingleExecution()` method shows this pattern - it only joins `executionData` when `includeData: true` is specified. For list views, the heavy `data` column (which can be megabytes of JSON) is never loaded.

### 3. **Database Size Management**

The `data` column in `execution_data` can be extremely large:

- Contains entire workflow state
- All node outputs and intermediate data
- Context data and execution stack

By separating this, n8n can:

- **Index efficiently** on `execution_entity` (status, timestamps, workflowId)
- **Prune old executions** without loading heavy data
- **Export/backup** selectively (the export command excludes `execution_data` by default) n8n:39-45

### 4. **Atomic Updates**

Both tables are updated atomically in transactions: n8n:355-383

The `createNewExecution()` method inserts both records in a single transaction, ensuring consistency. Similarly, `updateExistingExecution()` updates both tables atomically n8n:423-468 .

## Real-World Impact

**Before separation** (single table):

- Listing 100 executions = loading potentially gigabytes of execution data
- Slow queries, high memory usage
- Database bloat from large TEXT/JSON columns

**After separation** (two tables):

- Listing 100 executions = loading only metadata (~10KB per execution)
- Fast queries with proper indexes
- Heavy data only loaded on-demand

## For Your Application

For Phase 1, you **should follow this pattern**:

```sql
-- Lightweight metadata table
CREATE TABLE execution_entity (
  id UUID PRIMARY KEY,
  workflow_id UUID,
  status VARCHAR(50),
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,
  finished BOOLEAN
);

-- Heavy data table
CREATE TABLE execution_data (
  execution_id UUID PRIMARY KEY REFERENCES execution_entity(id),
  workflow_data JSONB,
  data TEXT  -- Your serialized variablePool
);
```

This separation will save you from performance issues as your execution history grows.

## Notes

The migration shows this was a deliberate architectural decision made after n8n had been running in production - they migrated existing data from the single-table structure to the two-table structure n8n:14-25 . This indicates it was a response to real performance problems with the original design.

Wiki pages you might want to explore:

- [Architecture Overview (n8n-io/n8n)](/wiki/n8n-io/n8n#1.2)

### Citations

**File:** packages/@n8n/db/src/migrations/postgresdb/1690000000020-SeparateExecutionData.ts (L3-26)

```typescript
export class SeparateExecutionData1690000000020 implements ReversibleMigration {
	async up({ queryRunner, tablePrefix }: MigrationContext) {
		await queryRunner.query(
			`CREATE TABLE "${tablePrefix}execution_data" (
				"executionId" integer NOT NULL,
				"workflowData" json NOT NULL,
				"data" text NOT NULL,
				CONSTRAINT "${tablePrefix}execution_data_fk" FOREIGN KEY ("executionId") REFERENCES ${tablePrefix}execution_entity(id) ON DELETE CASCADE
			)`,
		);

		await queryRunner.query(
			`INSERT INTO "${tablePrefix}execution_data" (
				"executionId",
				"workflowData",
				"data")
				SELECT "id", "workflowData", "data" FROM "${tablePrefix}execution_entity"
			`,
		);

		await queryRunner.query(
			`ALTER TABLE "${tablePrefix}execution_entity" DROP COLUMN "workflowData",  DROP COLUMN "data"`,
		);
	}
```

**File:** packages/@n8n/db/src/entities/execution-data.ts (L9-36)

```typescript
@Entity()
export class ExecutionData {
	@Column('text')
	data: string;

	// WARNING: the workflowData column has been changed from IWorkflowDb to IWorkflowBase
	// when ExecutionData was introduced as a separate entity.
	// This is because manual executions of unsaved workflows have no workflow id
	// and IWorkflowDb has it as a mandatory field. IWorkflowBase reflects the correct
	// data structure for this entity.
	/**
	 * Workaround: Pindata causes TS errors from excessively deep type instantiation
	 * due to `INodeExecutionData`, so we use a simplified version so `QueryDeepPartialEntity`
	 * can resolve and calls to `update`, `insert`, and `insert` pass typechecking.
	 */
	@JsonColumn()
	workflowData: Omit<IWorkflowBase, 'pinData'> & { pinData?: ISimplifiedPinData };

	@PrimaryColumn({ transformer: idStringifier })
	executionId: string;

	@OneToOne('ExecutionEntity', 'executionData', {
		onDelete: 'CASCADE',
	})
	@JoinColumn({
		name: 'executionId',
	})
	execution: ExecutionEntity;
```

**File:** packages/@n8n/db/src/repositories/execution.repository.ts (L265-350)

```typescript
	async findSingleExecution(
		id: string,
		options?: {
			includeData: true;
			includeAnnotation?: boolean;
			unflattenData: true;
			where?: FindOptionsWhere<ExecutionEntity>;
		},
	): Promise<IExecutionResponse | undefined>;
	async findSingleExecution(
		id: string,
		options?: {
			includeData: true;
			includeAnnotation?: boolean;
			unflattenData?: false | undefined;
			where?: FindOptionsWhere<ExecutionEntity>;
		},
	): Promise<IExecutionFlattedDb | undefined>;
	async findSingleExecution(
		id: string,
		options?: {
			includeData?: boolean;
			includeAnnotation?: boolean;
			unflattenData?: boolean;
			where?: FindOptionsWhere<ExecutionEntity>;
		},
	): Promise<IExecutionBase | undefined>;
	async findSingleExecution(
		id: string,
		options?: {
			includeData?: boolean;
			includeAnnotation?: boolean;
			unflattenData?: boolean;
			where?: FindOptionsWhere<ExecutionEntity>;
		},
	): Promise<IExecutionFlattedDb | IExecutionResponse | IExecutionBase | undefined> {
		const findOptions: FindOneOptions<ExecutionEntity> = {
			where: {
				id,
				...options?.where,
			},
		};
		if (options?.includeData) {
			findOptions.relations = { executionData: true, metadata: true };
		}

		if (options?.includeAnnotation) {
			findOptions.relations = {
				...findOptions.relations,
				annotation: {
					tags: true,
				},
			};
		}

		const execution = await this.findOne(findOptions);

		if (!execution) {
			return undefined;
		}

		const { executionData, metadata, annotation, ...rest } = execution;
		const serializedAnnotation = this.serializeAnnotation(annotation);

		if (execution.status === 'success' && executionData?.data === '[]') {
			this.errorReporter.error('Found successful execution where data is empty stringified array', {
				extra: {
					executionId: execution.id,
					workflowId: executionData?.workflowData.id,
				},
			});
		}

		return {
			...rest,
			...(options?.includeData && {
				data: options?.unflattenData
					? (parse(executionData.data) as IRunExecutionData)
					: executionData.data,
				workflowData: executionData?.workflowData,
				customData: Object.fromEntries(metadata.map((m) => [m.key, m.value])),
			}),
			...(options?.includeAnnotation &&
				serializedAnnotation && { annotation: serializedAnnotation }),
		} as IExecutionFlattedDb | IExecutionResponse | IExecutionBase;
	}
```

**File:** packages/@n8n/db/src/repositories/execution.repository.ts (L355-383)

```typescript
	async createNewExecution(execution: CreateExecutionPayload): Promise<string> {
		const { data: dataObj, workflowData: currentWorkflow, ...rest } = execution;
		const { connections, nodes, name, settings } = currentWorkflow ?? {};
		const workflowData = { connections, nodes, name, settings, id: currentWorkflow.id };
		const data = stringify(dataObj);

		const { type: dbType, sqlite: sqliteConfig } = this.globalConfig.database;
		if (dbType === 'sqlite' && sqliteConfig.poolSize === 0) {
			// TODO: Delete this block of code once the sqlite legacy (non-pooling) driver is dropped.
			// In the non-pooling sqlite driver we can't use transactions, because that creates nested transactions under highly concurrent loads, leading to errors in the database
			const { identifiers: inserted } = await this.insert({ ...rest, createdAt: new Date() });
			const { id: executionId } = inserted[0] as { id: string };
			await this.executionDataRepository.insert({ executionId, workflowData, data });
			return String(executionId);
		} else {
			// All other database drivers should create executions and execution-data atomically
			return await this.manager.transaction(async (transactionManager) => {
				const { identifiers: inserted } = await transactionManager.insert(ExecutionEntity, {
					...rest,
					createdAt: new Date(),
				});
				const { id: executionId } = inserted[0] as { id: string };
				await this.executionDataRepository.createExecutionDataForExecution(
					{ executionId, workflowData, data },
					transactionManager,
				);
				return String(executionId);
			});
		}
```

**File:** packages/@n8n/db/src/repositories/execution.repository.ts (L423-468)

```typescript
	async updateExistingExecution(executionId: string, execution: Partial<IExecutionResponse>) {
		const {
			id,
			data,
			workflowId,
			workflowData,
			createdAt, // must never change
			startedAt, // must never change
			customData,
			...executionInformation
		} = execution;

		const executionData: Partial<ExecutionData> = {};

		if (workflowData) executionData.workflowData = workflowData;
		if (data) executionData.data = stringify(data);

		const { type: dbType, sqlite: sqliteConfig } = this.globalConfig.database;

		if (dbType === 'sqlite' && sqliteConfig.poolSize === 0) {
			// TODO: Delete this block of code once the sqlite legacy (non-pooling) driver is dropped.
			// In the non-pooling sqlite driver we can't use transactions, because that creates nested transactions under highly concurrent loads, leading to errors in the database

			if (Object.keys(executionInformation).length > 0) {
				await this.update({ id: executionId }, executionInformation);
			}

			if (Object.keys(executionData).length > 0) {
				await this.executionDataRepository.update({ executionId }, executionData);
			}

			return;
		}

		// All other database drivers should update executions and execution-data atomically

		await this.manager.transaction(async (tx) => {
			if (Object.keys(executionInformation).length > 0) {
				await tx.update(ExecutionEntity, { id: executionId }, executionInformation);
			}

			if (Object.keys(executionData).length > 0) {
				await tx.update(ExecutionData, { executionId }, executionData);
			}
		});
	}
```

**File:** packages/cli/src/commands/export/entities.ts (L39-45)

```typescript
if (!this.flags.includeExecutionHistoryDataTables) {
  excludedDataTables.add("execution_annotation_tags");
  excludedDataTables.add("execution_annotations");
  excludedDataTables.add("execution_data");
  excludedDataTables.add("execution_entity");
  excludedDataTables.add("execution_metadata");
}
```

## Q14

workflow_data JSONB NOT NULL, -- Snapshot of workflow at execution time

what does snapshot mean and how does it look like for example?

### Answer

You're asking about the **`workflowData` snapshot** stored in the `execution_data` table - specifically what "snapshot" means and what it contains.

## What is a Workflow Snapshot?

A **snapshot** is a complete copy of the workflow definition **at the moment execution begins** n8n:14-25 . This is stored separately from the live workflow definition because:

1. **Workflows can be edited** after execution starts
2. **Audit trail** - you need to know exactly what ran
3. **Retry/resume** - you need the original workflow structure to retry failed executions

## Structure of workflowData

The `workflowData` column stores an `IWorkflowBase` object, which contains n8n:24-25 :

```typescript
{
  id: string,           // Workflow ID
  name: string,         // Workflow name
  nodes: INode[],       // Complete node definitions
  connections: IConnections,  // Node connections/edges
  settings: object,     // Workflow settings
  pinData?: object      // Pinned test data (if any)
}
```

## Real Example from Tests

Here's what an actual workflow snapshot looks like n8n:2162-2164 :

```json
{
  "nodes": [
    {
      "id": "node-1",
      "name": "Execute Workflow Trigger",
      "type": "n8n-nodes-base.executeWorkflowTrigger",
      "position": [250, 300],
      "parameters": {}
    },
    {
      "id": "node-2",
      "name": "DebugHelper",
      "type": "n8n-nodes-base.debugHelper",
      "position": [450, 300],
      "parameters": {
        "test": "abc"
      }
    }
  ],
  "connections": {
    "Execute Workflow Trigger": {
      "main": [
        [
          {
            "node": "DebugHelper",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {},
  "pinData": {}
}
```

## Why Store This Snapshot?

The migration that created the `execution_data` table shows this was intentional n8n:6-12 . When you view an execution's details, n8n loads this snapshot to show you **exactly what workflow structure was executed**, even if the workflow has been modified since then.

## How It's Used

When creating an execution, the current workflow definition is copied into `workflowData` n8n:179-179 :

```typescript
const workflowData = parseJson(execution.workflowData);
// Now you can access:
// - workflowData.nodes (all node definitions)
// - workflowData.connections (how nodes are connected)
// - workflowData.settings (workflow configuration)
```

## For Your Application

In your workflow engine, you'd store:

```typescript
{
  executionId: "uuid-123",
  workflowData: {
    nodes: [
      { id: "start-1", type: "start", label: "Start" },
      { id: "api-2", type: "api", label: "Fetch Weather", props: {...} },
      { id: "end-3", type: "end", label: "End" }
    ],
    edges: [
      { id: "e1", source: "start-1", target: "api-2" },
      { id: "e2", source: "api-2", target: "end-3" }
    ]
  }
}
```

This ensures you can always see what workflow structure produced a given execution result, even if the workflow is later modified or deleted.

## Notes

The snapshot is stored as JSONB in PostgreSQL for efficient querying, but as TEXT in SQLite/MySQL n8n:8-13 . This allows n8n to support multiple database backends while maintaining the same data structure.

### Citations

**File:** packages/@n8n/db/src/entities/execution-data.ts (L14-25)

```typescript
	// WARNING: the workflowData column has been changed from IWorkflowDb to IWorkflowBase
	// when ExecutionData was introduced as a separate entity.
	// This is because manual executions of unsaved workflows have no workflow id
	// and IWorkflowDb has it as a mandatory field. IWorkflowBase reflects the correct
	// data structure for this entity.
	/**
	 * Workaround: Pindata causes TS errors from excessively deep type instantiation
	 * due to `INodeExecutionData`, so we use a simplified version so `QueryDeepPartialEntity`
	 * can resolve and calls to `update`, `insert`, and `insert` pass typechecking.
	 */
	@JsonColumn()
	workflowData: Omit<IWorkflowBase, 'pinData'> & { pinData?: ISimplifiedPinData };
```

**File:** packages/workflow/test/telemetry-helpers.test.ts (L2162-2164)

```typescript
		},
		pinData: {},
	};
```

**File:** packages/@n8n/db/src/migrations/mysqldb/1690000000030-SeparateExecutionData.ts (L6-12)

```typescript
			`CREATE TABLE ${tablePrefix}execution_data (
				executionId int(11) NOT NULL primary key,
				workflowData json NOT NULL,
				data MEDIUMTEXT NOT NULL,
				CONSTRAINT \`${tablePrefix}execution_data_FK\` FOREIGN KEY (\`executionId\`) REFERENCES \`${tablePrefix}execution_entity\` (\`id\`) ON DELETE CASCADE
			)
			ENGINE=InnoDB`,
```

**File:** packages/@n8n/db/src/migrations/common/1630330987096-UpdateWorkflowCredentials.ts (L179-179)

```typescript
const workflowData = parseJson(execution.workflowData);
```

**File:** packages/@n8n/db/src/migrations/sqlite/1690000000010-SeparateExecutionData.ts (L8-13)

```typescript
			`CREATE TABLE "${tablePrefix}execution_data" (
				"executionId" int PRIMARY KEY NOT NULL,
				"workflowData" text NOT NULL,
				"data" text NOT NULL,
				FOREIGN KEY("executionId") REFERENCES "${tablePrefix}execution_entity" ("id") ON DELETE CASCADE
			)`,
```

## Q15

CREATE TABLE execution_data (  
 execution_id UUID PRIMARY KEY REFERENCES execution_entity(id),  
 workflow_data JSONB NOT NULL, -- Snapshot of workflow at execution time  
 data TEXT NOT NULL -- Serialized variablePool  
);

give me examplary data for the whole it is going to have

### Answer

You're asking for **example data** that would be stored in the `execution_data` table for a workflow execution.

## Example execution_data Row

Here's what a complete row would look like based on n8n's actual data structure:

```json
{
  "execution_id": "550e8400-e29b-41d4-a716-446655440000",
  "workflow_data": {
    "id": "123",
    "name": "Weather Workflow",
    "nodes": [
      {
        "id": "start-1",
        "name": "Start",
        "type": "start",
        "position": [250, 300],
        "parameters": {}
      },
      {
        "id": "api-2",
        "name": "Fetch Weather",
        "type": "api",
        "position": [450, 300],
        "parameters": {
          "method": "GET",
          "url": "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41"
        }
      },
      {
        "id": "end-3",
        "name": "End",
        "type": "end",
        "position": [650, 300],
        "parameters": {}
      }
    ],
    "connections": {
      "Start": {
        "main": [
          [
            {
              "node": "Fetch Weather",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Fetch Weather": {
        "main": [
          [
            {
              "node": "End",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    },
    "settings": {},
    "pinData": {}
  },
  "data": "{\"startData\":{},\"resultData\":{\"runData\":{\"Start\":[{\"startTime\":1732882780588,\"executionIndex\":0,\"executionTime\":4,\"source\":[],\"executionStatus\":\"success\",\"data\":{\"main\":[[{\"json\":{\"latitude\":52.52,\"longitude\":13.41,\"city\":\"Berlin\"},\"pairedItem\":{\"item\":0}}]]}}],\"Fetch Weather\":[{\"startTime\":1732882780593,\"executionIndex\":1,\"executionTime\":245,\"source\":[{\"previousNode\":\"Start\"}],\"executionStatus\":\"success\",\"data\":{\"main\":[[{\"json\":{\"status\":200,\"data\":{\"current_weather\":{\"temperature\":15.2,\"windspeed\":12.5}}},\"pairedItem\":{\"item\":0}}]]}}],\"End\":[{\"startTime\":1732882780840,\"executionIndex\":2,\"executionTime\":2,\"source\":[{\"previousNode\":\"Fetch Weather\"}],\"executionStatus\":\"success\",\"data\":{\"main\":[[{\"json\":{\"status\":200,\"data\":{\"current_weather\":{\"temperature\":15.2,\"windspeed\":12.5}}},\"pairedItem\":{\"item\":0}}]]}}]},\"pinData\":{},\"lastNodeExecuted\":\"End\"},\"executionData\":{\"contextData\":{},\"nodeExecutionStack\":[],\"metadata\":{},\"waitingExecution\":{},\"waitingExecutionSource\":{}}}"
}
```

## Breaking Down the `data` Column

The `data` TEXT column contains a **stringified JSON** of the complete execution state. Here's what it looks like when parsed: n8n:1-114

The structure includes:

1. **`startData`**: Initial workflow parameters (empty in this case)
2. **`resultData.runData`**: Per-node execution results
   - Each node name maps to an array of execution attempts
   - Each attempt contains:
     - `startTime`: Unix timestamp when node started
     - `executionIndex`: Sequential execution counter
     - `executionTime`: Duration in milliseconds
     - `executionStatus`: "success" | "error" | "running"
     - `data.main`: Array of output data items with `json` payload and `pairedItem` tracking
     - `source`: Which previous node(s) provided input

3. **`resultData.lastNodeExecuted`**: Name of the last node that ran
4. **`executionData.contextData`**: Your equivalent of `variablePool` - stores context data keyed by `'flow'` or `'node:{nodeName}'`
5. **`executionData.nodeExecutionStack`**: Stack state (empty when execution completes)
6. **`executionData.waitingExecution`**: Nodes waiting for multiple inputs

## For Your Application

In your simplified system, the `data` column would contain your `variablePool` serialized:

```json
{
  "startData": {},
  "resultData": {
    "runData": {
      "start-1": [
        {
          "data": { "latitude": 52.52, "longitude": 13.41, "city": "Berlin" }
        }
      ],
      "api-2": [
        {
          "data": { "status": 200, "data": { "temperature": 15.2 } }
        }
      ],
      "end-3": [
        {
          "data": { "status": 200, "data": { "temperature": 15.2 } }
        }
      ]
    }
  },
  "executionData": {
    "contextData": {}
  }
}
```

## Notes

The `workflow_data` column stores the **snapshot** of the workflow definition at execution time n8n:356-358 , while the `data` column stores the **actual execution results** - what each node produced during the run n8n:359-359 . This separation allows you to see both what workflow structure was executed and what data it produced.

### Citations

**File:** packages/workflow/test/fixtures/WorkflowDataProxy/multiple_inputs_run.json (L1-114)

```json
{
	"data": {
		"startData": {},
		"resultData": {
			"runData": {
				"Manual Trigger": [
					{
						"startTime": 1749486952181,
						"executionIndex": 0,
						"source": [],
						"hints": [],
						"executionTime": 2,
						"executionStatus": "success",
						"data": { "main": [[{ "json": {}, "pairedItem": { "item": 0 } }]] }
					}
				],
				"Set main variable": [
					{
						"startTime": 1749486952183,
						"executionIndex": 1,
						"source": [{ "previousNode": "Manual Trigger" }],
						"hints": [],
						"executionTime": 2,
						"executionStatus": "success",
						"data": { "main": [[{ "json": { "main_variable": 2 }, "pairedItem": { "item": 0 } }]] }
					}
				],
				"Set variable_1": [
					{
						"startTime": 1749486952185,
						"executionIndex": 2,
						"source": [{ "previousNode": "Set main variable" }],
						"hints": [],
						"executionTime": 0,
						"executionStatus": "success",
						"data": {
							"main": [[{ "json": { "variable_1": "1234" }, "pairedItem": { "item": 0 } }]]
						}
					}
				],
				"Set variable_2": [
					{
						"startTime": 1749486952186,
						"executionIndex": 3,
						"source": [{ "previousNode": "Set main variable" }],
						"hints": [],
						"executionTime": 0,
						"executionStatus": "success",
						"data": {
							"main": [[{ "json": { "variable_2": "2345" }, "pairedItem": { "item": 0 } }]]
						}
					}
				],
				"Set variable_3": [
					{
						"startTime": 1749486952187,
						"executionIndex": 4,
						"source": [{ "previousNode": "Set main variable" }],
						"hints": [],
						"executionTime": 0,
						"executionStatus": "success",
						"data": {
							"main": [[{ "json": { "variable_3": "3456" }, "pairedItem": { "item": 0 } }]]
						}
					}
				],
				"Merge": [
					{
						"startTime": 1749486952197,
						"executionIndex": 5,
						"source": [null, null, { "previousNode": "Set variable_3" }],
						"hints": [],
						"executionTime": 12,
						"executionStatus": "success",
						"data": {
							"main": [
								[{ "json": { "variable_3": "3456" }, "pairedItem": { "item": 0, "input": 2 } }]
							]
						}
					}
				],
				"Output": [
					{
						"startTime": 1749486952210,
						"executionIndex": 6,
						"source": [{ "previousNode": "Merge" }],
						"hints": [],
						"executionTime": 4,
						"executionStatus": "success",
						"data": {
							"main": [
								[
									{
										"json": { "final_variable_2": "3456", "main": "2" },
										"pairedItem": { "item": 0 }
									}
								]
							]
						}
					}
				]
			},
			"pinData": {},
			"lastNodeExecuted": "Output"
		},
		"executionData": {
			"contextData": {},
			"nodeExecutionStack": [],
			"metadata": {},
			"waitingExecution": {},
			"waitingExecutionSource": {}
		}
	}
```

**File:** packages/@n8n/db/src/repositories/execution.repository.ts (L356-358)

```typescript
const { data: dataObj, workflowData: currentWorkflow, ...rest } = execution;
const { connections, nodes, name, settings } = currentWorkflow ?? {};
const workflowData = {
  connections,
  nodes,
  name,
  settings,
  id: currentWorkflow.id,
};
```

**File:** packages/@n8n/db/src/repositories/execution.repository.ts (L359-359)

```typescript
const data = stringify(dataObj);
```

## Q16

give me the examples for start data and the execution data in the above json

### Answer

You're asking for **concrete examples** of what the `startData` and `executionData` fields contain within the `data` column of the `execution_data` table.

## startData Example

The `startData` field stores **initial execution parameters** that control how the workflow runs n8n:309-317 .

Here's a real example from n8n's codebase:

```json
{
  "startData": {
    "destinationNode": "Edit Fields",
    "originalDestinationNode": "Edit Fields",
    "runNodeFilter": ["Start", "Fetch Weather", "Edit Fields"]
  }
}
```

**What each field means:**

- `destinationNode`: The target node for partial execution (when running from a specific node) n8n:311-311
- `originalDestinationNode`: The original destination before any modifications n8n:312-312
- `runNodeFilter`: Array of node names that should execute (for partial execution) n8n:313-313

For a **full workflow execution** (not partial), `startData` is typically empty:

```json
{
  "startData": {}
}
```

This is what you see in the test data n8n:2-2 .

## executionData Example

The `executionData` field stores **runtime execution state** including context, stack, and waiting nodes n8n:319-325 .

Here's what it looks like during execution:

```json
{
  "executionData": {
    "contextData": {
      "flow": {
        "apiKey": "secret-key-123"
      },
      "node:Fetch Weather": {
        "lastRequestTime": 1732882780593,
        "requestCount": 1
      }
    },
    "nodeExecutionStack": [
      {
        "node": {
          "id": "end-3",
          "name": "End",
          "type": "end"
        },
        "data": {
          "main": [
            [
              {
                "json": { "status": 200, "data": { "temperature": 15.2 } }
              }
            ]
          ]
        },
        "source": {
          "previousNode": "Fetch Weather"
        }
      }
    ],
    "metadata": {},
    "waitingExecution": {
      "merge-node": {
        "0": [
          {
            "json": { "data": "from-branch-1" }
          }
        ]
      }
    },
    "waitingExecutionSource": {
      "merge-node": {
        "0": {
          "main": [
            {
              "previousNode": "Branch 1"
            }
          ]
        }
      }
    }
  }
}
```

**What each field means:**

1. **`contextData`**: Stores persistent data across nodes n8n:320-320
   - `flow`: Workflow-level context (shared by all nodes)
   - `node:{nodeName}`: Node-specific context

2. **`nodeExecutionStack`**: Queue of nodes waiting to execute n8n:321-321
   - Contains node definitions and their input data
   - Empty when execution completes

3. **`metadata`**: Additional execution metadata n8n:322-322

4. **`waitingExecution`**: Nodes with multiple inputs waiting for all data n8n:323-323
   - Key: node name
   - Value: Map of input index to received data

5. **`waitingExecutionSource`**: Tracks which nodes sent data to waiting nodes n8n:324-324

**After execution completes**, these fields are typically empty:

```json
{
  "executionData": {
    "contextData": {},
    "nodeExecutionStack": [],
    "metadata": {},
    "waitingExecution": {},
    "waitingExecutionSource": {}
  }
}
```

This is what you see in the schema snapshots n8n:294-318 .

## Notes

The `startData` is populated **before execution begins** to control execution behavior, while `executionData` is **actively updated during execution** to track runtime state. Both are serialized into the `data` TEXT column alongside `resultData` which contains the actual node outputs.

Wiki pages you might want to explore:

- [Architecture Overview (n8n-io/n8n)](/wiki/n8n-io/n8n#1.2)

### Citations

**File:** packages/core/src/execution-engine/workflow-execute.ts (L309-317)

```typescript
		this.runExecutionData = {
			startData: {
				destinationNode: destinationNodeName,
				originalDestinationNode: originalDestination,
				runNodeFilter: Array.from(filteredNodes.values()).map((node) => node.name),
			},
			resultData: {
				runData,
				pinData,
```

**File:** packages/core/src/execution-engine/workflow-execute.ts (L319-325)

```typescript
			executionData: {
				contextData: {},
				nodeExecutionStack,
				metadata: {},
				waitingExecution,
				waitingExecutionSource,
			},
```

**File:** packages/cli/src/evaluation.ee/test-runner/**tests**/mock-data/execution-data.json (L2-2)

```json
	"startData": {},
```

**File:** packages/testing/playwright/tests/cli-workflows/workflow-tests.spec.ts-snapshots/workflow-182-schema-mode-workflows.snap (L294-318)

```text
        "executionData": {
          "type": "object",
          "properties": {
            "contextData": {
              "type": "object",
              "properties": {}
            },
            "nodeExecutionStack": {
              "type": "array",
              "items": {}
            },
            "metadata": {
              "type": "object",
              "properties": {}
            },
            "waitingExecution": {
              "type": "object",
              "properties": {}
            },
            "waitingExecutionSource": {
              "type": "object",
              "properties": {}
            }
          }
        }
```
