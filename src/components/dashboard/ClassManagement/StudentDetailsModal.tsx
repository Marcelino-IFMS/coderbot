import { useState } from "react";
import { getAvatarUrl, UserRecord } from "@/lib/pocketbase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, CheckCircle2, Clock, User } from "lucide-react";
import { pb } from "@/lib/pocketbase";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function StudentDetailsModal({ studentId, studentName, email }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // 🔹 Busca o usuário
      const user = await pb.collection("users").getOne<UserRecord>(studentId);

      // 🔹 Busca submissões do aluno (última tarefa enviada)
      let lastSubmission = null;
      try {
        const submissions = await pb.collection("submissions").getFullList({
          filter: `student="${studentId}"`,
          sort: "-submittedAt",
          expand: "activity",
          limit: 1,
        });

        if (submissions.length > 0) {
          const sub = submissions[0];
          lastSubmission = {
            activityTitle: sub.expand?.activity?.title || "Atividade sem título",
            submittedAt: sub.submittedAt,
            status: sub.status,
          };
        }
      } catch (err) {
        console.warn("Coleção 'submissions' não encontrada — ignorando", err);
      }

      // 🔹 Busca atividades e progresso geral
      let totalActivities = 0;
      let completed = 0;
      try {
        const activities = await pb.collection("activities").getFullList();
        totalActivities = activities.length;

        // Busca quantas ele completou (status corrigido)
        const studentSubs = await pb.collection("submissions").getFullList({
          filter: `student="${studentId}" && status="corrigido"`,
        });
        completed = studentSubs.length;
      } catch (err) {
        console.warn("Erro ao buscar atividades — ignorando", err);
      }

      const progress = totalActivities
        ? Math.round((completed / totalActivities) * 100)
        : 0;

      // 🔹 Atualiza o estado final
      const avatarUrl = getAvatarUrl(user);
      setStats({
        name: user.name,
        avatarUrl,
        email: user.email,
        lastLogin: user.updated || "—",
        lastSubmission,
        totalActivities,
        completed,
        progress,
      });
    } catch (err) {
      console.error("Erro ao carregar dados do aluno:", err);
      setStats({
        name: studentName,
        email,
        lastLogin: "—",
        lastSubmission: null,
        totalActivities: 0,
        completed: 0,
        progress: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) fetchStudentData();
      }}
    >
      <DialogTrigger asChild>
        <button className="font-medium text-primary hover:underline">
          {studentName}
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalhes do Aluno</DialogTitle>
          <DialogDescription>
            Acompanhe o desempenho e progresso geral deste aluno.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <div className="space-y-5 py-4 text-sm">
            {/* 👤 Nome e e-mail */}
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={stats.avatarUrl} alt={stats.name} />
                <AvatarFallback>
                  {stats.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-base">{stats.name}</p>
                <p className="text-muted-foreground text-xs">{stats.email}</p>
              </div>
            </div>

            {/* 📦 Última tarefa enviada */}
            <div className="border-t pt-3 space-y-2">
              <p className="font-medium">Última Tarefa</p>
              {stats.lastSubmission ? (
                <div className="flex flex-col gap-1 bg-green-50 border border-green-200 rounded-md p-3 text-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>
                      <strong>{stats.lastSubmission.activityTitle}</strong>
                    </span>
                  </div>
                  <span className="text-xs">
                    Enviada em {formatDate(stats.lastSubmission.submittedAt)}
                  </span>
                  <span className="text-xs">
                    Status:{" "}
                    <strong>
                      {stats.lastSubmission.status === "corrigido"
                        ? "Corrigida"
                        : "Enviada"}
                    </strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md p-2">
                  <Clock className="w-5 h-5" />
                  <span>Nenhuma tarefa enviada ainda</span>
                </div>
              )}
            </div>

            {/* 📊 Atividades e progresso */}
            <div className="border-t pt-3">
              <p>
                <strong>Atividades concluídas:</strong>{" "}
                {stats.completed} / {stats.totalActivities}
              </p>
              <div className="mt-2">
                <p className="mb-1">
                  <strong>Progresso geral:</strong> ({stats.progress}%)
                </p>
                <Progress value={stats.progress} className="h-2" />
              </div>
            </div>

            {/* 🕒 Último acesso */}
            <div className="border-t pt-3">
              <p>
                <strong>Último acesso:</strong>{" "}
                {stats.lastLogin
                  ? formatDate(stats.lastLogin)
                  : "Sem registro"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Nenhum dado encontrado.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
