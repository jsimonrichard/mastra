import { DefaultExporter, Observability } from '@mastra/observability';

/**
 * Enable workflow/agent tracing to the console when `KITCHEN_SINK_TRACE=1`.
 * Helps debug hangs (LLM calls, tool runs, nested workflow spans) without DuckDB.
 */
export function createKitchenSinkObservability(): Observability | undefined {
  if (process.env.KITCHEN_SINK_TRACE !== '1') {
    return undefined;
  }

  return new Observability({
    configs: {
      default: {
        serviceName: 'kitchen-sink',
        exporters: [new DefaultExporter()],
      },
    },
  });
}
