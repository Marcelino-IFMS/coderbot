import { pb } from "@/lib/pocketbase";
import type { LessonPlanRecord, LessonRecord, Lesson } from "@/types/lessonPlan";

const PB_URL = import.meta.env.VITE_POCKETBASE_URL || "http://127.0.0.1:8090";

async function pbFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${PB_URL}/api/collections${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("PocketBase error:", error);
    throw new Error(`PocketBase error (${res.status}): ${error}`);
  }

  return res.json();
}

export async function saveLessonPlan(
  plan: LessonPlanRecord,
  lessons: Lesson[]
): Promise<{ planId: string; lessonIds: string[] }> {

  try {

    console.log("📦 Plano recebido:", plan);
    console.log("📚 Aulas recebidas:", lessons);

    // -----------------------------
    // 1️⃣ CRIAR PLANO
    // -----------------------------
    const createdPlan = await pbFetch<{ id: string }>("/lesson_plans/records", {
      method: "POST",
      body: JSON.stringify(plan),
    });

    console.log("✅ Plano criado:", createdPlan.id);

    const activeLessons = lessons.filter((l) => !l.isDeleted);
    const lessonIds: string[] = [];

    // -----------------------------
    // 2️⃣ BUSCAR TURMA
    // -----------------------------
    let classId: string | null = null;

    try {

      const classRecord = await pb.collection("classes").getFirstListItem(
        `code="${plan.course}" || name="${plan.course}"`
      );

      classId = classRecord.id;

      console.log("🏫 Turma encontrada:", classId);

    } catch (error) {

      console.warn("⚠️ Turma não encontrada para:", plan.course);

    }

    // -----------------------------
    // 3️⃣ CRIAR AULAS
    // -----------------------------
    for (const lesson of activeLessons) {

      const lessonRecord: LessonRecord = {
        lesson_order: lesson.lesson_order,
        lesson_plan_id: createdPlan.id,
        title: lesson.title,
        specific_objectives: lesson.specific_objectives,
        content: lesson.content,
        methodology: lesson.methodology,
        assessment: lesson.assessment,
      };

      const createdLesson = await pbFetch<{ id: string }>("/lessons/records", {
        method: "POST",
        body: JSON.stringify(lessonRecord),
      });

      lessonIds.push(createdLesson.id);

      console.log("📚 Aula criada:", createdLesson.id);

      // -----------------------------
      // 4️⃣ CRIAR ATIVIDADE
      // -----------------------------
      if (lesson.activity && classId) {

        const activity = lesson.activity;

        const evaluationCriteria = Array.isArray(activity.evaluation_criteria)
          ? activity.evaluation_criteria.join("\n")
          : activity.evaluation_criteria || "";

        const instructions = `
${activity.description || ""}

${activity.instructions || ""}

Critérios de avaliação:
${evaluationCriteria}
`;

        const activityData = {

          title: activity.activity_title || "Atividade",

          instructions: instructions,

          points: 0,

          dueDate: null,

          topic: plan.discipline,

          class: [classId], // relation correta

          status: "em andamento",

          submittedCount: 0,

          totalStudents: activity.totalStudents || 0,

          attachment: null
        };

        console.log("📝 Criando atividade:", activityData);

        const newActivity = await pb.collection("activities").create(activityData);

        console.log("✅ Atividade criada:", newActivity.id);
      }
    }

    // -----------------------------
    // FINAL
    // -----------------------------
    return {
      planId: createdPlan.id,
      lessonIds,
    };

  } catch (error) {

    console.error("❌ Erro ao salvar plano:", error);
    throw error;

  }
}