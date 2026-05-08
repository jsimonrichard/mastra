import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import { weatherAgent } from '../agents';

/**
 * Minimal workflow that runs the memory-enabled weather agent via `createStep(agent)`.
 * Used to exercise Studio's workflow-scoped agent conversation listing (kitchen-sink / E2E).
 *
 * Run with input `{ "prompt": "What is the weather in Paris?" }` (or any short string).
 */
const weatherAgentStep = createStep(weatherAgent);

export const workflowAgentDemoWorkflow = createWorkflow({
  id: 'workflow-agent-demo',
  inputSchema: z.object({
    prompt: z.string().describe('Prompt forwarded to the embedded weather agent step'),
  }),
  outputSchema: z.object({
    text: z.string(),
  }),
}).then(weatherAgentStep).commit();
