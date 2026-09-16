"use client";

import { useEffect, useState } from "react";
import {
  getDashboardAnalytics,
  DashboardAnalyticsResponse
} from "@/services/analytics-services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pb, listTeachingClasses, ClassRecord } from "@/lib/pocketbase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from "recharts";
import {
  Clock,
  Users,
  AlertTriangle,
  Activity,
  Target,
  TrendingUp,
  Brain,
  BookOpen,
  ShieldAlert
} from "lucide-react";

export function DashboardAnalytics() {
  const [data, setData] =
    useState<DashboardAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  // Carrega turmas ao montar o componente
  useEffect(() => {
    async function loadClasses() {
      if (classes.length === 0) {
        const fetchedClasses = await listTeachingClasses();
        console.log("Classes carregadas no mount:", fetchedClasses);
        setClasses(fetchedClasses);
      }
    }
    loadClasses();
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const teacherId = pb.authStore.model?.id;
        console.log("teacherId:", teacherId);
        
        if (!teacherId) {
          console.error("Nenhum usuário autenticado");
          return;
        }

        const classParam = selectedClassId === "all" ? undefined : selectedClassId;
        console.log("Carregando analytics para turma:", classParam);
        const result = await getDashboardAnalytics(teacherId, classParam);
        setData(result);
      } catch (error) {
        console.error("Erro ao carregar analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedClassId]);

  if (loading) return (
    <div className="p-12 flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );

  if (!data) return (
    <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
      <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
      <p>Não foi possível carregar os dados.</p>
    </div>
  );

  const { overview, students, alerts } = data;

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "vermelho":
        return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white border-0">Alto Risco</Badge>;
      case "amarelo":
        return <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600 text-white border-0">Atenção</Badge>;
      default:
        return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">Bom</Badge>;
    }
  };

  function formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  const sortedStudents = [...students].sort((a, b) => {
    const riskOrder = { vermelho: 3, amarelo: 2, verde: 1 };
    return riskOrder[b.risk] - riskOrder[a.risk];
  });

  return (
    <div className="container mx-auto px-6 py-8 space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ===================== */}
      {/* HEADER WITH CLASS SELECTOR */}
      {/* ===================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Análise de Desempenho</h2>
          <p className="text-muted-foreground mt-1">
            Visão geral e métricas {selectedClassId === 'all' ? 'de todas as suas turmas' : 'da turma selecionada'}.
          </p>
        </div>
        
        <div className="w-full sm:w-auto min-w-[300px]">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">📚 Selecione uma turma:</label>
          
          {classes.length === 0 ? (
            <div className="w-full border-2 border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                ℹ️ Nenhuma turma criada
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                Crie uma turma para visualizar as métricas
              </p>
            </div>
          ) : (
            <Select 
              value={selectedClassId} 
              onValueChange={setSelectedClassId}
            >
              <SelectTrigger className="w-full bg-card border-2 border-primary/40 shadow-md rounded-xl py-6 transition-all hover:bg-muted/50 hover:shadow-lg focus:ring-primary/20 font-medium">
                <SelectValue placeholder="Selecione uma turma" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/50 shadow-lg">
                <SelectItem value="all" className="rounded-lg cursor-pointer font-semibold">
                  📊 Todas as Turmas (Visão Geral)
                </SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id} className="rounded-lg cursor-pointer">
                    📖 {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ===================== */}
      {/* OVERVIEW CARDS */}
      {/* ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-bl-full transition-transform group-hover:scale-110" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Sessões</p>
                <p className="text-4xl font-bold tracking-tight text-foreground">{overview.totalSessions}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-blue-500" />
              Sessões ativas no período
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-purple-50/50 dark:bg-purple-950/20 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/10 rounded-bl-full transition-transform group-hover:scale-110" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Tempo Médio</p>
                <p className="text-4xl font-bold tracking-tight text-foreground">{formatDuration(overview.classMeanDuration)}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Tempo médio de interação por aluno
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-red-50/50 dark:bg-red-950/20 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-bl-full transition-transform group-hover:scale-110" />
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Alunos em Alerta</p>
                <p className="text-4xl font-bold tracking-tight text-red-600">{alerts.length}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
                <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-red-500/80 mt-4 font-medium">
              Alunos necessitando atenção imediata
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ===================== */}
        {/* LEFT COLUMN */}
        {/* ===================== */}
        <div className="lg:col-span-2 space-y-8">

          {/* CLASS AVERAGES */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Desempenho Geral da Turma
              </CardTitle>
              <CardDescription>Média das métricas consolidadas de todos os alunos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  label="Engajamento"
                  value={overview.classMeanEngagement}
                  icon={<Activity className="h-4 w-4 text-orange-500" />}
                  colorClass="bg-orange-500"
                />
                <MetricCard
                  label="Desempenho"
                  value={overview.classMeanPerformance}
                  icon={<Target className="h-4 w-4 text-indigo-500" />}
                  colorClass="bg-indigo-500"
                />
                <MetricCard
                  label="Progresso"
                  value={overview.classMeanProgress}
                  icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
                  colorClass="bg-emerald-500"
                />
                <MetricCard
                  label="Autonomia"
                  value={overview.classMeanAutonomy}
                  icon={<Brain className="h-4 w-4 text-blue-500" />}
                  colorClass="bg-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* STUDENTS LIST */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Métricas Individuais
                </CardTitle>
                <CardDescription>Visão detalhada do desenvolvimento por aluno</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedStudents.map((student) => (
                  <div
                    key={student.studentId}
                    className="group border border-border/40 rounded-xl p-5 hover:bg-muted/30 transition-all hover:shadow-md bg-card relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 w-1 h-full"
                      style={{
                        backgroundColor:
                          student.risk === 'vermelho' ? '#ef4444' :
                            student.risk === 'amarelo' ? '#f59e0b' :
                              '#10b981'
                      }}></div>
                    <div className="flex justify-between items-center mb-5 pl-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{student.name}</p>
                        </div>
                      </div>
                      <div>{getRiskBadge(student.risk)}</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-muted/20 p-4 rounded-lg ml-2">
                      <MiniMetric label="Engajamento" value={student.engagement} colorClass="bg-orange-500" />
                      <MiniMetric label="Desempenho" value={student.performance} colorClass="bg-indigo-500" />
                      <MiniMetric label="Progresso" value={student.progress} colorClass="bg-emerald-500" />
                      <MiniMetric label="Autonomia" value={student.autonomy} colorClass="bg-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===================== */}
        {/* RIGHT COLUMN */}
        {/* ===================== */}
        <div className="space-y-8">

          {/* ALERTS */}
          {alerts.length > 0 && (
            <Card className="border-red-200 bg-red-50/30 shadow-sm relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-red-500" />
              <CardHeader className="pb-3 border-b border-red-100 mb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Atenção Requerida
                </CardTitle>
                <CardDescription className="text-red-500/70">
                  {alerts.length} aluno{alerts.length !== 1 ? 's' : ''} precisando de ajuda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((student) => (
                  <div
                    key={student.studentId}
                    className="flex justify-between items-center bg-white dark:bg-card border border-red-100 rounded-lg p-3 shadow-sm hover:shadow transition-shadow"
                  >
                    <span className="font-medium">{student.name}</span>
                    {getRiskBadge(student.risk)}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* DISTRIBUTION CHART */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Distribuição da Turma</CardTitle>
              <CardDescription>Visão geral dos níveis de risco</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={[
                      { name: "Bom", value: overview.riskDistribution.verde, color: "#10b981" },
                      { name: "Atenção", value: overview.riskDistribution.amarelo, color: "#f59e0b" },
                      { name: "Risco", value: overview.riskDistribution.vermelho, color: "#ef4444" }
                    ]}
                    margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={60} tick={{ fill: '#555', fontSize: 13, fontWeight: 500 }} />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.05)" }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {[
                        "#10b981",
                        "#f59e0b",
                        "#ef4444"
                      ].map((color, index) => (
                        <Cell key={index} fill={color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, colorClass }: { label: string; value: number, icon: React.ReactNode, colorClass: string }) {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card p-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="p-1.5 rounded-md bg-muted/50">{icon}</div>
      </div>
      <div className="mb-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold">{safeValue.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

function MiniMetric({ label, value, colorClass }: { label: string; value: number, colorClass: string }) {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <span className="text-xs font-semibold">{safeValue.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-white dark:bg-slate-800 rounded-full h-1.5 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}