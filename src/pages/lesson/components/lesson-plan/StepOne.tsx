import { useState } from "react";
import { BookOpen, GraduationCap, Clock, FileText, Target, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { LessonPlanFormData } from "@/pages/lesson/types/lessonPlan";

interface StepOneProps {
  onSubmit: (data: LessonPlanFormData) => void;
  isLoading: boolean;
}

const StepOne = ({ onSubmit, isLoading }: StepOneProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [discipline, setDiscipline] = useState("");
  const [course, setCourse] = useState("");
  const [workload, setWorkload] = useState("");
  const [quantidadeAulas, setQuantidadeAulas] = useState("");
  const [duracaoAula, setDuracaoAula] = useState("");
  const [ementa, setEmenta] = useState("");
  const [objetivoGeral, setObjetivoGeral] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ file, discipline, course, workload, quantidadeAulas, duracaoAula, ementa, objetivoGeral });
  };

  const isValid = discipline && course && workload && quantidadeAulas && duracaoAula && ementa && objetivoGeral;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <div className="glass-card rounded-lg p-6 space-y-5">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          Dados do Plano de Aulas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discipline" className="flex items-center gap-1.5 text-sm font-semibold">
              <BookOpen className="w-3.5 h-3.5" /> Disciplina
            </Label>
            <Input id="discipline" value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="Ex: Engenharia de Software" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="course" className="flex items-center gap-1.5 text-sm font-semibold">
              <GraduationCap className="w-3.5 h-3.5" /> Curso
            </Label>
            <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Ex: Ciência da Computação" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="workload" className="flex items-center gap-1.5 text-sm font-semibold">
              <Clock className="w-3.5 h-3.5" /> Carga Horária
            </Label>
            <Input id="workload" value={workload} onChange={(e) => setWorkload(e.target.value)} placeholder="Ex: 60h" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qtdAulas" className="flex items-center gap-1.5 text-sm font-semibold">
              <FileText className="w-3.5 h-3.5" /> Quantidade de Aulas
            </Label>
            <Input id="qtdAulas" type="number" min="1" max="50" value={quantidadeAulas} onChange={(e) => setQuantidadeAulas(e.target.value)} placeholder="Ex: 15" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duracao" className="flex items-center gap-1.5 text-sm font-semibold">
              <Clock className="w-3.5 h-3.5" /> Duração da Aula
            </Label>
            <Input id="duracao" value={duracaoAula} onChange={(e) => setDuracaoAula(e.target.value)} placeholder="Ex: 2h" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ementa" className="flex items-center gap-1.5 text-sm font-semibold">
            <FileText className="w-3.5 h-3.5" /> Ementa
          </Label>
          <Textarea id="ementa" value={ementa} onChange={(e) => setEmenta(e.target.value)} placeholder="Descreva a ementa da disciplina..." rows={3} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="objetivo" className="flex items-center gap-1.5 text-sm font-semibold">
            <Target className="w-3.5 h-3.5" /> Objetivo Geral
          </Label>
          <Textarea id="objetivo" value={objetivoGeral} onChange={(e) => setObjetivoGeral(e.target.value)} placeholder="Descreva o objetivo geral da disciplina..." rows={3} />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5 text-sm font-semibold">
            <Upload className="w-3.5 h-3.5" /> Arquivo de Apoio (opcional)
          </Label>
          <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              className="hidden"
              id="fileUpload"
              accept=".txt,.pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="fileUpload" className="cursor-pointer text-sm text-muted-foreground">
              {file ? (
                <span className="text-primary font-medium">{file.name}</span>
              ) : (
                "Clique para enviar um arquivo"
              )}
            </label>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full h-12 text-base font-bold gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Gerando Plano com IA...
          </span>
        ) : (
          "🚀 Gerar Plano de Aulas"
        )}
      </Button>
    </form>
  );
};

export default StepOne;
