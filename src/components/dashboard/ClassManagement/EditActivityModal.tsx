import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Link2 } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { useToast } from "@/components/ui/use-toast"; // ✅ Import do toast

export function EditActivityModal({ open, onOpenChange, activity, onSave }) {
  const { toast } = useToast(); // ✅ Hook do toast
  const [formData, setFormData] = useState({
    title: "",
    instructions: "",
    points: "",
    dueDate: "",
    topic: "",
    attachment: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");

  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title || "",
        instructions: activity.description || "",
        points: activity.points || "",
        dueDate: activity.dueDate ? activity.dueDate.split("T")[0] : "",
        topic: activity.topic || "",
        attachment: activity.attachment || "",
      });
      setLink(activity.link || "");
    }
  }, [activity]);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleEdit = async () => {
    // ✅ Validação: título obrigatório
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Campo obrigatório",
        description: "O título da atividade é obrigatório.",
      });
      return;
    }

    // ✅ Validação: data/hora não pode ser anterior a agora
    if (formData.dueDate) {
      const now = new Date();
      const due = new Date(formData.dueDate);
      if (due < now) {
        toast({
          variant: "destructive",
          title: "Data inválida",
          description:
            "A data e hora de entrega não podem ser anteriores ao momento atual.",
        });
        return;
      }
    }

    try {
      const dataToUpdate: any = {
        title: formData.title,
        instructions: formData.instructions,
        points: Number(formData.points) || 0,
        dueDate: formData.dueDate || null,
        topic: formData.topic,
      };

      if (link) dataToUpdate.attachment = link;
      if (file) dataToUpdate.file = file;

      const updated = await pb.collection("activities").update(activity.id, dataToUpdate);

      onSave?.(updated);
      onOpenChange(false);

      toast({
        title: "Atividade atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar atividade:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar alterações",
        description: "Não foi possível atualizar a atividade. Tente novamente.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Atividade</DialogTitle>
          <DialogDescription>
            Atualize as informações abaixo e clique em <b>Salvar</b>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Campos principais */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instruções</Label>
            <Textarea
              id="instructions"
              rows={4}
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points">Pontuação</Label>
              <Input
                id="points"
                type="number"
                value={formData.points}
                onChange={(e) =>
                  setFormData({ ...formData, points: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Data e Hora de Entrega</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={
                  formData.dueDate
                    ? new Date(formData.dueDate).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) => {
                  const value = e.target.value
                    ? new Date(e.target.value).toISOString()
                    : "";
                  setFormData({ ...formData, dueDate: value });
                }}
              />
            </div>
          </div>

          {/* Upload e Link */}
          <div className="space-y-2">
            <Label>Anexo (opcional)</Label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer border px-3 py-2 rounded-md text-sm hover:bg-gray-50">
                <Upload className="h-4 w-4" />
                <span>Arquivo</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <div className="flex items-center gap-2 flex-1">
                <Input
                  placeholder="ou insira um link..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
                <Link2 className="h-4 w-4 text-gray-500" />
              </div>
            </div>
            {file && (
              <p className="text-xs text-gray-600">
                Arquivo selecionado: <b>{file.name}</b>
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-black text-white hover:bg-gray-800"
            onClick={handleEdit}
          >
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
