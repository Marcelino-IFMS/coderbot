export interface LessonPlanFormData {
  file: File | null;
  discipline: string;
  course: string;
  workload: string;
  quantidadeAulas: string;
  duracaoAula: string;
  ementa: string;
  objetivoGeral: string;
}

export interface LessonActivity {
  activity_title: string;
  description: string;
  instructions: string;
  evaluation_criteria: string[];
}

export interface Lesson {
  lesson_order: number;
  title: string;
  specific_objectives: string[];
  content: string;
  methodology: string;
  assessment: string;
  activity?: LessonActivity | null;
  isDeleted?: boolean;
}

export interface GeneratedPlan {
  syllabus: string;
  general_objective: string;
  specific_objectives: string[];
  methodology: string;
  assessment: string;
  basic_references: string[];
  complementary_references: string[];
  lessons: Lesson[];
}

export interface LessonPlanRecord {
  id?: string;
  discipline: string;
  course: string;
  workload: string;
  total_lessons: number;
  lesson_duration: string;
  syllabus: string;
  general_objective: string;
  status: "draft" | "published";
}

export interface LessonRecord {
  id?: string;
  lesson_order: number;
  lesson_plan_id: string;
  title: string;
  specific_objectives: string[];
  content: string;
  methodology: string;
  assessment: string;
  activity?: LessonActivity | null;
}
