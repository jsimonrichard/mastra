import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

import { workflowAgentDemoBranchBrief, workflowAgentDemoBranchVerbose } from '../agents';

/**
 * Kitchen-sink workflow for workflow-scoped agent transcripts:
 * - `dountil` refinement loop (iterate)
 * - `.branch` between two `createStep(agent)` arms (branch)
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

const branchBriefStep = createStep(workflowAgentDemoBranchBrief);
const branchVerboseStep = createStep(workflowAgentDemoBranchVerbose);

export const workflowAgentDemoWorkflow = createWorkflow({
  id: 'workflow-agent-demo',
  inputSchema: z.object({
    prompt: z.string().describe('Question refined in a loop, then routed to a brief or verbose agent branch'),
  }),
  outputSchema: z.object({
    text: z.string(),
  }),
})
  .then(normalizePromptStep)
  .then(initIterationStep)
  .dountil(refinePromptLoopStep, async ({ inputData }) => inputData.iteration >= 2)
  .then(stripIterationStep)
  .branch([
    [async ({ inputData }) => inputData.prompt.length < 120, branchBriefStep],
    [async () => true, branchVerboseStep],
  ])
  .map(async ({ inputData }) => {
    const brief = inputData['workflow-agent-demo-brief'] as { text: string } | undefined;
    const verbose = inputData['workflow-agent-demo-verbose'] as { text: string } | undefined;
    const out = brief ?? verbose;
    if (!out) {
      throw new Error('branch produced no agent output');
    }
    return { text: out.text };
  })
  .commit();
