/**
 * Shared helpers for the MCP tool modules.
 *
 * Every plain tool returns its payload as a single JSON text block; `_app`
 * tools additionally return a `createUIResource(...)` object alongside it.
 */
export const text = (value: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
})
