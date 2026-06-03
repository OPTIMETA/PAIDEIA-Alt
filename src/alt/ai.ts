// AI 어댑터 (plan.md §6.2, §7.3, §8).
// 1차: createAltProvider + generateObject (§8.2 정규 레시피).
// 2차 fallback: 모델이 tools/JSON-mode 미지원(supportsTools:false)이거나 generateObject가
//   실패하면 alt.ai.complete 평문 + zod.safeParse 로 복구(§7.3). 둘 다 실패 시 명확히 throw.
import { createAltProvider } from "alt-plugin-sdk/ai";
import { alt, hasAltRuntime } from "@/alt/client";
import type { PluginAiModelId, PluginAiModelInfo } from "alt-plugin-sdk";
import { generateObject } from "ai";
import { z, type ZodType } from "zod";

/** supportsTools 모델 우선 선택. 없으면 첫 모델/auto. (plan §7.3 게이트) */
export async function pickStructuredModel(): Promise<PluginAiModelId | null> {
  if (!hasAltRuntime()) return null;
  try {
    const models = await alt.ai.models.list();
    const tooled = models.filter((m) => m.supportsTools && m.availability !== "unavailable");
    // 수집 속도용: tools 지원 중 더 빠른(소형) 모델 우선 — 추출 정확도엔 충분.
    const fast = /haiku|mini|flash|fast|small|lite|nano|turbo|8b|7b|9b/i;
    const fastModel = tooled.find((m) => fast.test(m.id));
    return fastModel?.id ?? tooled[0]?.id ?? models[0]?.id ?? "auto";
  } catch {
    return "auto";
  }
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** 평문 응답에서 첫 JSON 객체를 추출(코드펜스/잡텍스트 제거). */
function parseJsonLoose(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  const slice = start >= 0 && end > start ? body.slice(start, end + 1) : body;
  return JSON.parse(slice);
}

/** 구조화 추출 — generateObject 우선, 실패 시 complete+zod fallback. */
export async function extractObject<T>(
  schema: ZodType<T>,
  prompt: string,
  modelId: PluginAiModelId,
): Promise<T> {
  // 1) 정규 경로
  try {
    const provider = createAltProvider({ model: modelId });
    const { object } = await generateObject({
      model: provider.languageModel(modelId),
      schema,
      prompt,
    });
    return object;
  } catch (genErr) {
    // 2) fallback: 평문 JSON 요청 → zod 검증
    let jsonSchema = "";
    try {
      jsonSchema = JSON.stringify(z.toJSONSchema(schema));
    } catch {
      /* 스키마 직렬화 실패 시 프롬프트 설명에만 의존 */
    }
    const res = await alt.ai.complete({
      requestId: crypto.randomUUID(),
      model: modelId,
      messages: [
        {
          role: "system",
          content:
            "You output ONLY a single JSON object. No markdown, no code fences, no prose." +
            (jsonSchema ? `\nIt MUST validate against this JSON Schema:\n${jsonSchema}` : ""),
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      maxTokens: 4000,
    });
    let parsedJson: unknown;
    try {
      parsedJson = parseJsonLoose(res.text ?? "");
    } catch (parseErr) {
      throw new Error(
        `AI 구조화 실패 — generateObject: ${errMsg(genErr)} / JSON 파싱: ${errMsg(parseErr)}`,
      );
    }
    const result = schema.safeParse(parsedJson);
    if (result.success) return result.data;
    throw new Error(
      `AI 구조화 실패 — generateObject: ${errMsg(genErr)} / 스키마 위반: ${result.error.message.slice(0, 240)}`,
    );
  }
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
