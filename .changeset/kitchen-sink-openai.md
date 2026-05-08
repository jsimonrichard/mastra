---
'@internal/playground': patch
---

Kitchen-sink weather agent uses OpenAI when OPENAI_API_KEY is set; deterministic fixtures and CI remain on mocks without a key.

Expanded `workflow-agent-demo` into a multi-step demo with a refinement loop, sequential agent stages, and parallel agents so Studio can exercise multiple workflow-scoped transcripts in one run.
