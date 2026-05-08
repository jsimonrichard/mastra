import type { StorageThreadType } from '@mastra/core/memory';
import { WORKFLOW_AGENT_INVOCATION_SCOPE } from '@mastra/core/workflows';
import type { WorkflowStateStepResult } from '@mastra/core/workflows';
import { useMastraClient } from '@mastra/react';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useMergedRequestContext } from '@/domains/request-context';

function dateMs(value: Date | string | undefined | null): number | undefined {
  if (value == null) return undefined;
  const n = new Date(value).getTime();
  return Number.isFinite(n) ? n : undefined;
}

function workflowStepIdFromThread(thread: StorageThreadType): string {
  const m = thread.metadata as Record<string, unknown> | undefined;
  return typeof m?.workflowStepId === 'string' ? m.workflowStepId : '';
}

/**
 * Earliest step start in the run (foreach iterations share one logical step — use min `startedAt`).
 * Matches `steps` keys that equal `stepId` or end with `.<stepId>` for nested graphs.
 */
export function stepStartedAtFromRunSteps(
  steps: Record<string, WorkflowStateStepResult> | undefined,
  stepId: string,
): number | undefined {
  if (!stepId || !steps) return undefined;
  let minStart: number | undefined;
  for (const [key, value] of Object.entries(steps)) {
    const matches = key === stepId || key.endsWith(`.${stepId}`);
    if (!matches) continue;
    const arr = Array.isArray(value) ? value : [value];
    for (const entry of arr) {
      const t = entry?.startedAt;
      if (t !== undefined && (minStart === undefined || t < minStart)) {
        minStart = t;
      }
    }
  }
  return minStart;
}

/**
 * Run timeline order: prefer workflow step start times from the active run snapshot (correct when DB
 * timestamps tie or thread titles bump `updatedAt`). Otherwise fall back to `updatedAt`, then `createdAt`.
 * Avoid `id` lexicographic tie-break — agent ids sort alphabetically and mis-order branches vs foreach.
 */
function sortWorkflowRunThreads(
  threads: StorageThreadType[],
  runSteps?: Record<string, WorkflowStateStepResult>,
): StorageThreadType[] {
  return [...threads].sort((a, b) => {
    const stepA = workflowStepIdFromThread(a);
    const stepB = workflowStepIdFromThread(b);
    const startA = stepStartedAtFromRunSteps(runSteps, stepA);
    const startB = stepStartedAtFromRunSteps(runSteps, stepB);
    if (startA !== undefined && startB !== undefined && startA !== startB) {
      return startA - startB;
    }
    if (startA !== undefined && startB === undefined) return -1;
    if (startA === undefined && startB !== undefined) return 1;

    const ua = dateMs(a.updatedAt) ?? dateMs(a.createdAt) ?? 0;
    const ub = dateMs(b.updatedAt) ?? dateMs(b.createdAt) ?? 0;
    if (ua !== ub) return ua - ub;

    const ca = dateMs(a.createdAt) ?? 0;
    const cb = dateMs(b.createdAt) ?? 0;
    if (ca !== cb) return ca - cb;

    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * Lists memory threads produced by agent workflow steps (`createStep(agent)`) during a workflow run.
 *
 * **Metadata filter:** We intentionally match on `workflowRunId` + `scope` only. Thread metadata stores
 * `workflowId` as the workflow definition's `id` from `createWorkflow({ id })`, while Studio URLs use the
 * Mastra registry **key** (the property name in `new Mastra({ workflows: { myKey: wf } })`). Those often
 * differ, so filtering by route `workflowId` would drop valid threads.
 *
 * `workflowId` stays in the React Query cache key so each workflow page keeps separate entries.
 */
export function useWorkflowRunAgentConversations(
  workflowId: string | undefined,
  runId: string | undefined,
  /** Bumps the query cache when the run finishes so we refetch persisted threads */
  runStatus?: string | null,
  /** When present, step `startedAt` values sort transcripts in true run order (not title / DB clock ties). */
  runSteps?: Record<string, WorkflowStateStepResult>,
) {
  const client = useMastraClient();
  const requestContext = useMergedRequestContext();

  const query = useQuery({
    queryKey: ['workflow-run-agent-conversations', workflowId, runId, runStatus, requestContext],
    queryFn: async () => {
      if (!workflowId || !runId) {
        return [];
      }
      const { threads } = await client.listMemoryThreads({
        metadata: {
          workflowRunId: runId,
          scope: WORKFLOW_AGENT_INVOCATION_SCOPE,
        },
        requestContext,
      });
      return threads;
    },
    enabled: Boolean(workflowId && runId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const data = useMemo(() => sortWorkflowRunThreads(query.data ?? [], runSteps), [query.data, runSteps]);

  return { ...query, data };
}
