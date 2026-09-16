import { useState } from "react";
import { Pencil, Trash2, RefreshCw, FileText, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Lesson, LessonActivity } from "@/pages/lesson/types/lessonPlan";
import ActivityDisplay from "./ActivityDisplay";

interface LessonCardProps {
  lesson: Lesson;
  onUpdate: (lesson: Lesson) => void;
  onDelete: () => void;
  onRegenerate: () => void;
  onGenerateActivity: () => void;
  isRegenerating: boolean;
  isGeneratingActivity: boolean;
}

const LessonCard = ({
  lesson,
  onUpdate,
  onDelete,
  onRegenerate,
  onGenerateActivity,
  isRegenerating,
  isGeneratingActivity,
}: LessonCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Lesson>(lesson);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(lesson);
    setIsEditing(false);
  };

  if (lesson.isDeleted) return null;

  return (
    <div className="glass-card rounded-lg overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="gradient-primary px-5 py-3 flex items-center justify-between">
        <span className="text-primary-foreground font-bold text-sm">
          Aula {lesson.lesson_order}
        </span>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <>
              <Button size="sm" variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 h-7 w-7 p-0" onClick={() => { setEditData(lesson); setIsEditing(true); }}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 h-7 w-7 p-0" onClick={onRegenerate} disabled={isRegenerating}>
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              </Button>
              <Button size="sm" variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-destructive/80 h-7 w-7 p-0" onClick={onDelete}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-3">
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Título</Label>
              <Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Objetivos Específicos (um por linha)</Label>
              <Textarea
                value={editData.specific_objectives.join("\n")}
                onChange={(e) => setEditData({ ...editData, specific_objectives: e.target.value.split("\n").filter(Boolean) })}
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Conteúdo</Label>
              <Textarea value={editData.content} onChange={(e) => setEditData({ ...editData, content: e.target.value })} rows={3} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Metodologia</Label>
              <Textarea value={editData.methodology} onChange={(e) => setEditData({ ...editData, methodology: e.target.value })} rows={2} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Avaliação</Label>
              <Textarea value={editData.assessment} onChange={(e) => setEditData({ ...editData, assessment: e.target.value })} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} className="gradient-primary text-primary-foreground">
                <Save className="w-3 h-3 mr-1" /> Salvar
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="w-3 h-3 mr-1" /> Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-bold text-foreground">{lesson.title}</h3>

            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Objetivos</span>
              <ul className="mt-1 space-y-0.5">
                {lesson.specific_objectives.map((obj, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-1.5">
                    <span className="text-accent mt-0.5">•</span> {obj}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conteúdo</span>
              <p className="text-sm text-foreground mt-1">{lesson.content}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Metodologia</span>
                <p className="text-sm text-foreground mt-1">{lesson.methodology}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avaliação</span>
                <p className="text-sm text-foreground mt-1">{lesson.assessment}</p>
              </div>
            </div>

            {/* Activity Button */}
            {!lesson.activity && (
              <Button
                size="sm"
                variant="outline"
                className="border-accent/50 text-accent hover:bg-accent/10"
                onClick={onGenerateActivity}
                disabled={isGeneratingActivity}
              >
                {isGeneratingActivity ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    Gerando...
                  </span>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 mr-1" /> Gerar Atividade
                  </>
                )}
              </Button>
            )}

            {/* Activity Display */}
            {lesson.activity && (
              <ActivityDisplay
                activity={lesson.activity}
                onUpdate={(activity: LessonActivity) => onUpdate({ ...lesson, activity })}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LessonCard;
