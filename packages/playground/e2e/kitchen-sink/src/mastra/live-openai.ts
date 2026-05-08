import type { Fixtures } from '../../types';
import { fixtures } from '../../fixtures';

/** Cheap default when `OPENAI_API_KEY` is set (kitchen-sink optional live LLM). */
export const KITCHEN_SINK_LIVE_MODEL = 'openai/gpt-4o-mini' as const;

/**
 * Use a real OpenAI-backed model only when a key is present **and** no deterministic
 * fixture stream was requested via Request Context (preserves Playwright / fixture tests).
 */
export function shouldUseLiveOpenAiWeather(fixtureKey: Fixtures | undefined): boolean {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return false;
  }
  const fixtureData = fixtureKey !== undefined ? fixtures[fixtureKey] : undefined;
  return !fixtureData || fixtureData.length === 0;
}
