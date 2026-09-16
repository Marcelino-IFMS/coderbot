import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type {
  LessonPlanFormData,
  GeneratedPlan,
  Lesson,
  LessonActivity,
} from "@/pages/lesson/types/lessonPlan";
import {
  generateLessonPlan,
  regenerateLesson,
  generateActivity,
} from "@/pages/lesson/services/ragService";
import { saveLessonPlan } from "@/pages/lesson/services/pocketbaseService";
import StepIndicator from "@/pages/lesson/components/lesson-plan/StepIndicator";
import StepOne from "@/pages/lesson/components/lesson-plan/StepOne";
import GeneratingOverlay from "@/pages/lesson/components/lesson-plan/GeneratingOverlay";
import LessonCard from "@/pages/lesson/components/lesson-plan/LessonCard";
import { Button } from "@/pages/lesson/components/ui/button";
import { Save, ArrowLeft, BookOpen } from "lucide-react";

type ModelConfig = {
  provider: "openai" | "groq" | "anthropic" | "gemini";
  model: string;
};

const MODEL_OPTIONS: Record<string, ModelConfig> = {
  openai: { provider: "openai", model: "gpt-4o-mini" },
  groq: { provider: "groq", model: "mixtral-8x7b-32768" },
  claude: { provider: "anthropic", model: "claude-3-haiku-20240307" },
  gemini: { provider: "gemini", model: "gemini-1.5-flash" },
};

const CreateLessonPlan = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<LessonPlanFormData | null>(null);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(
    null,
  );
  const [activityIndex, setActivityIndex] = useState<number | null>(null);

  const [modelConfig, setModelConfig] = useState<ModelConfig>(
    MODEL_OPTIONS.openai,
  );

  const handleFormSubmit = useCallback(
    async (data: LessonPlanFormData) => {
      setFormData(data);
      setCurrentStep(2);
      setIsGenerating(true);

      try {
        let fileContent: string | undefined;
        if (data.file) {
          fileContent = await data.file.text();
        }

        const result = await generateLessonPlan({
          discipline: data.discipline,
          course: data.course,
          workload: data.workload,
          totalLessons: parseInt(data.quantidadeAulas),
          lessonDuration: data.duracaoAula,
          ementa: data.ementa,
          objetivoGeral: data.objetivoGeral,
          fileContent,
        });

        setPlan(result);
        setLessons(result.lessons.map((l) => ({ ...l, isDeleted: false })));
        setCurrentStep(3);
        toast({
          title: "✅ Plano gerado!",
          description: `${result.lessons.length} aulas criadas com sucesso.`,
        });
      } catch (error) {
        toast({
          title: "Erro ao gerar plano",
          description:
            error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
        setCurrentStep(1);
      } finally {
        setIsGenerating(false);
      }
    },
    [toast],
  );

  const handleUpdateLesson = useCallback((index: number, updated: Lesson) => {
    setLessons((prev) => prev.map((l, i) => (i === index ? updated : l)));
  }, []);

  const handleDeleteLesson = useCallback(
    (index: number) => {
      setLessons((prev) =>
        prev.map((l, i) => (i === index ? { ...l, isDeleted: true } : l)),
      );
      toast({
        title: "Aula removida",
        description: "A aula foi marcada para exclusão.",
      });
    },
    [toast],
  );

  const handleRegenerate = useCallback(
    async (index: number) => {
      if (!formData) return;
      setRegeneratingIndex(index);
      try {
        const newLesson = await regenerateLesson({
          discipline: formData.discipline,
          lessonOrder: lessons[index].lesson_order,
          totalLessons: parseInt(formData.quantidadeAulas),
          ementa: formData.ementa,
          objetivoGeral: formData.objetivoGeral,
        });
        setLessons((prev) =>
          prev.map((l, i) =>
            i === index ? { ...newLesson, isDeleted: false } : l,
          ),
        );
        toast({
          title: "Aula regenerada!",
          description: `Aula ${newLesson.lesson_order} atualizada.`,
        });
      } catch (error) {
        toast({
          title: "Erro ao regenerar",
          description:
            error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      } finally {
        setRegeneratingIndex(null);
      }
    },
    [formData, lessons, toast],
  );

  const handleGenerateActivity = useCallback(
    async (index: number) => {
      setActivityIndex(index);
      const lesson = lessons[index];
      try {
        const activity = await generateActivity({
          assessment: lesson.assessment,
          methodology: lesson.methodology,
          specificObjectives: lesson.specific_objectives,
        });
        setLessons((prev) =>
          prev.map((l, i) => (i === index ? { ...l, activity } : l)),
        );
        toast({
          title: "Atividade gerada!",
          description: `Atividade criada para a Aula ${lesson.lesson_order}.`,
        });
      } catch (error) {
        toast({
          title: "Erro ao gerar atividade",
          description:
            error instanceof Error ? error.message : "Erro desconhecido",
          variant: "destructive",
        });
      } finally {
        setActivityIndex(null);
      }
    },
    [lessons, toast],
  );

  const handleSave = useCallback(async () => {
    if (!formData || !plan) return;
    setIsSaving(true);
    setCurrentStep(4);

    try {
      await saveLessonPlan(
        {
          discipline: formData.discipline,
          course: formData.course,
          workload: formData.workload,
          total_lessons: parseInt(formData.quantidadeAulas),
          lesson_duration: formData.duracaoAula,
          syllabus: plan.syllabus,
          general_objective: plan.general_objective,
          status: "draft",
        },
        lessons,
      );

      toast({
        title: "🎉 Plano salvo!",
        description: "O plano de aulas foi salvo com sucesso no PocketBase.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      setCurrentStep(3);
    } finally {
      setIsSaving(false);
    }
  }, [formData, plan, lessons, toast]);

  const activeLessons = lessons.filter((l) => !l.isDeleted);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-green gradient-primary">
        <div className="container max-w-4xl py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-primary-foreground tracking-tight">
                Plano de Aulas Inteligente
              </h1>
              <p className="text-xs text-primary-foreground/70">
                Criação assistida por IA
              </p>
            </div>
          </div>
        </div>
      </header>
    
      {/* Stepper */}
      <div className="container max-w-4xl">
        <StepIndicator currentStep={currentStep} />
      </div>


      {/* Content */}
      <main className="container max-w-4xl pb-32">
        {/* 🔥 HEADER + SELETOR DE MODELO */}
<div className="glass-card rounded-xl p-4 flex flex-col gap-4">

  {/* Linha superior */}
  <div className="flex items-center justify-between flex-wrap gap-3">
    <h2 className="text-lg font-bold text-foreground">
      ⚙️ Configuração da IA
    </h2>

    {/* Badge do modelo ativo */}
    <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
      {modelConfig.provider} • {modelConfig.model}
    </span>
  </div>

  {/* Select + descrição */}
  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">

    <select
      value={Object.keys(MODEL_OPTIONS).find(
        (key) =>
          MODEL_OPTIONS[key].model === modelConfig.model &&
          MODEL_OPTIONS[key].provider === modelConfig.provider
      )}
      className="border border-border px-4 py-2 rounded-lg bg-background text-sm shadow-sm hover:border-primary transition"
      onChange={(e) => {
        const selected = MODEL_OPTIONS[e.target.value];
        setModelConfig(selected);

        toast({
          title: "Modelo alterado",
          description: `${selected.provider} • ${selected.model}`,
        });
      }}
    >
      <option value="openai">🧠 GPT (OpenAI)</option>
      <option value="claude">📚 Claude (Anthropic)</option>
      <option value="groq">⚡ Groq (Ultra rápido)</option>
      <option value="gemini">🌐 Gemini (Google)</option>
    </select>

    {/* Descrição dinâmica */}
    <p className="text-xs text-muted-foreground">
      {modelConfig.provider === "openai" && "Melhor equilíbrio geral"}
      {modelConfig.provider === "claude" && "Melhor para textos educacionais"}
      {modelConfig.provider === "groq" && "Extremamente rápido"}
      {modelConfig.provider === "gemini" && "Bom com contexto longo"}
    </p>
  </div>

</div>
        {/* Step 1: Form */}
        {currentStep === 1 && (
          <StepOne onSubmit={handleFormSubmit} isLoading={isGenerating} />
        )}

        {/* Step 2: Generating */}
        {currentStep === 2 && isGenerating && <GeneratingOverlay />}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            {/* Plan Summary */}
            {plan && (
              <div className="glass-card rounded-lg p-5 space-y-3">
                <h2 className="font-bold text-foreground text-lg">
                  📋 Resumo do Plano
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Ementa
                    </span>
                    <p className="text-foreground mt-0.5">{plan.syllabus}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Objetivo Geral
                    </span>
                    <p className="text-foreground mt-0.5">
                      {plan.general_objective}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Metodologia
                    </span>
                    <p className="text-foreground mt-0.5">{plan.methodology}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Avaliação
                    </span>
                    <p className="text-foreground mt-0.5">{plan.assessment}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Lessons Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-foreground text-lg">
                📚 Aulas ({activeLessons.length})
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar
              </Button>
            </div>

            {/* Lesson Cards */}
            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <LessonCard
                  key={`${lesson.lesson_order}-${index}`}
                  lesson={lesson}
                  onUpdate={(updated) => handleUpdateLesson(index, updated)}
                  onDelete={() => handleDeleteLesson(index)}
                  onRegenerate={() => handleRegenerate(index)}
                  onGenerateActivity={() => handleGenerateActivity(index)}
                  isRegenerating={regeneratingIndex === index}
                  isGeneratingActivity={activityIndex === index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Saving */}
        {currentStep === 4 && isSaving && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center shadow-lg">
              <Save className="w-8 h-8 text-success-foreground animate-pulse-soft" />
            </div>
            <h3 className="text-xl font-bold text-foreground mt-6">
              Salvando no PocketBase...
            </h3>
          </div>
        )}

        {currentStep === 4 && !isSaving && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold text-foreground">
              Plano Salvo com Sucesso!
            </h3>
            <p className="text-muted-foreground mt-2">
              Todas as aulas foram salvas no PocketBase.
            </p>
            <Button
              className="mt-6 gradient-primary text-primary-foreground"
              onClick={() => {
                setCurrentStep(1);
                setPlan(null);
                setLessons([]);
                setFormData(null);
              }}
            >
              Criar Novo Plano
            </Button>
          </div>
        )}
      </main>

      {/* Floating Save Button */}
      {currentStep === 3 && activeLessons.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border p-4">
          <div className="container max-w-4xl flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {activeLessons.length} aula(s) prontas para salvar
            </span>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="gradient-primary text-primary-foreground font-bold px-8"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Plano Completo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateLessonPlan;
