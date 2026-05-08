---
'@internal/playground': patch
---

Kitchen-sink optional live OpenAI uses the budget default `gpt-5-nano` (not `gpt-4o`). Without `OPENAI_API_KEY`, deterministic mocks and CI stay unchanged.

The `workflow-agent-demo` kitchen-sink workflow uses a refinement loop and a conditional branch between two agents so Studio can exercise iterate + branch flows with minimal extra steps.
