# DocSample MCP

MCP server for the DocSample public API. It exposes tools for AI clients to
list, read, and create documents through the existing `/api/v1` endpoints.

Repository: <https://github.com/juan-malonso/doc-sample-mcp>

## Tools

- `list_documents`: list document summaries by `country` and `type`.
- `get_document`: get one document and its base64 files by `country`, `type`, and `id`.
- `create_document`: create a document with base64 files.

## Requirements

- Node.js 20 or newer.
- A DocSample API key with the permissions required by the tools you want to use:
  `document:list`, `document:read`, or `document:create`.

## Install

```bash
git clone https://github.com/juan-malonso/doc-sample-mcp.git
cd doc-sample-mcp
npm install
npm run build
```

## MCP Client Configuration

Register the built server in your MCP client:

```json
{
  "mcpServers": {
    "doc-sample-api": {
      "command": "node",
      "args": ["/absolute/path/to/doc-sample-mcp/dist/index.js"],
      "env": {
        "DOC_SAMPLE_BASE_URL": "https://doc-sample.pages.dev",
        "DOC_SAMPLE_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

For local development:

```json
{
  "mcpServers": {
    "doc-sample-api-local": {
      "command": "node",
      "args": ["/absolute/path/to/doc-sample-mcp/dist/index.js"],
      "env": {
        "DOC_SAMPLE_BASE_URL": "http://localhost:3000",
        "DOC_SAMPLE_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

## Publish To npm

The package is ready to publish if you want one-command installs:

```bash
npm publish --access public
```

After publishing, MCP clients can use `npx`:

```json
{
  "mcpServers": {
    "doc-sample-api": {
      "command": "npx",
      "args": ["-y", "doc-sample-mcp"],
      "env": {
        "DOC_SAMPLE_BASE_URL": "https://doc-sample.pages.dev",
        "DOC_SAMPLE_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```
