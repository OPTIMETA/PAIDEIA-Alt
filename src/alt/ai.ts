// AI 어댑터 (plan.md §6.2, §7.3, §8).
// createAltProvider(=createOpenAICompatible 래핑) + generateObject.
// 단 fetch shim은 투명 프록시 → structured output은 상류 모델 supportsTools에 종속.
import { createAltProvider } from "alt-plugin-sdk/ai";
import { alt, hasAltRuntime } from "@/alt/client";
import type { PluginAiModelId, PluginAiModelInfo } from "alt-plugin-sdk";
import { generateObject } from "ai";
import type { ZodType } from "zod";

/**
 * supportsTools 게이트: generateObject는 tool/JSON mode 지원 모델에서만 신뢰 가능.
 * 없으면 호출부가 평문+zod.safeParse fallback으로 분기 (§7.3).
 */
export async function pickStructuredModel(): Promise<PluginAiModelId | null> {
  if (!hasAltRuntime()) return null;
  try {
    const models = await alt.ai.models.list();
    const tooled = models.find((m) => m.supportsTools && m.availability !== "unavailable");
    return tooled?.id ?? models[0]?.id ?? "auto";
  } catch {
    return "auto";
  }
}

/** 구조화 추출 — supportsTools 모델에서 generateObject. */
export async function extractObject<T>(
  schema: ZodType<T>,
  prompt: string,
  modelId: PluginAiModelId,
): Promise<T> {
  const provider = createAltProvider({ model: modelId });
  const { object } = await generateObject({
    model: provider.languageModel(modelId),
    schema,
    prompt,
  });
  return object;
}

/** Phase 0 런타임 스파이크 (plan.md §10) — Alt 안에서만 의미 있음. */
export async function runtimeSpike(): Promise<{
  models: PluginAiModelInfo[];
  structuredModel: string | null;
}> {
  const models = hasAltRuntime() ? await alt.ai.models.list() : [];
  const structuredModel = await pickStructuredModel();
  return { models, structuredModel };
}
