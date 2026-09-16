// services/ragService.ts

import type { GeneratedPlan, LessonActivity } from "@/pages/lesson/types/lessonPlan";

// ===============================
// 🔧 CONFIG
// ===============================
type Provider = "openai" | "groq" | "anthropic" | "gemini";

interface LLMConfig {
  provider: Provider;
  model: string;
}

// 👉 modelo padrão (troque dinamicamente se quiser)
const DEFAULT_MODEL: LLMConfig = {
  provider: "openai",
  model: "gpt-4o-mini",
};

// ===============================
// 🔥 CALL LLM
// ===============================
async function callLLM(prompt: string, config: LLMConfig) {
  switch (config.provider) {
    case "openai":
      return callOpenAI(prompt, config);
    case "groq":
      return callGroq(prompt, config);
    case "anthropic":
      return callClaude(prompt, config);
    case "gemini":
      return callGemini(prompt, config);
    default:
      throw new Error("Provider inválido");
  }
}

// ===============================
// PROVIDERS
// ===============================

async function callOpenAI(prompt: string, config: LLMConfig) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: "Responda SOMENTE em JSON válido." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGroq(prompt: string, config: LLMConfig) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callClaude(prompt: string, config: LLMConfig) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function callGemini(prompt: string, config: LLMConfig) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${config.model}:generateContent?key=${import.meta.env.VITE_GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ===============================
// 🛠 JSON SAFE
// ===============================
function safeParse<T>(raw: string): T {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    return JSON.parse(raw.slice(start, end + 1));
  }
}

// ===============================
// 🎓 GENERATE PLAN
// ===============================
export async function generateLessonPlan(params: {
  discipline: string;
  course: string;
  workload: string;
  totalLessons: number;
  lessonDuration: string;
  ementa: string;
  objetivoGeral: string;
  modelConfig?: LLMConfig;
}): Promise<GeneratedPlan> {
  const config = params.modelConfig || DEFAULT_MODEL;

  const prompt = `
RESPONDA SOMENTE EM JSON VÁLIDO.

Crie um plano de ensino.

DISCIPLINA: ${params.discipline}
CURSO: ${params.course}
TOTAL DE AULAS: ${params.totalLessons}

EMENTA:
${params.ementa}

OBJETIVO:
${params.objetivoGeral}

FORMATO:
{
 "syllabus": "",
 "general_objective": "",
 "specific_objectives": [],
 "methodology": "",
 "assessment": "",
 "lessons":[
  {
   "lesson_order":1,
   "title":"",
   "specific_objectives":[],
   "content":"",
   "methodology":"",
   "assessment":""
  }
 ]
}
`;

  const raw = await callLLM(prompt, config);
  return safeParse<GeneratedPlan>(raw);
}

// ===============================
// 🔁 REGENERATE
// ===============================
export async function regenerateLesson(params: {
  discipline: string;
  lessonOrder: number;
  totalLessons: number;
  ementa: string;
  objetivoGeral: string;
  modelConfig?: LLMConfig;
}) {
  const config = params.modelConfig || DEFAULT_MODEL;

  const prompt = `
Gere UMA aula em JSON.

Aula ${params.lessonOrder} de ${params.totalLessons}
Disciplina: ${params.discipline}
`;

  const raw = await callLLM(prompt, config);
  return safeParse(raw);
}

// ===============================
// 🧪 ACTIVITY
// ===============================
export async function generateActivity(params: {
  assessment: string;
  methodology: string;
  specificObjectives: string[];
  modelConfig?: LLMConfig;
}): Promise<LessonActivity> {
  const config = params.modelConfig || DEFAULT_MODEL;

  const prompt = `
Crie atividade avaliativa em JSON.

Objetivos: ${params.specificObjectives.join(", ")}
`;

  const raw = await callLLM(prompt, config);
  return safeParse<LessonActivity>(raw);
}