import { pb } from "@/lib/pocketbase";

export type StudentMetrics = {
  studentId: string;
  name: string;
  engagement: number;
  performance: number;
  progress: number;
  autonomy: number;
  risk: "verde" | "amarelo" | "vermelho";
};

export type ClassOverview = {
  totalSessions: number;
  classMeanDuration: number;
  classMeanEngagement: number;
  classMeanPerformance: number;
  classMeanProgress: number;
  classMeanAutonomy: number;
  riskDistribution: {
    verde: number;
    amarelo: number;
    vermelho: number;
  };
};

export type AlertStudent = {
  studentId: string;
  name: string;
  risk: "amarelo" | "vermelho";
};

export type DashboardAnalyticsResponse = {
  overview: ClassOverview;
  alerts: AlertStudent[];
  students: StudentMetrics[];
};

export async function getDashboardAnalytics(
  teacherId: string,
  classId?: string
): Promise<DashboardAnalyticsResponse> {

  const sessions = await pb.collection("sessions").getFullList({
    filter: `teacherId="${teacherId}"`
  });
  console.log("Total de sessões do professor:", sessions.length);

  let studentIds: string[] = [];

  // Se uma turma foi selecionada, buscar seus alunos
  if (classId) {
    console.log("Buscando alunos da turma:", classId);
    const classMembers = await pb.collection("class_members").getFullList({
      filter: `class="${classId}" && role="student"`
    });
    console.log("Membros da turma:", classMembers.length);
    studentIds = classMembers.map(m => m.user);
  } else {
    // Se nenhuma turma selecionada, usar alunos que têm sessões
    studentIds = [...new Set(sessions.map((s: any) => s.userId))];
  }

  console.log("IDs de alunos a processar:", studentIds);

  // Filtrar sessões apenas dos alunos da turma
  const filteredSessions = sessions.filter(s => studentIds.includes(s.userId));
  console.log("Sessões filtradas da turma:", filteredSessions.length);

  const totalSessions = filteredSessions.length;
  const totalDuration = filteredSessions.reduce(
    (sum, s: any) => sum + (s.duration_seconds || 0),
    0
  );

  const classMeanDuration =
    totalSessions > 0 ? totalDuration / totalSessions : 0;

  const attemptsByStudent: Record<string, any[]> = {};
  const interactionsByStudent: Record<string, any[]> = {};

  for (const studentId of studentIds) {
    attemptsByStudent[studentId] = await pb.collection("student_attempts").getFullList({
      filter: `student="${studentId}"`,
      expand: "exercise"
    });

    interactionsByStudent[studentId] = await pb
      .collection("agent_interactions")
      .getFullList({
        filter: `student="${studentId}"`
      });
  }
  const submissionsByStudent: Record<string, any[]> = {};

  for (const studentId of studentIds) {
    submissionsByStudent[studentId] =
      await pb.collection("submissions").getFullList({
        filter: `student="${studentId}"`
      });
  }

  const activities = await pb.collection("activities").getFullList(


  );

  const totalActivities = activities.length;


  const students: StudentMetrics[] = await Promise.all(
    studentIds.map(async (studentId) => {

      const studentRecord = await pb.collection("users").getOne(studentId);

      const studentSessions = filteredSessions.filter(s => s.userId === studentId);
      const studentAttempts = attemptsByStudent[studentId] || [];
      const studentInteractions = interactionsByStudent[studentId] || [];

      const totalStudentDuration = studentSessions.reduce(
        (sum, s) => sum + (s.duration_seconds || 0),
        0
      );

      const hours = totalStudentDuration / 3600;
      const engagement = Math.min((hours * 10) + (studentSessions.length * 5), 100);

      const totalAttempts = studentAttempts.length;
      const successCount = studentAttempts.filter(a => a.success).length;
      const avgAttempts = totalAttempts > 0
        ? studentAttempts.reduce((sum, a) => sum + (a.attempts_count || 1), 0) / totalAttempts
        : 1;

      const performance =
        totalAttempts > 0
          ? (successCount / totalAttempts) * (1 / avgAttempts) * 100
          : 0;

      const studentSubmissions = submissionsByStudent[studentId] || [];

      const uniqueActivities = new Set(
        studentSubmissions.map(s => s.activity)
      );

      const progress = totalActivities > 0
        ? (uniqueActivities.size / totalActivities) * 100
        : 0;



      const avgHints =
        studentInteractions.length > 0
          ? studentInteractions.reduce(
            (sum, i) => sum + (i.hints_used || 0),
            0
          ) / studentInteractions.length
          : 0;

      const autonomy = Math.max(100 - (avgHints * 15), 0);

      let risk: "verde" | "amarelo" | "vermelho" = "verde";

      if (engagement < 30 && performance < 50) risk = "vermelho";
      else if (engagement < 50 || performance < 60) risk = "amarelo";

      return {
        studentId,
        name: studentRecord.name,
        engagement,
        performance,
        progress,
        autonomy,
        risk
      };
    })
  );

  // =========================
  // Contexto Geral
  // =========================

  const activeStudents = students.filter(
    s => s.engagement > 0 || s.performance > 0
  );

  const classMeanEngagement =
    activeStudents.length > 0
      ? activeStudents.reduce((sum, s) => sum + s.engagement, 0) / activeStudents.length
      : 0;

  const classMeanPerformance =
    activeStudents.length > 0
      ? activeStudents.reduce((sum, s) => sum + s.performance, 0) / activeStudents.length
      : 0;

  const classMeanProgress =
    activeStudents.length > 0
      ? activeStudents.reduce((sum, s) => sum + s.progress, 0) / activeStudents.length
      : 0;

  const classMeanAutonomy =
    activeStudents.length > 0
      ? activeStudents.reduce((sum, s) => sum + s.autonomy, 0) / activeStudents.length
      : 0;

  const riskDistribution = {
    verde: students.filter(s => s.risk === "verde").length,
    amarelo: students.filter(s => s.risk === "amarelo").length,
    vermelho: students.filter(s => s.risk === "vermelho").length
  };

  const alerts: AlertStudent[] = students
    .filter(s => s.risk !== "verde")
    .map(s => ({
      studentId: s.studentId,
      name: s.name,
      risk: s.risk as "amarelo" | "vermelho"
    }));

  return {
    overview: {
      totalSessions,
      classMeanDuration,
      classMeanEngagement,
      classMeanPerformance,
      classMeanProgress,
      classMeanAutonomy,
      riskDistribution
    },
    alerts,
    students
  };
}