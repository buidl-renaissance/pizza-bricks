import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import type { GeneratedFile } from './site-generator';
import { recordAgenticCost } from './agentic-cost';

const GeneratedFileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

const EditedFilesSchema = z.object({
  files: z.array(GeneratedFileSchema),
});

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*\n?/m, '')
    .replace(/\n?```\s*$/m, '')
    .trim();
}

function parseEditedFiles(rawText: string): GeneratedFile[] {
  const cleaned = stripMarkdownFences(rawText);
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('Site editor: no JSON object found in response');
  }
  const jsonStr = cleaned.slice(firstBrace, lastBrace + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Site editor: failed to parse JSON — ${e}`);
  }
  const { files } = EditedFilesSchema.parse(parsed);
  return files;
}

const SYSTEM_PROMPT = `You are an expert at editing Next.js + Tailwind CSS food business marketing sites.

Given the current source files and a user request, apply the requested changes and return ONLY the modified files as JSON.

CRITICAL OUTPUT REQUIREMENT: Return ONLY valid JSON. No markdown fences, no code blocks, no explanation, no preamble. Start with { and end with }.

Required JSON structure:
{
  "files": [
    { "path": "path/to/file.tsx", "content": "full file content..." },
    ...
  ]
}

Rules:
- Include ONLY files you modified. Do not include unchanged files.
- Preserve all existing files not touched by the edit — they will remain as-is.
- Keep the same file structure: Next.js 14, Tailwind CSS, TypeScript.
- Maintain JSX rules: single root element per return, wrap siblings in <>...</>
- Ensure valid TypeScript and proper escaping in JSON (\\n for newlines, \\" for quotes).`;

/**
 * Apply user prompt as edits to the given site files. Returns the full file set
 * (original with modified files overwritten).
 * @param siteId - Optional generated_site id for cost attribution
 */
export async function applySiteEdits(
  files: GeneratedFile[],
  prompt: string,
  siteId?: string
): Promise<GeneratedFile[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = 'claude-sonnet-4-20250514';
  const filesJson = JSON.stringify(
    files.map((f) => ({ path: f.path, content: f.content })),
    null,
    2
  );
  const userMessage = `Current site files:\n\n${filesJson}\n\nUser request: ${prompt}\n\nReturn the modified files as JSON. Include only files you changed.`;

  const response = await client.messages.create({
    model,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const inputTokens = response.usage?.input_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  if (inputTokens > 0 || outputTokens > 0) {
    recordAgenticCost({
      operation: 'site_edit',
      entityType: siteId ? 'generated_site' : undefined,
      entityId: siteId,
      model,
      inputTokens,
      outputTokens,
    }).catch((err) => console.error('[site-editor] recordAgenticCost failed:', err));
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Site editor: no text block in response');
  }

  const modified = parseEditedFiles(textBlock.text);
  const merged = new Map(files.map((f) => [f.path, f]));
  for (const m of modified) {
    merged.set(m.path, m);
  }
  return Array.from(merged.values());
}
