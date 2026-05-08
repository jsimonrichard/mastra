import { Skeleton, Txt } from '@mastra/playground-ui';
import type { StorageThreadType } from '@mastra/core/memory';
import { MessageSquareText } from 'lucide-react';
import { useWorkflowRunAgentConversations } from '../hooks/use-workflow-run-agent-conversations';
import { useLinkComponent } from '@/lib/framework';

function threadMeta(thread: StorageThreadType) {
  const m = thread.metadata as Record<string, unknown> | undefined;
  return {
    agentId: typeof m?.mastraAgentId === 'string' ? m.mastraAgentId : '',
    stepId: typeof m?.workflowStepId === 'string' ? m.workflowStepId : '',
  };
}

export function WorkflowRunAgentConversationsPanel({
  workflowId,
  runId,
}: {
  workflowId: string;
  runId?: string;
}) {
  const { Link, paths } = useLinkComponent();
  const { data: threads, isLoading, isError } = useWorkflowRunAgentConversations(workflowId, runId);

  if (!runId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-2 pt-2 border-t border-border1 mt-4">
        <Txt variant="ui-md" className="font-medium">
          Agent conversations
        </Txt>
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (isError || !threads?.length) {
    return null;
  }

  return (
    <div className="space-y-3 pt-4 mt-4 border-t border-border1">
      <div className="flex items-start gap-2">
        <MessageSquareText className="size-4 text-neutral5 shrink-0 mt-0.5" aria-hidden />
        <div>
          <Txt variant="ui-md" className="font-medium">
            Agent conversations
          </Txt>
          <Txt variant="ui-sm" className="text-neutral5">
            Open the same transcripts as agent chat. Shown when workflow steps use{' '}
            <code className="text-neutral4">createStep(agent)</code> and memory is enabled.
          </Txt>
        </div>
      </div>

      <ul className="space-y-2">
        {threads.map(thread => {
          const { agentId, stepId } = threadMeta(thread);
          const label = thread.title?.trim() ? thread.title : stepId || thread.id;
          const to = agentId ? paths.agentThreadLink(agentId, thread.id) : undefined;

          const inner = (
            <>
              <span className="truncate font-medium text-neutral3">{label}</span>
              {stepId && stepId !== label ? (
                <span className="text-neutral5 truncate text-xs block">Step {stepId}</span>
              ) : null}
            </>
          );

          return (
            <li key={thread.id}>
              {to ? (
                <Link
                  to={to}
                  className="block rounded-md border border-border1 bg-surface4/40 px-3 py-2 hover:bg-surface4 transition-colors"
                >
                  {inner}
                </Link>
              ) : (
                <div className="rounded-md border border-border1 bg-surface4/40 px-3 py-2">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
