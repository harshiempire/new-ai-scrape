import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import z from "zod";
import Mustache from "mustache";
import type { NodeDefinitionMeta } from "./NodeDefinitionMeta";
import { createNodePropsSchema } from "../lib/schemaBuilder";

/**
 * APINode - Makes HTTP requests with full configurability
 *
 * Features:
 * - Supports all HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Dynamic URL templating using Mustache with node-label-scoped variables
 * - Headers support (static from props, dynamic from inputs)
 * - Body support for POST/PUT/PATCH
 * - Automatic JSON serialization
 * - 10s request timeout via AbortController
 *
 * Props configuration:
 * - method: HTTP method (default: "GET")
 * - url: URL template with Mustache syntax (e.g., "https://api.com?city={{Start.city}}")
 * - headers: Static headers object
 * - body: Static request body (for POST/PUT/PATCH)
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

    // Output is the raw response body (JSON or text) — no wrapper
  }

  async execute(context: ExecutionContext): Promise<void> {
    const inputs = await this.getNodeInputs(context);

    const templateModel: Record<string, any> = {};
    inputs.forEach((data, sourceNodeId) => {
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    let responseData: any;
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body || undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("Content-Type") || "";
      responseData = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
    } finally {
      clearTimeout(timeout);
    }

    await this.sendOutput(responseData, context);
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
