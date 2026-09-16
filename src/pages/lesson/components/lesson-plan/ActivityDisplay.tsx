import { useState } from "react";
import type { LessonActivity } from "@/pages/lesson/types/lessonPlan";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Save, Pencil } from "lucide-react";

interface ActivityDisplayProps {
  activity: LessonActivity;
  onUpdate: (activity: LessonActivity) => void;
}

const ActivityDisplay = ({ activity, onUpdate }: ActivityDisplayProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<LessonActivity>(activity);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="mt-4 p-4 rounded-lg bg-accent/10 border border-accent/30 space-y-3 animate-fade-in">
        <h4 className="font-bold text-sm text-accent flex items-center gap-1.5">
          ✏️ Editar Atividade
        </h4>
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Título</Label>
          <Input value={editData.activity_title} onChange={(e) => setEditData({ ...editData, activity_title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Descrição</Label>
          <Textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} rows={2} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Instruções</Label>
          <Textarea value={editData.instructions} onChange={(e) => setEditData({ ...editData, instructions: e.target.value })} rows={2} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Critérios de Avaliação (um por linha)</Label>
          <Textarea
            value={editData.evaluation_criteria.join("\n")}
            onChange={(e) => setEditData({ ...editData, evaluation_criteria: e.target.value.split("\n").filter(Boolean) })}
            rows={3}
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="gradient-primary text-primary-foreground">
            <Save className="w-3 h-3 mr-1" /> Salvar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
            <X className="w-3 h-3 mr-1" /> Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-lg bg-accent/10 border border-accent/30 space-y-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm text-accent">📄 {activity.activity_title}</h4>
        <Button size="sm" variant="ghost" onClick={() => { setEditData(activity); setIsEditing(true); }}>
          <Pencil className="w-3 h-3" />
        </Button>
      </div>
      <p className="text-sm text-foreground">{activity.description}</p>
      <div>
        <span className="text-xs font-semibold text-muted-foreground">Instruções:</span>
        <p className="text-sm text-foreground">{activity.instructions}</p>
      </div>
      <div>
        <span className="text-xs font-semibold text-muted-foreground">Critérios:</span>
        <ul className="list-disc list-inside text-sm text-foreground">
          {activity.evaluation_criteria.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ActivityDisplay;
