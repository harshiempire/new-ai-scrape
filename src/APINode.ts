import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import z from "zod";
import Mustache from "mustache";

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

// Define schema first
const APINodePropsSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  url: z.string(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
});

type APINodeProps = z.infer<typeof APINodePropsSchema>;

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
          status: z.number().optional(),
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
      JSON.stringify(Object.fromEntries(inputs), null, 2)
    );

    const templateModel: Record<string, any> = {};
    inputs.forEach((data, edgeId) => {
      templateModel[edgeId] = data;
    });

    const method = (this.props.method || "GET").toUpperCase();
    let url: string | undefined = this.props.url;
    console.log(`🛠️ Request Method: ${method}`);

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
