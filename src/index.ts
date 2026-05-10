#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DOCUMENT_TYPES = [
  "PASSPORT",
  "ID_CARD",
  "DRIVER_LICENSE",
  "RESIDENT",
] as const;
const DOCUMENT_ASSET_TYPES = ["FRONT", "BACK", "FULL", "SELFIE", "OTHER"] as const;

const env = readEnvironment();
const server = new McpServer({
  name: "doc-sample-api",
  version: "0.1.0",
});

server.registerTool(
  "list_documents",
  {
    title: "List documents",
    description:
      "List document summaries by ISO alpha-2 country code and document type.",
    inputSchema: {
      country: z
        .string()
        .min(2)
        .max(2)
        .describe("ISO 3166-1 alpha-2 country code, for example ES or DE."),
      type: z.enum(DOCUMENT_TYPES).describe("Document type."),
    },
  },
  async ({ country, type }) => {
    const payload = await requestJson(
      `/api/v1/documents/${encodeURIComponent(country.toUpperCase())}/${type}`,
      "GET",
    );

    return asJsonContent(payload);
  },
);

server.registerTool(
  "get_document",
  {
    title: "Get document",
    description:
      "Get one document and its files as base64 by country, type, and numeric id.",
    inputSchema: {
      country: z
        .string()
        .min(2)
        .max(2)
        .describe("ISO 3166-1 alpha-2 country code, for example ES or DE."),
      type: z.enum(DOCUMENT_TYPES).describe("Document type."),
      id: z.number().int().positive().describe("Document id."),
    },
  },
  async ({ country, type, id }) => {
    const payload = await requestJson(
      `/api/v1/documents/${encodeURIComponent(country.toUpperCase())}/${type}/${id}`,
      "GET",
    );

    return asJsonContent(payload);
  },
);

server.registerTool(
  "create_document",
  {
    title: "Create document",
    description:
      "Create a document using base64 files. Requires an API key with document:create permission.",
    inputSchema: {
      countryCode: z
        .string()
        .min(2)
        .max(2)
        .describe("ISO 3166-1 alpha-2 country code, for example ES or DE."),
      type: z.enum(DOCUMENT_TYPES).describe("Document type."),
      name: z.string().min(2).describe("Document display name."),
      year: z.number().int().min(1900).max(2100).describe("Document year."),
      files: z
        .array(
          z.object({
            assetType: z.enum(DOCUMENT_ASSET_TYPES),
            mimeType: z
              .string()
              .min(1)
              .describe("Image MIME type, for example image/jpeg."),
            content: z
              .string()
              .min(1)
              .describe("Raw base64 content without a data: prefix."),
          }),
        )
        .min(1)
        .describe("Document files in base64."),
    },
  },
  async (input) => {
    const payload = await requestJson("/api/v1/documents", "POST", {
      countryCode: input.countryCode.toUpperCase(),
      type: input.type,
      name: input.name,
      year: input.year,
      files: input.files,
    });

    return asJsonContent(payload);
  },
);

server.registerResource(
  "api-configuration",
  "doc-sample://configuration",
  {
    title: "DocSample API configuration",
    description: "Current DocSample API base URL used by this MCP server.",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            baseUrl: env.baseUrl,
            availableDocumentTypes: DOCUMENT_TYPES,
            availableAssetTypes: DOCUMENT_ASSET_TYPES,
          },
          null,
          2,
        ),
      },
    ],
  }),
);

const transport = new StdioServerTransport();
await server.connect(transport);

function readEnvironment(): { baseUrl: string; apiKey: string } {
  const baseUrl = process.env.DOC_SAMPLE_BASE_URL?.replace(/\/+$/, "");
  const apiKey = process.env.DOC_SAMPLE_API_KEY;

  if (!baseUrl) {
    throw new Error("DOC_SAMPLE_BASE_URL is required");
  }
  if (!apiKey) {
    throw new Error("DOC_SAMPLE_API_KEY is required");
  }

  return { baseUrl, apiKey };
}

async function requestJson(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
): Promise<unknown> {
  const response = await fetch(`${env.baseUrl}${path}`, {
    method,
    headers: {
      "x-api-key": env.apiKey,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const payload = parseJson(text);

  if (!response.ok) {
    throw new Error(
      `DocSample API returned ${response.status}: ${formatErrorPayload(payload, text)}`,
    );
  }

  return payload;
}

function parseJson(text: string): unknown {
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function formatErrorPayload(payload: unknown, rawText: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return rawText || "Request failed";
}

function asJsonContent(payload: unknown): {
  content: Array<{ type: "text"; text: string }>;
} {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}
