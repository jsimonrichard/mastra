import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import {
  weatherAgent,
  workflowAgentDemoParallelAgentA,
  workflowAgentDemoParallelAgentB,
  workflowAgentDemoSummaryAgent,
} from '../agents';

/**
 * Kitchen-sink workflow that stresses Studio's workflow-scoped agent transcripts:
 * - Plain steps + `dountil` refinement loop (iterations)
 * - Sequential `createStep(agent)` stages (distinct agent ids → distinct threads)
 * - Parallel agent branches (two transcripts for one run)
 *
 * Run with input `{ "prompt": "What is the weather in Paris?" }`.
 */

const normalizePromptStep = createStep({
  id: 'workflow-agent-demo-normalize',
  inputSchema: z.object({
    prompt: z.string(),
  }),
  outputSchema: z.object({
    prompt: z.string(),
  }),
  execute: async ({ inputData }) => ({
    prompt: inputData.prompt.trim(),
  }),
});

const initIterationStep = createStep({
  id: 'workflow-agent-demo-init-iter',
  inputSchema: z.object({
    prompt: z.string(),
  }),
  outputSchema: z.object({
    prompt: z.string(),
    iteration: z.number(),
  }),
  execute: async ({ inputData }) => ({
    prompt: inputData.prompt,
    iteration: 0,
  }),
});

const refinePromptLoopStep = createStep({
  id: 'workflow-agent-demo-refine-loop',
  inputSchema: z.object({
    prompt: z.string(),
    iteration: z.number(),
  }),
  outputSchema: z.object({
    prompt: z.string(),
    iteration: z.number(),
  }),
  execute: async ({ inputData }) => ({
    prompt: `${inputData.prompt} (refinement ${inputData.iteration + 1})`,
    iteration: inputData.iteration + 1,
  }),
});

const stripIterationStep = createStep({
  id: 'workflow-agent-demo-strip-iter',
  inputSchema: z.object({
    prompt: z.string(),
    iteration: z.number(),
  }),
  outputSchema: z.object({
    prompt: z.string(),
  }),
  execute: async ({ inputData }) => ({
    prompt: inputData.prompt,
  }),
});

const bridgeToSummaryStep = createStep({
  id: 'workflow-agent-demo-bridge-summary',
  inputSchema: z.object({
    text: z.string(),
  }),
  outputSchema: z.object({
    prompt: z.string(),
  }),
  execute: async ({ inputData }) => ({
    prompt: `Summarize the following assistant answer in short form:\n\n${inputData.text}`,
  }),
});

const weatherResearchStep = createStep(weatherAgent);
const summaryAgentStep = createStep(workflowAgentDemoSummaryAgent);
const parallelAgentStepA = createStep(workflowAgentDemoParallelAgentA);
const parallelAgentStepB = createStep(workflowAgentDemoParallelAgentB);

export const workflowAgentDemoWorkflow = createWorkflow({
  id: 'workflow-agent-demo',
  inputSchema: z.object({
    prompt: z
      .string()
      .describe('Primary question — refined in a loop, then routed through sequential and parallel agent stages'),
  }),
  outputSchema: z.object({
    text: z.string(),
  }),
})
  .then(normalizePromptStep)
  .then(initIterationStep)
  .dountil(refinePromptLoopStep, async ({ inputData }) => inputData.iteration >= 3)
  .then(stripIterationStep)
  .then(weatherResearchStep)
  .then(bridgeToSummaryStep)
  .then(summaryAgentStep)
  .map(async ({ inputData }) => ({
    prompt: `Parallel review of this summary:\n${inputData.text}`,
  }))
  .parallel([parallelAgentStepA, parallelAgentStepB])
  .map(async ({ inputData }) => {
    const a = inputData['workflow-agent-demo-parallel-a'] as { text: string };
    const b = inputData['workflow-agent-demo-parallel-b'] as { text: string };
    return {
      text: `${a.text}\n---\n${b.text}`,
    };
  })
  .commit();
