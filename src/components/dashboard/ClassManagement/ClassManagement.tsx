import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  School,
  Plus,
  Users,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Loader2,
  RefreshCw,
  Search,
  X,
  ArrowLeft,
  Download,
  ListFilter,
  LayoutGrid,
  List,
  Copy,
  TrendingUp,
  Clock,
  MessageSquare,
  Book,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  createClass,
  listTeachingClasses,
  updateClass,
  deleteClass,
  listClassMembers,
  addClassMember,
  removeClassMember,
  searchUsers,
  ClassRecord,
  UserRecord,
  ClassMemberRecord,
} from "@/lib/pocketbase";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StudentDetailsModal } from "./StudentDetailsModal";

interface ClassWithMembers extends ClassRecord {
  memberCount?: number;
}

interface ClassMemberWithUser extends ClassMemberRecord {
  expand?: {
    user?: UserRecord;
  };
}

type MemberCountFilter = "all" | "empty" | "small" | "medium" | "large";
type SortOption = "recent" | "alphabetical" | "members";
type MemberRoleFilter = "all" | "student" | "teacher";

export function ClassManagement() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const [newClass, setNewClass] = useState({ name: "", description: "" });
  const [editClass, setEditClass] = useState<ClassWithMembers | null>(null);
  const [deleteClass_selected, setDeleteClass_selected] =
    useState<ClassWithMembers | null>(null);
  const [selectedClassForMembers, setSelectedClassForMembers] =
    useState<ClassWithMembers | null>(null);

  const [members, setMembers] = useState<ClassMemberWithUser[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [memberCountFilter, setMemberCountFilter] =
    useState<MemberCountFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] =
    useState<MemberRoleFilter>("all");
  const [newMemberRole, setNewMemberRole] = useState<"student" | "teacher">(
    "student"
  );

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }),
    []
  );

  const formatDate = (value?: string) => {
    if (!value) return "--";
    try {
      return dateFormatter.format(new Date(value));
    } catch (error) {
      console.warn("Não foi possível formatar a data", error);
      return "--";
    }
  };

  const classMetrics = useMemo(() => {
    if (!classes.length) {
      return {
        totalClasses: 0,
        totalMembers: 0,
        averageMembers: 0,
        recentClasses: 0,
        topClassName: undefined as string | undefined,
        topClassCount: 0,
      };
    }

    const totalMembers = classes.reduce(
      (sum, item) => sum + (item.memberCount || 0),
      0
    );
    const recentThreshold = Date.now() - 1000 * 60 * 60 * 24 * 30; // 30 dias
    const recentClasses = classes.filter((item) => {
      if (!item.created) return false;
      return new Date(item.created).getTime() >= recentThreshold;
    }).length;

    const topClass = classes.reduce<ClassWithMembers | null>(
      (prev, current) => {
        if (!prev) return current;
        const prevCount = prev.memberCount || 0;
        const currentCount = current.memberCount || 0;
        return currentCount > prevCount ? current : prev;
      },
      null
    );

    return {
      totalClasses: classes.length,
      totalMembers,
      averageMembers: classes.length
        ? Math.round(totalMembers / classes.length)
        : 0,
      recentClasses,
      topClassName: topClass?.name,
      topClassCount: topClass?.memberCount || 0,
    } as const;
  }, [classes]);

  const filteredClasses = useMemo(() => {
    if (!classes.length) return [] as ClassWithMembers[];

    const search = searchTerm.trim().toLowerCase();

    const matchesCountFilter = (count: number = 0) => {
      switch (memberCountFilter) {
        case "empty":
          return count === 0;
        case "small":
          return count > 0 && count <= 10;
        case "medium":
          return count > 10 && count <= 25;
        case "large":
          return count > 25;
        default:
          return true;
      }
    };

    const filtered = classes
      .filter((item) => {
        if (!search) return true;
        const nameMatch = item.name?.toLowerCase().includes(search);
        const descriptionMatch = item.description
          ?.toLowerCase()
          .includes(search);
        const codeMatch = item.code?.toLowerCase().includes(search);
        return Boolean(nameMatch || descriptionMatch || codeMatch);
      })
      .filter((item) => matchesCountFilter(item.memberCount || 0));

    const sorted = [...filtered];

    sorted.sort((a, b) => {
      if (sortOption === "alphabetical") {
        return a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
      }

      if (sortOption === "members") {
        return (b.memberCount || 0) - (a.memberCount || 0);
      }

      const dateA = a.created ? new Date(a.created).getTime() : 0;
      const dateB = b.created ? new Date(b.created).getTime() : 0;
      return dateB - dateA;
    });

    return sorted;
  }, [classes, memberCountFilter, searchTerm, sortOption]);

  const filteredMembers = useMemo(() => {
    if (!members.length) return [] as ClassMemberWithUser[];

    const search = memberSearchTerm.trim().toLowerCase();

    return members.filter((member) => {
      const matchesRole =
        memberRoleFilter === "all" || member.role === memberRoleFilter;
      if (!matchesRole) return false;

      if (!search) return true;

      const memberName = member.expand?.user?.name?.toLowerCase() || "";
      const memberEmail = member.expand?.user?.email?.toLowerCase() || "";

      return memberName.includes(search) || memberEmail.includes(search);
    });
  }, [memberRoleFilter, memberSearchTerm, members]);

  const isFilteringClasses =
    Boolean(searchTerm.trim()) ||
    memberCountFilter !== "all" ||
    sortOption !== "recent";

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listTeachingClasses();

      // Carregar contagem de membros sequencialmente para evitar auto-cancel
      const classesWithCounts: ClassWithMembers[] = [];
      for (const classItem of data) {
        try {
          const membersList = (await listClassMembers(
            classItem.id
          )) as ClassMemberWithUser[];
          classesWithCounts.push({
            ...classItem,
            memberCount: membersList.length,
          });
        } catch (error) {
          console.warn(
            `Erro ao carregar membros da turma ${classItem.id}:`,
            error
          );
          classesWithCounts.push({
            ...classItem,
            memberCount: 0,
          });
        }
        // Pequeno delay para evitar sobrecarregar
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      setClasses(classesWithCounts);
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
      toast.error("Erro ao carregar turmas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (!membersOpen) {
      setMemberSearchTerm("");
      setMemberRoleFilter("all");
      setSearchQuery("");
      setSearchResults([]);
      setNewMemberRole("student");
    }
  }, [membersOpen]);

  const handleCreateClass = async () => {
    if (!newClass.name.trim()) {
      toast.warning("Por favor, informe o nome da turma");
      return;
    }

    try {
      await createClass(newClass.name, newClass.description);
      toast.success("Turma criada com sucesso!");
      setNewClass({ name: "", description: "" });
      setCreateOpen(false);
      await loadClasses();
    } catch (error) {
      console.error("Erro ao criar turma:", error);
      const message =
        error instanceof Error ? error.message : "Erro ao criar turma";
      toast.error(message);
    }
  };

  const handleUpdateClass = async () => {
    if (!editClass) return;

    try {
      await updateClass(editClass.id, {
        title: editClass.name,
        description: editClass.description,
      });
      toast.success("Turma atualizada com sucesso!");
      setEditOpen(false);
      setEditClass(null);
      await loadClasses();
    } catch (error) {
      console.error("Erro ao atualizar turma:", error);
      toast.error("Erro ao atualizar turma");
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteClass_selected) return;

    try {
      await deleteClass(deleteClass_selected.id);
      toast.success("Turma excluída com sucesso!");
      setDeleteOpen(false);
      setDeleteClass_selected(null);
      await loadClasses();
    } catch (error) {
      console.error("Erro ao excluir turma:", error);
      toast.error("Erro ao excluir turma");
    }
  };

  const openEditDialog = (classItem: ClassWithMembers) => {
    setEditClass(classItem);
    setEditOpen(true);
  };

  const openDeleteDialog = (classItem: ClassWithMembers) => {
    setDeleteClass_selected(classItem);
    setDeleteOpen(true);
  };

  const openMembersDialog = async (classItem: ClassWithMembers) => {
    setSelectedClassForMembers(classItem);
    setMembersOpen(true);
    setLoadingMembers(true);

    try {
      const membersData = (await listClassMembers(
        classItem.id
      )) as ClassMemberWithUser[];
      setMembers(membersData);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
      toast.error("Erro ao carregar membros");
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error("Erro ao buscar usuários");
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (
    userId: string,
    role: "student" | "teacher"
  ) => {
    if (!selectedClassForMembers) return;

    try {
      await addClassMember(selectedClassForMembers.id, userId, role);
      toast.success(
        role === "teacher"
          ? "Professor adicionado à turma"
          : "Aluno adicionado com sucesso!"
      );
      setSearchQuery("");
      setSearchResults([]);

      // Aguardar um pouco antes de recarregar
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Recarregar membros da turma atual
      const membersData = (await listClassMembers(
        selectedClassForMembers.id
      )) as ClassMemberWithUser[];
      setMembers(membersData);

      // Atualizar a contagem local sem recarregar todas as turmas
      setClasses((prev) =>
        prev.map((c) =>
          c.id === selectedClassForMembers.id
            ? { ...c, memberCount: membersData.length }
            : c
        )
      );

      // Atualizar selectedClassForMembers
      setSelectedClassForMembers((prev) =>
        prev
          ? {
            ...prev,
            memberCount: membersData.length,
          }
          : null
      );
      setNewMemberRole("student");
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      toast.error("Erro ao adicionar membro");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedClassForMembers) return;

    try {
      await removeClassMember(memberId);
      toast.success("Membro removido com sucesso!");

      // Aguardar um pouco antes de recarregar
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Recarregar membros da turma atual
      const membersData = (await listClassMembers(
        selectedClassForMembers.id
      )) as ClassMemberWithUser[];
      setMembers(membersData);

      // Atualizar a contagem local sem recarregar todas as turmas
      setClasses((prev) =>
        prev.map((c) =>
          c.id === selectedClassForMembers.id
            ? { ...c, memberCount: membersData.length }
            : c
        )
      );

      // Atualizar selectedClassForMembers
      setSelectedClassForMembers((prev) =>
        prev
          ? {
            ...prev,
            memberCount: membersData.length,
          }
          : null
      );
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      toast.error("Erro ao remover membro");
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setMemberCountFilter("all");
    setSortOption("recent");
  };

  const exportClassToCsv = async (classItem: ClassWithMembers) => {
    try {
      const membersList = (await listClassMembers(
        classItem.id
      )) as ClassMemberWithUser[];
      const escapeCell = (value: string) => value.replace(/"/g, '""');
      const normalizeText = (value: string) =>
        value.replace(/\r?\n/g, " ").trim();

      const classInfoRows = [
        ["Turma", classItem.name || "-"],
        ["Descrição", normalizeText(classItem.description || "Sem descrição")],
        ["Código", classItem.code || "-"],
        ["Criada em", formatDate(classItem.created)],
        ["Atualizada em", formatDate(classItem.updated)],
        ["Total de membros", String(membersList.length)],
      ];

      const memberHeader = ["Nome", "Email", "Papel"];
      const memberRows = membersList.length
        ? membersList.map((member) => [
          member.expand?.user?.name || "Sem nome",
          member.expand?.user?.email || "-",
          member.role === "teacher" ? "Professor" : "Aluno",
        ])
        : [["Nenhum membro cadastrado", "", ""]];

      const csvSections = [
        ["Informações da turma"],
        ...classInfoRows,
        [],
        memberHeader,
        ...memberRows,
      ];

      const csvContent = csvSections
        .map((row) => row.map((cell) => `"${escapeCell(cell)}"`).join(";"))
        .join("\n");

      const baseName =
        (classItem.name || "turma")
          .toLowerCase()
          .replace(/[^a-z0-9]+/gi, "_")
          .replace(/_{2,}/g, "_")
          .replace(/^_|_$/g, "") || "turma";
      const fileName = `${baseName}_detalhes.csv`;

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(
        `Exportamos os dados de ${classItem.name || "turma"} para CSV`
      );
    } catch (error) {
      console.error("Erro ao exportar turma:", error);
      toast.error("Não foi possível exportar esta turma");
    }
  };

  const handleCopyClassCode = async (code?: string) => {
    if (!code) {
      toast.warning("Esta turma não possui um código configurado");
      return;
    }

    const tryClipboard = async () => {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        return false;
      }
      try {
        await navigator.clipboard.writeText(code);
        return true;
      } catch (error) {
        console.warn("Falha ao copiar via Clipboard API:", error);
        return false;
      }
    };

    const fallbackClipboard = () => {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);
        return successful;
      } catch (error) {
        console.error("Falha no fallback de cópia:", error);
        return false;
      }
    };

    const copied = (await tryClipboard()) || fallbackClipboard();

    if (copied) {
      toast.success("Código da turma copiado para a área de transferência");
    } else {
      toast.error("Não foi possível copiar o código da turma");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size="icon"
                className="hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Gerenciamento de Turmas
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Gerencie suas turmas, alunos e organize suas aulas
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={loadClasses}
                    variant="outline"
                    size="icon"
                    aria-label="Atualizar lista"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Atualizar lista</TooltipContent>
              </Tooltip>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Turma
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Turma</DialogTitle>
                    <DialogDescription>
                      Preencha os dados para criar uma nova turma
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Turma *</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Programação 2024"
                        value={newClass.name}
                        onChange={(e) =>
                          setNewClass({ ...newClass, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        placeholder="Descrição da turma (opcional)"
                        value={newClass.description}
                        onChange={(e) =>
                          setNewClass({
                            ...newClass,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setCreateOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateClass}>Criar Turma</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="bg-white shadow-sm border dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Turmas ativas
                </CardTitle>
                <School className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {classMetrics.totalClasses}
                </div>
                <p className="text-xs text-muted-foreground">
                  criadas por você
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Alunos inscritos
                </CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {classMetrics.totalMembers}
                </div>
                <p className="text-xs text-muted-foreground">
                  total de membros nas suas turmas
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Engajamento médio
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {classMetrics.averageMembers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Média de alunos por turma
                  {classMetrics.topClassName && (
                    <>
                      {" • "}maior turma:{" "}
                      <span className="font-medium text-foreground">
                        {classMetrics.topClassName}
                      </span>
                      {` (${classMetrics.topClassCount})`}
                    </>
                  )}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-sm border dark:bg-slate-900 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Turmas recentes
                </CardTitle>
                <Clock className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {classMetrics.recentClasses}
                </div>
                <p className="text-xs text-muted-foreground">
                  criadas nos últimos 30 dias
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white border shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="space-y-4 pt-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, descrição ou código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-white border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800"
                    />
                  </div>
                  <Select
                    value={memberCountFilter}
                    onValueChange={(value) =>
                      setMemberCountFilter(value as MemberCountFilter)
                    }
                  >
                    <SelectTrigger className="w-full bg-white md:w-[200px] border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800">
                      <SelectValue placeholder="Qtd. de alunos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as turmas</SelectItem>
                      <SelectItem value="empty">Sem alunos</SelectItem>
                      <SelectItem value="small">1 a 10 alunos</SelectItem>
                      <SelectItem value="medium">11 a 25 alunos</SelectItem>
                      <SelectItem value="large">Mais de 25 alunos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={sortOption}
                    onValueChange={(value) =>
                      setSortOption(value as SortOption)
                    }
                  >
                    <SelectTrigger className="w-full bg-white md:w-[200px] border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mais recentes</SelectItem>
                      <SelectItem value="alphabetical">
                        Ordem alfabética
                      </SelectItem>
                      <SelectItem value="members">Mais alunos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    disabled={!isFilteringClasses}
                    className="gap-2"
                  >
                    <ListFilter className="h-4 w-4" />
                    Limpar filtros
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="icon"
                        onClick={() => setViewMode("grid")}
                        aria-label="Visualização em cards"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Visualização em cards</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="icon"
                        onClick={() => setViewMode("table")}
                        aria-label="Visualização em tabela"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Visualização em tabela</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              {classes.length > 0 && (
                <div className="flex flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
                  <span>
                    Mostrando{" "}
                    <span className="font-medium text-foreground">
                      {filteredClasses.length}
                    </span>{" "}
                    de{" "}
                    <span className="font-medium text-foreground">
                      {classes.length}
                    </span>{" "}
                    turmas
                  </span>
                  {classMetrics.topClassName && (
                    <span>
                      Maior turma atual:{" "}
                      <span className="font-medium text-foreground">
                        {classMetrics.topClassName}
                      </span>
                      {` (${classMetrics.topClassCount} membros)`}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {classes.length === 0 ? (
            <Card className="border border-dashed border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center text-slate-700 dark:text-slate-200">
                <School className="h-16 w-16 text-muted-foreground" />
                <div>
                  <h3 className="text-xl font-semibold">
                    Nenhuma turma encontrada
                  </h3>
                  <p className="mt-1 text-muted-foreground">
                    Comece criando sua primeira turma
                  </p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar primeira turma
                </Button>
              </CardContent>
            </Card>
          ) : filteredClasses.length === 0 ? (
            <Card className="border border-dashed border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center text-slate-700 dark:text-slate-200">
                <Search className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">Nenhum resultado</h3>
                  <p className="mt-1 text-muted-foreground">
                    Ajuste os filtros ou limpe a pesquisa para visualizar suas
                    turmas
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="gap-2"
                >
                  <ListFilter className="h-4 w-4" />
                  Limpar filtros
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-2">
              {filteredClasses.map((classItem) => {
                const isNew = classItem.created
                  ? Date.now() - new Date(classItem.created).getTime() <
                  1000 * 60 * 60 * 24 * 7
                  : false;

                return (
                  <Card
                    key={classItem.id}
                    className="relative border border-slate-200 bg-white transition-shadow hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    {isNew && (
                      <Badge
                        className="absolute right-4 top-4"
                        variant="secondary"
                      >
                        Novo
                      </Badge>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-xl">
                            {classItem.name}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 text-slate-600 dark:text-slate-300">
                            {classItem.description || "Sem descrição"}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <School className="h-8 w-8 text-primary" />
                          {classItem.code && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                  onClick={() =>
                                    handleCopyClassCode(classItem.code)
                                  }
                                >
                                  {classItem.code}
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Copiar código da turma
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{classItem.memberCount || 0} membros</span>
                        </div>
                        <span className="text-xs">
                          Atualizada em {formatDate(classItem.updated)}
                        </span>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                        <div className="flex items-center justify-between">
                          <span>Criada em</span>
                          <span className="font-medium text-foreground">
                            {formatDate(classItem.created)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span>Última atualização</span>
                          <span className="font-medium text-foreground">
                            {formatDate(classItem.updated)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-1">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-black text-white hover:bg-gray-800"
                        onClick={() =>
                          window.open(
                            `/atividades/${classItem.id}`,
                            "_blank"
                          )
                        }
                      >
                        <Book className="mr-2 h-4 w-4" />
                        Atividades
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-black text-white hover:bg-gray-800 "
                        onClick={() => navigate(`/planos/${classItem.id}`)}
                      >
                        <School className="h-4 w-4 mr-2" />
                        Criar Aula
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() =>
                          window.open(
                            `https://coderbot.space/class/${classItem.id}`,
                            "_blank"
                          )
                        }
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Fórum
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openMembersDialog(classItem)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Membros
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => exportClassToCsv(classItem)}
                            aria-label={`Exportar CSV da turma ${classItem.name}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Exportar CSV</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(classItem)}
                            aria-label="Editar turma"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(classItem)}
                            aria-label="Excluir turma"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
                      </Tooltip>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="bg-white border shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Turma</TableHead>
                      <TableHead className="w-[120px]">Alunos</TableHead>
                      <TableHead className="w-[140px]">Código</TableHead>
                      <TableHead className="w-[160px]">Criada em</TableHead>
                      <TableHead className="w-[160px]">Atualizada em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.map((classItem) => (
                      <TableRow
                        key={classItem.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold">
                              {classItem.name}
                            </span>
                            <span className="line-clamp-1 text-sm text-muted-foreground">
                              {classItem.description || "Sem descrição"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{classItem.memberCount || 0}</TableCell>
                        <TableCell>
                          {classItem.code ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() =>
                                handleCopyClassCode(classItem.code)
                              }
                            >
                              {classItem.code}
                              <Copy className="h-3 w-3" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(classItem.created)}</TableCell>
                        <TableCell>{formatDate(classItem.updated)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    window.open(
                                      `https://coderbot.space/class/${classItem.id}`,
                                      "_blank"
                                    )
                                  }
                                  aria-label="Acessar fórum"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Fórum</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openMembersDialog(classItem)}
                                  aria-label="Gerenciar membros"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Membros</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => exportClassToCsv(classItem)}
                                  aria-label="Exportar CSV"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Exportar CSV</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(classItem)}
                                  aria-label="Editar turma"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDialog(classItem)}
                                  aria-label="Excluir turma"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Excluir</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Editar Turma</DialogTitle>
                <DialogDescription>
                  Atualize os dados da turma
                </DialogDescription>
              </DialogHeader>
              {editClass && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome da Turma</Label>
                    <Input
                      id="edit-name"
                      value={editClass.name}
                      onChange={(e) =>
                        setEditClass({ ...editClass, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Textarea
                      id="edit-description"
                      value={editClass.description || ""}
                      onChange={(e) =>
                        setEditClass({
                          ...editClass,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateClass}>Salvar Alterações</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogDescription>
                  Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm">
                  Tem certeza que deseja excluir a turma{" "}
                  <span className="font-semibold">
                    {deleteClass_selected?.name}
                  </span>
                  ?
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteClass}>
                  Excluir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
            <DialogContent className="sm:max-w-[780px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Membros – {selectedClassForMembers?.name}
                </DialogTitle>
                <DialogDescription>
                  Gerencie os membros desta turma
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="space-y-3">
                  <Label>Adicionar membro</Label>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <div className="flex flex-1 gap-2">
                      <Input
                        placeholder="Buscar por email ou nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSearchUsers()
                        }
                        className="bg-white border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800"
                      />
                      <Button onClick={handleSearchUsers} disabled={searching}>
                        {searching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Select
                      value={newMemberRole}
                      onValueChange={(value) =>
                        setNewMemberRole(value as "student" | "teacher")
                      }
                    >
                      <SelectTrigger className="w-full bg-white md:w-[200px] border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800">
                        <SelectValue placeholder="Adicionar como" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Aluno</SelectItem>
                        <SelectItem value="teacher">Professor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O membro convidado receberá acesso imediato assim que for
                    adicionado.
                  </p>
                </div>

                {searchResults.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto rounded-lg border bg-background/60">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0"
                      >
                        <div className="flex flex-1 flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleAddMember(user.id, newMemberRole)
                          }
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : searchQuery && !searching ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum usuário encontrado para “{searchQuery}”.
                  </p>
                ) : null}

                <div className="space-y-3">
                  <Label>Membros atuais</Label>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Filtrar por nome ou email"
                        value={memberSearchTerm}
                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                        className="pl-9 bg-white border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800"
                      />
                    </div>
                    <Select
                      value={memberRoleFilter}
                      onValueChange={(value) =>
                        setMemberRoleFilter(value as MemberRoleFilter)
                      }
                    >
                      <SelectTrigger className="w-full bg-white md:w-[200px] border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800">
                        <SelectValue placeholder="Filtrar por papel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os papéis</SelectItem>
                        <SelectItem value="teacher">Professores</SelectItem>
                        <SelectItem value="student">Alunos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {loadingMembers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : members.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum membro encontrado para esta turma
                    </p>
                  ) : filteredMembers.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum membro corresponde aos filtros selecionados
                    </p>
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Papel</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell className="font-medium">
                                {member.expand?.user?.length ? (
                                  <>
                                    {member.expand.user.map((u) => (
                                      <StudentDetailsModal
                                        key={u.id}
                                        studentId={u.id}
                                        studentName={u.name}
                                        email={u.email}
                                      />
                                    ))}
                                  </>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                              <TableCell>
                                {member.expand?.user?.length
                                  ? member.expand.user
                                    .map((u) => u.email)
                                    .join(", ")
                                  : "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    member.role === "teacher"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {member.role === "teacher"
                                    ? "Professor"
                                    : "Aluno"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {member.role !== "teacher" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() =>
                                          handleRemoveMember(member.id)
                                        }
                                        aria-label="Remover membro"
                                      >
                                        <X className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Remover</TooltipContent>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
}
