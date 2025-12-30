import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import z, { success } from "zod";
import Mustache from "mustache";
import type { NodeDefinitionMeta } from "./NodeDefinitionMeta";
import { createNodePropsSchema } from "../lib/schemaBuilder";

/**
 * APINode - Makes HTTP requests with full configurability
 *
 * Features:
 * - Supports all HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Dynamic URL templating using Mustache with edge-scoped variables
 * - Headers support (static from props, dynamic from inputs)
 * - Body support for POST/PUT/PATCH
 * - Automatic JSON serialization
 * - Error handling with detailed logging
 *
 * Props configuration:
 * - method: HTTP method (default: "GET")
 * - url: URL template with Mustache syntax (e.g., "https://api.com?city={{e1.city}}")
 * - headers: Static headers object
 * - body: Static request body (for POST/PUT/PATCH)
 *
 * Input expectations:
 * - url: Direct URL string (if props.url not provided)
 * - headers: Additional headers to merge
 * - body: Request body data
 */

// Single source of truth: Zod schema + UI metadata
const { zodSchema: APINodePropsSchema, jsonSchema: APINodeUISchema } =
  createNodePropsSchema({
    schema: z.object({
      method: z.enum(["GET", "POST", "PUT", "DELETE"]),
      url: z.string(),
      headers: z.record(z.string(), z.string()).optional(),
      body: z.any().optional(),
    }),
    ui: {
      method: {
        showOnNode: true,
        colorMap: { GET: "blue", POST: "green", PUT: "amber", DELETE: "red" },
      },
      url: { showOnNode: true },
      // headers: not shown on node (too complex)
    },
    conditionals: [
      {
        if: { field: "method", values: ["POST", "PUT", "DELETE"] },
        then: { show: { body: { type: "string", title: "Request Body" } } },
      },
    ],
    required: ["method", "url"],
  });

export const APINodeMeta: NodeDefinitionMeta = {
  type: "api",
  label: "API Call",
  description: "Make HTTP requests to external APIs",
  category: "action",
  icon: "Globe",
  color: "blue",
  propsSchema: APINodeUISchema,
  defaultProps: {
    method: "GET",
    url: "",
  },
  validationRules: [
    { field: "url", type: "required", message: "URL is required" },
    {
      field: "url",
      type: "pattern",
      value: "^https?://",
      message: "Must be a valid URL",
    },
  ],
  visualConfig: {
    handles: { inputs: true, outputs: true },
  },
};

export type APINodeProps = z.infer<typeof APINodePropsSchema>;

export class APINode extends Node<APINodeProps> {
  static propsSchema = APINodePropsSchema;
  name = "APINode";

  constructor({
    id,
    label,
    props,
    outputSchema,
  }: {
    id: string;
    label: string;
    props?: APINodeProps;
    outputSchema?: z.ZodTypeAny;
  }) {
    APINodePropsSchema.parse(props);
    super({ id, label, type: "api", props, outputSchema });
    this.description = "Makes HTTP API calls";

    // Only set default output schema if workflow didn't provide one
    if (this.outputSchema === z.any()) {
      this.outputSchema = z
        .object({
          data: z.any(),
        })
        .passthrough(); // Allow additional fields
    }
  }

  async execute(context: ExecutionContext): Promise<void> {
    console.log(`\n🔄 [APINode ${this.label}] Starting execution`);
    console.log("━".repeat(50));

    const inputs = await this.getNodeInputs(context);
    console.log(
      `📥 Input Data:`,
      JSON.stringify(Object.fromEntries(inputs), null, 2),
    );

    const templateModel: Record<string, any> = {};
    inputs.forEach((data, sourceNodeId) => {
      // Find the source node to get its label
      const sourceNode = context.nodes?.get(sourceNodeId);
      if (sourceNode) {
        templateModel[sourceNode.label] = data;
      }
    });

    const method = (this.props.method || "GET").toUpperCase();
    let url = this.props.url;
    if (url) {
      url = Mustache.render(url, templateModel);
    } else {
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
      ((responseData = rawData),
        console.log(`[APINode ${this.label}] Response received`));
    } catch (error) {
      console.error(`[APINode ${this.label}] Error:`, error);
      throw error;
    }

    await this.sendOutput(responseData, context); // Validates before sending!
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
