import { ArrowLeft, FileUp, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EditActivityModal } from "./EditActivityModal";
import { createActivityPB } from "@/services/activity-services";
import { pb } from "@/lib/pocketbase";

const formatDate = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export function ActivityManagement() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activity, setActivity] = useState({
    title: "",
    instructions: "",
    points: "",
    dueDate: "",
    topic: "",
    attachment: null,
    link: "",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const loadActivities = async () => {
    try {
      // 1) Busca as atividades da turma (se isso falhar, abortamos e mantemos o estado anterior)
      const records = await pb.collection("activities").getFullList({
        filter: `class.id='${classId}'`,
        expand: "class",
        sort: "-created",
      });

      // 2) Tenta buscar submissões e matrículas em paralelo, mas sem quebrar tudo se uma falhar
      const [subsRes, enrollRes] = await Promise.allSettled([
        pb.collection("submissions").getFullList({
          filter: `activity.class.id='${classId}'`,
          expand: "activity",
        }),
        pb.collection("class_members").getFullList({
          filter: `class.id='${classId}' && role='student'`,
        }),
      ]);
      // 3) Se alguma chamada falhar, usamos array vazio para não quebrar a montagem
      const allSubmissions =
        subsRes.status === "fulfilled" ? subsRes.value : [];
      const allEnrollments =
        enrollRes.status === "fulfilled" ? enrollRes.value : [];

      // 4) Conta submissões por activity.id
      const submissionCounts: Record<string, number> = {};
      allSubmissions.forEach((s) => {
        // tenta pegar id expandido, senão assume que vem direto em s.activity
        const activityId = s.expand?.activity?.id || s.activity;
        if (!activityId) return;
        submissionCounts[activityId] = (submissionCounts[activityId] || 0) + 1;
      });

      const totalStudents = Array.isArray(allEnrollments)
        ? allEnrollments.length
        : 0;

      // 5) Monta array formatado
      const formatted = records.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.instructions,
        status: r.status || "em andamento",
        submittedCount: submissionCounts[r.id] || 0,
        totalStudents,
        createdAt: r.created,
        dueDate: r.dueDate,
      }));

      // 6) Atualiza o estado: se formatted vier vazio (por algum motivo), não apagamos o que já tinha
      setActivities((prev) =>
        formatted && formatted.length ? formatted : prev
      );
    } catch (error) {
      // erro inesperado: log e não modificamos o estado atual (não some nada)
      console.error("Erro ao carregar atividades:", error);
    }
  };

  useEffect(() => {
    if (classId) {
      loadActivities();
      const interval = setInterval(loadActivities, 60000); // atualiza a cada 1 min
      return () => clearInterval(interval);
    }
  }, [classId]);

  // ➕ Criar nova atividade
  const handleCreate = async () => {
     if (!activity.title?.trim()) {
    toast({
      variant: "destructive",
      title: "Campo obrigatório",
      description: "O título da atividade é obrigatório.",
    });
    return;
  }

  // 🔒 Impede datas passadas
  if (activity.dueDate) {
    const now = new Date();
    const due = new Date(activity.dueDate);

    if (due < now) {
      toast({
        variant: "destructive",
        title: "Data inválida",
        description: "A data e hora de entrega não podem ser anteriores ao momento atual.",
      });
      return;
    }
  }

  try {
    const today = new Date();
    const due = activity.dueDate ? new Date(activity.dueDate) : null;
    const status = due && due < today ? "terminada" : "em andamento";

    const formDataToSend = new FormData();
    formDataToSend.append("title", activity.title);
    formDataToSend.append("instructions", activity.instructions || "");
    formDataToSend.append("points", String(activity.points || "0"));
    formDataToSend.append("topic", activity.topic || "");
    formDataToSend.append("class", classId);
    formDataToSend.append("status", status);

    if (activity.dueDate) {
      const isoDate =
        activity.dueDate.includes("T") && activity.dueDate.length <= 16
          ? new Date(activity.dueDate).toISOString()
          : activity.dueDate;
      formDataToSend.append("dueDate", isoDate);
    } else {
      formDataToSend.append("dueDate", "");
    }

    if (activity.attachment) {
      formDataToSend.append("attachment", activity.attachment);
    }

    if (activity.link) {
      formDataToSend.append("link", activity.link);
    }

    await pb.collection("activities").create(formDataToSend);
    await loadActivities();

    setActivity({
      title: "",
      instructions: "",
      points: "",
      dueDate: "",
      topic: "",
      attachment: null,
      link: "",
    });

    setOpen(false);

    toast({
      title: "Atividade criada com sucesso!",
      description: "A nova atividade foi adicionada à turma.",
    });
  } catch (error) {
    console.error("Erro ao criar atividade:", error);
    toast({
      variant: "destructive",
      title: "Erro ao criar atividade",
      description: "Não foi possível criar a atividade. Tente novamente.",
    });
  }
  };

  // ❌ Confirmar exclusão
  const handleConfirmDelete = async () => {
    try {
      await pb.collection("activities").delete(deleteId);
      setActivities((prev) => prev.filter((a) => a.id !== deleteId));
      setConfirmOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Erro ao excluir atividade:", error);
      alert("Não foi possível excluir a atividade.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="container mx-auto p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/classes")}
              variant="ghost"
              size="icon"
              className="hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Atividades</h1>
              <p className="mt-2 text-muted-foreground">
                Acompanhe e gerencie as atividades da turma
              </p>
            </div>
          </div>

          {/* Botão Nova Atividade */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Plus className="mr-2 h-4 w-4" />
                Nova Atividade
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Criar nova atividade</DialogTitle>
                <DialogDescription>
                  Preencha as informações abaixo para adicionar uma atividade à
                  turma.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Projeto Arduino com sensores"
                    value={activity.title}
                    onChange={(e) =>
                      setActivity({ ...activity, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instruções</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Descreva as orientações e critérios de avaliação"
                    value={activity.instructions}
                    onChange={(e) =>
                      setActivity({ ...activity, instructions: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="points">Pontuação</Label>
                    <Input
                      id="points"
                      type="number"
                      placeholder="100"
                      value={activity.points}
                      onChange={(e) =>
                        setActivity({ ...activity, points: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Data e Hora de Entrega</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={activity.dueDate}
                      onChange={(e) =>
                        setActivity({ ...activity, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic">Tópico</Label>
                  <Input
                    id="topic"
                    placeholder="Ex: Robótica, Lógica, Web, etc."
                    value={activity.topic}
                    onChange={(e) =>
                      setActivity({ ...activity, topic: e.target.value })
                    }
                  />
                </div>

                {/* Upload + Link */}
                <div className="space-y-2">
                  <Label>Anexo (opcional)</Label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer border px-3 py-2 rounded-md text-sm hover:bg-gray-50">
                      <FileUp className="h-4 w-4" />
                      <span>Arquivo</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setActivity({ ...activity, attachment: file });
                        }}
                      />
                    </label>

                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        placeholder="ou insira um link..."
                        value={activity.link || ""}
                        onChange={(e) =>
                          setActivity({ ...activity, link: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {activity.attachment && (
                    <p className="text-xs text-gray-600">
                      Arquivo selecionado: <b>{activity.attachment.name}</b>
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-black text-white hover:bg-gray-800"
                  onClick={handleCreate}
                >
                  Criar Atividade
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 📋 Tabela de Atividades */}
        <Card className="bg-white border shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atividade</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[160px]">Entregas</TableHead>
                  <TableHead className="w-[160px]">Criada em</TableHead>
                  <TableHead className="w-[160px]">Data de Entrega</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow
                    key={activity.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{activity.title}</span>
                        <span className="line-clamp-1 text-sm text-muted-foreground">
                          {activity.description || "Sem descrição"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === "terminada"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {activity.status === "terminada"
                          ? "Terminada"
                          : "Em andamento"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {activity.submittedCount}/{activity.totalStudents}
                    </TableCell>
                    <TableCell>{formatDate(activity.createdAt)}</TableCell>
                    <TableCell>
                      {activity.dueDate ? formatDate(activity.dueDate) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  navigate(`/entregas/${activity.id}`)
                                }
                              >
                                <FileUp className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Entregas</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedActivity(activity);
                                  setEditOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeleteId(activity.id);
                                  setConfirmOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Excluir</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 🗑️ Modal de Confirmação */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir atividade</DialogTitle>
            <DialogDescription>
              Tem certeza de que deseja excluir esta atividade? Essa ação não
              poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✏️ Modal de Edição */}
      {selectedActivity && (
        <EditActivityModal
          open={editOpen}
          onOpenChange={setEditOpen}
          activity={selectedActivity}
          onSave={() => loadActivities()}
        />
      )}
    </div>
  );
}
