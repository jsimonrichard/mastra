---
'@internal/playground': patch
---

Workflow graph nodes for embedded agent steps (**Open chat**, **Preview**) open the workflow-scoped transcript on the agent page or in an inline dialog using the same chat UI as the agent screen.

The workflow run **Agent conversations** list orders transcripts by each step’s `startedAt` from the active run (falling back to thread timestamps when needed), so execution order is preserved even when titles update storage timestamps. Long titles truncate with an ellipsis.
