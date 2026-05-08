---
'@internal/playground': patch
---

Kitchen-sink optional live OpenAI uses the budget default `gpt-5-nano` (not `gpt-4o`). Without `OPENAI_API_KEY`, deterministic mocks and CI stay unchanged.

Set `KITCHEN_SINK_TRACE=1` to enable console tracing (`DefaultExporter`) and info-level logs for debugging hangs.

The `workflow-agent-demo` kitchen-sink workflow uses foreach passes that invoke embedded agents, then a conditional branch — iterations include real agent/memory traffic for Studio transcripts.
