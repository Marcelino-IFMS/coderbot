import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { pb } from "@/lib/pocketbase";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 🔥 FUNÇÃO NOVA → CORRIGE STATUS AUTOMÁTICO
function resolveStatus(activity: any, submissions: any[]) {
  const now = new Date();
  const due = new Date(activity.dueDate);

  const algumaCorrigida = submissions.some((s) => s.status === "corrigido");

  if (algumaCorrigida) return "corrigida";
  if (now > due) return "encerrada";
  return "em andamento";
}

export function ActivitySubmissions() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activity, setActivity] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [classMembers, setClassMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [filter, setFilter] = useState<"all" | "submitted" | "not-submitted">(
    "all"
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const activityRecord = await pb.collection("activities").getOne(activityId);
        let submissionRecords = await pb
          .collection("submissions")
          .getFullList({
            filter: `activity.id = '${activityId}'`,
            expand: "student",
            sort: "-submittedAt",
          });

        const classId =
          activityRecord?.class || activityRecord?.expand?.class?.id;

        let members: any[] = [];
        if (classId) {
          members = await pb.collection("class_members").getFullList({
            filter: `class.id = '${classId}' && role = 'student'`,
            expand: "user",
          });
        }

        // 🔥 CORRIGE STATUS AUTOMATICAMENTE
        const newStatus = resolveStatus(activityRecord, submissionRecords);

        if (newStatus !== activityRecord.status) {
          await pb.collection("activities").update(activityRecord.id, {
            status: newStatus,
          });
          activityRecord.status = newStatus;
        }

        setActivity(activityRecord);
        setSubmissions(submissionRecords);
        setClassMembers(members);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar entregas.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activityId, toast]);

  const refreshList = async () => {
    try {
      let submissionRecords = await pb.collection("submissions").getFullList({
        filter: `activity.id = '${activityId}'`,
        expand: "student",
        sort: "-submittedAt",
      });

      // 🔥 status recalculado também no refresh
      const newStatus = resolveStatus(activity, submissionRecords);
      if (newStatus !== activity.status) {
        await pb.collection("activities").update(activity.id, {
          status: newStatus,
        });
        activity.status = newStatus;
      }

      setSubmissions(submissionRecords);
    } catch (err) {
      console.error("Erro ao atualizar lista:", err);
    }
  };

  const handleAvaliarClick = (sub: any) => {
    setSelectedSubmission(sub);
    setGrade(sub.grade || "");
    setFeedback(sub.feedback || "");
    setOpen(true);
  };

  const handleSalvarAvaliacao = async () => {
    if (!selectedSubmission) return;
    if (!grade || isNaN(Number(grade))) {
      toast({
        title: "Informe uma nota válida",
        description: "Digite um número válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      await pb.collection("submissions").update(selectedSubmission.id, {
        grade: parseFloat(grade),
        feedback: feedback || "",
        status: "corrigido",
      });

      toast({ title: "Avaliação salva com sucesso!" });
      setOpen(false);
      setSelectedSubmission(null);
      setGrade("");
      setFeedback("");

      await refreshList();
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao salvar avaliação",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

  const submittedStudentIds = submissions
    .map((s) =>
      typeof s.student === "string" ? s.student : s.expand?.student?.id
    )
    .filter(Boolean);

  const submittedIdsSet = new Set(submittedStudentIds);

  const notSubmittedList = classMembers.filter((m) => {
    const uid =
      typeof m.user === "string" ? m.user : m.expand?.user?.id;
    return uid && !submittedIdsSet.has(uid);
  });

  const uniqueSubmittedMap = new Map<string, any>();
  for (const sub of submissions) {
    const sid =
      typeof sub.student === "string"
        ? sub.student
        : sub.expand?.student?.id;
    if (!sid) continue;
    if (!uniqueSubmittedMap.has(sid)) {
      uniqueSubmittedMap.set(sid, sub);
    }
  }
  const uniqueSubmittedByStudent = Array.from(uniqueSubmittedMap.values());

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate(-1)} variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                Entregas \ {activity?.title}
              </h1>
              <p className="text-muted-foreground">
                Visualize e avalie as entregas dos alunos
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              onClick={() => setFilter("all")}
            >
              Todos ({classMembers.length})
            </Button>
            <Button
              variant={filter === "submitted" ? "default" : "ghost"}
              onClick={() => setFilter("submitted")}
            >
              Entregues ({uniqueSubmittedByStudent.length})
            </Button>
            <Button
              variant={filter === "not-submitted" ? "default" : "ghost"}
              onClick={() => setFilter("not-submitted")}
            >
              Não Entregues ({notSubmittedList.length})
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-0">
              <h2 className="text-lg font-semibold px-6 py-4 border-b">
                Entregues ({uniqueSubmittedByStudent.length})
              </h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueSubmittedByStudent.length ? (
                    uniqueSubmittedByStudent.map((s) => {
                      const st = s.expand?.student;
                      const a = s.attachments || [];
                      const fileUrl =
                        a.length > 0 ? pb.files.getUrl(s, a[0]) : null;

                      return (
                        <TableRow key={s.id}>
                          <TableCell>{st?.name}</TableCell>
                          <TableCell>{st?.email}</TableCell>
                          <TableCell>
                            {formatDate(s.submittedAt)}
                          </TableCell>
                          <TableCell>{s.status}</TableCell>
                          <TableCell>
                            {s.grade ? (
                              <>
                                {s.grade}{" "}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAvaliarClick(s)}
                                >
                                  Editar
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAvaliarClick(s)}
                              >
                                Avaliar
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            {fileUrl ? (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline"
                              >
                                <Eye className="inline h-4 w-4 mr-1" />
                                Ver
                              </a>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>{s.feedback || "—"}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        Nenhuma entrega
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSubmission?.grade
                ? "Editar Avaliação"
                : "Avaliar Entrega"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium">Nota</label>
              <Input
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Digite a nota"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Feedback</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Escreva um comentário"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarAvaliacao}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
