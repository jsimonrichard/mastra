import { test, expect } from '@playwright/test';
import { resetStorage } from '../__utils__/reset-storage';

/**
 * FEATURE: Workflow-scoped agent transcripts in Studio
 * USER STORY: After running a workflow that embeds an agent via createStep(agent), I want Studio to surface the
 * memory thread so I can open the same transcript from the workflow run page.
 * BEHAVIOR UNDER TEST: Completing a kitchen-sink workflow run persists a workflow-linked thread and the UI lists
 * a deep link to /agents/<agentId>/chat/<threadId> for that run.
 */

test.afterEach(async () => {
  await resetStorage();
});

test('workflow run lists agent conversations for sequential and parallel agent stages', async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto('/workflows/workflow-agent-demo/graph');

  await expect(page.locator('h2')).toContainText('workflow-agent-demo');

  const prompt = page.getByRole('textbox', {
    name: /primary question.*refined in a loop/i,
  });
  await expect(prompt).toBeVisible();
  await prompt.fill('What is the weather in Paris?');

  await page.getByRole('button', { name: 'Run' }).click();

  await expect(page.getByRole('button', { name: 'Open Workflow Execution (JSON)' })).toBeVisible({
    timeout: 90_000,
  });

  await expect(page.locator('[data-workflow-node]').first()).toHaveAttribute('data-workflow-step-status', 'success', {
    timeout: 90_000,
  });

  /** Thread ids contain `mastra:wflow:` — encoded links still include the substring `wflow` */
  const transcriptLinks = page.locator('a[href*="/agents/"][href*="/chat/"][href*="wflow"]');
  await expect(transcriptLinks).toHaveCount(4, { timeout: 90_000 });

  const weatherLink = page.locator('a[href*="/agents/weather-agent/chat/"][href*="wflow"]');
  await expect(weatherLink).toBeVisible();

  await weatherLink.click();
  await expect(page).toHaveURL(/\/agents\/weather-agent\/chat\/mastra/);
});
