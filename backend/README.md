# Workflow Execution Engine

A TypeScript-based DAG (Directed Acyclic Graph) workflow execution engine similar to n8n and Zapier.

## Features

- ✅ DAG-based workflow execution with topological sort
- ✅ Cycle detection before execution
- ✅ Edge-based data flow (VariablePool keyed by edge IDs)
- ✅ Stateless node execution
- ✅ Support for conditional branching (IF-ELSE, SWITCH)
- ✅ Multiple node types: Start, API, End
- ✅ Mustache templating for dynamic API calls
- ✅ Full TypeScript type safety

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

### Development Mode

\`\`\`bash
npm run dev
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

### Run Production

\`\`\`bash
npm start
\`\`\`

## Architecture

### Data Flow: The VariablePool

The **VariablePool** is a `Map<edgeId, data>` that stores all data flowing between nodes:

- **Key**: Edge ID (e.g., "e1", "e2")
- **Value**: Data passing through that edge

Example execution flow:
\`\`\`
StartNode writes: variablePool.set("e1", {city: "Berlin"})
APINode reads: variablePool.get("e1") → {city: "Berlin"}
APINode writes: variablePool.set("e2", {temperature: 25})
EndNode reads: variablePool.get("e2") → {temperature: 25}
\`\`\`

### Why Edge-Based Keys?

- Prevents conflicts when nodes have multiple outputs
- Enables conditional routing (IF-ELSE only activates certain edges)
- Maintains clear data lineage

## Example Workflow

\`\`\`typescript
const workflow = {
nodes: [
{ id: "start-1", type: "start", label: "Start" },
{
id: "api-2",
type: "api",
label: "Fetch Weather",
props: {
method: "GET",
url: "https://api.weather.com?city={{e1.city}}"
}
},
{ id: "end-3", type: "end", label: "End" }
],
edges: [
{ id: "e1", source: "start-1", target: "api-2" },
{ id: "e2", source: "api-2", target: "end-3" }
]
};

const executor = new WorkflowExecutor();
await executor.execute(workflow, { city: "Berlin" });
\`\`\`

## Adding New Node Types

1. Create a new class extending `Node`
2. Implement `execute(context: ExecutionContext)` method
3. Use `getNodeInputs(context, this.id)` to read data
4. Use `this.sendOutput(data, context)` to write data
5. Register in `NodeFactory`

## License

MIT
\`\`\`

---

### **8. Installation and Setup Commands**

Create project directory
mkdir workflow-engine
cd workflow-engine

Initialize npm (creates package.json)
npm init -y

Install dependencies
npm install mustache

Install dev dependencies
npm install --save-dev typescript @types/node @types/mustache ts-node

Create src directory
mkdir src

Copy all source files into src/
Build the project
npm run build

Run in development mode
npm run dev

Or run production build
npm start

---

## **Key Clarifications**

### **Where is the VariablePool?**

The **VariablePool** is a property of the `ExecutionContext` class:

export class ExecutionContext {
variablePool: Map<string, any>; // ← HERE IT IS!
// ...
}

**How it works:**

1. Created when `WorkflowExecutor` starts: `const context = new ExecutionContext(edges, initialInputs);`
2. **StartNode** writes initial data: `context.variablePool.set("e1", initialInputs)`
3. **APINode** reads from it: `context.variablePool.get("e1")`
4. **APINode** writes response: `context.variablePool.set("e2", responseData)`
5. **EndNode** reads final data: `context.variablePool.get("e2")`

The VariablePool is passed through the entire execution via the `context` parameter!

---

This is now a complete, production-ready setup with proper documentation and Mustache integration. Run `npm install` and `npm run dev` to test!
