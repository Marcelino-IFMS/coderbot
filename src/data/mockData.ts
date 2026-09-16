import { Class, Subject, StudentAnalytics } from "@/types/dashboard";

export const mockClasses: Class[] = [
  { id: "all", name: "Todas as Turmas", code: "ALL", totalStudents: 25 },
  { id: "turma-a", name: "Turma A - Manhã", code: "TMA", totalStudents: 12 },
  { id: "turma-b", name: "Turma B - Tarde", code: "TMT", totalStudents: 13 },
];

export const mockSubjects: Subject[] = [
  { id: "all", name: "Todas as Matérias", code: "ALL", color: "hsl(var(--muted-foreground))" },
  { id: "python", name: "Python", code: "PY", color: "hsl(217 91% 50%)" },
  { id: "java", name: "Java", code: "JAVA", color: "hsl(38 92% 50%)" },
  { id: "c", name: "C", code: "C", color: "hsl(142 76% 36%)" },
];

export const mockStudentAnalytics: StudentAnalytics[] = [
  {
    id: 1,
    name: "Ana Silva",
    classId: "turma-a",
    overallAccuracy: 85,
    totalTime: "12h 30m",
    subjectPerformances: [
      {
        subjectId: "python",
        subjectName: "Python",
        accuracy: 92,
        totalQuestions: 45,
        correctAnswers: 41,
        totalTime: "5h 20m",
        questionLevels: [
          { level: "básico", correct: 15, incorrect: 2, total: 17 },
          { level: "intermediário", correct: 18, incorrect: 1, total: 19 },
          { level: "avançado", correct: 8, incorrect: 1, total: 9 }
        ]
      },
      {
        subjectId: "java",
        subjectName: "Java",
        accuracy: 78,
        totalQuestions: 32,
        correctAnswers: 25,
        totalTime: "4h 15m",
        questionLevels: [
          { level: "básico", correct: 12, incorrect: 1, total: 13 },
          { level: "intermediário", correct: 10, incorrect: 4, total: 14 },
          { level: "avançado", correct: 3, incorrect: 2, total: 5 }
        ]
      },
      {
        subjectId: "c",
        subjectName: "C",
        accuracy: 85,
        totalQuestions: 28,
        correctAnswers: 24,
        totalTime: "2h 55m",
        questionLevels: [
          { level: "básico", correct: 10, incorrect: 1, total: 11 },
          { level: "intermediário", correct: 9, incorrect: 2, total: 11 },
          { level: "avançado", correct: 5, incorrect: 1, total: 6 }
        ]
      }
    ],
    forumInteractions: {
      questionsAsked: 15,
      answersGiven: 23,
      totalParticipations: 38,
      lastActivity: "2024-01-20 14:30"
    },
    difficultTopics: ["Recursão", "Estruturas de Dados"],
    lastActivity: "2024-01-20 14:30"
  },
  {
    id: 2,
    name: "Carlos Santos",
    classId: "turma-a",
    overallAccuracy: 72,
    totalTime: "8h 45m",
    subjectPerformances: [
      {
        subjectId: "python",
        subjectName: "Python",
        accuracy: 68,
        totalQuestions: 38,
        correctAnswers: 26,
        totalTime: "3h 20m",
        questionLevels: [
          { level: "básico", correct: 12, incorrect: 3, total: 15 },
          { level: "intermediário", correct: 10, incorrect: 6, total: 16 },
          { level: "avançado", correct: 4, incorrect: 3, total: 7 }
        ]
      },
      {
        subjectId: "java",
        subjectName: "Java",
        accuracy: 75,
        totalQuestions: 28,
        correctAnswers: 21,
        totalTime: "3h 45m",
        questionLevels: [
          { level: "básico", correct: 9, incorrect: 2, total: 11 },
          { level: "intermediário", correct: 8, incorrect: 3, total: 11 },
          { level: "avançado", correct: 4, incorrect: 2, total: 6 }
        ]
      },
      {
        subjectId: "c",
        subjectName: "C",
        accuracy: 73,
        totalQuestions: 22,
        correctAnswers: 16,
        totalTime: "1h 40m",
        questionLevels: [
          { level: "básico", correct: 8, incorrect: 2, total: 10 },
          { level: "intermediário", correct: 6, incorrect: 3, total: 9 },
          { level: "avançado", correct: 2, incorrect: 1, total: 3 }
        ]
      }
    ],
    forumInteractions: {
      questionsAsked: 8,
      answersGiven: 12,
      totalParticipations: 20,
      lastActivity: "2024-01-20 13:15"
    },
    difficultTopics: ["Orientação a Objetos", "Algoritmos"],
    lastActivity: "2024-01-20 13:15"
  },
  {
    id: 3,
    name: "Maria Oliveira",
    classId: "turma-b",
    overallAccuracy: 91,
    totalTime: "15h 20m",
    subjectPerformances: [
      {
        subjectId: "python",
        subjectName: "Python",
        accuracy: 95,
        totalQuestions: 52,
        correctAnswers: 49,
        totalTime: "6h 45m",
        questionLevels: [
          { level: "básico", correct: 18, incorrect: 0, total: 18 },
          { level: "intermediário", correct: 19, incorrect: 2, total: 21 },
          { level: "avançado", correct: 12, incorrect: 1, total: 13 }
        ]
      },
      {
        subjectId: "java",
        subjectName: "Java",
        accuracy: 88,
        totalQuestions: 35,
        correctAnswers: 31,
        totalTime: "5h 15m",
        questionLevels: [
          { level: "básico", correct: 13, incorrect: 1, total: 14 },
          { level: "intermediário", correct: 12, incorrect: 2, total: 14 },
          { level: "avançado", correct: 6, incorrect: 1, total: 7 }
        ]
      },
      {
        subjectId: "c",
        subjectName: "C",
        accuracy: 90,
        totalQuestions: 30,
        correctAnswers: 27,
        totalTime: "3h 20m",
        questionLevels: [
          { level: "básico", correct: 11, incorrect: 1, total: 12 },
          { level: "intermediário", correct: 10, incorrect: 1, total: 11 },
          { level: "avançado", correct: 6, incorrect: 1, total: 7 }
        ]
      }
    ],
    forumInteractions: {
      questionsAsked: 22,
      answersGiven: 35,
      totalParticipations: 57,
      lastActivity: "2024-01-20 16:22"
    },
    difficultTopics: ["Programação Funcional"],
    lastActivity: "2024-01-20 16:22"
  },
  {
    id: 4,
    name: "João Pedro",
    classId: "turma-b",
    overallAccuracy: 68,
    totalTime: "6h 15m",
    subjectPerformances: [
      {
        subjectId: "python",
        subjectName: "Python",
        accuracy: 71,
        totalQuestions: 25,
        correctAnswers: 18,
        totalTime: "2h 30m",
        questionLevels: [
          { level: "básico", correct: 8, incorrect: 2, total: 10 },
          { level: "intermediário", correct: 7, incorrect: 3, total: 10 },
          { level: "avançado", correct: 3, incorrect: 2, total: 5 }
        ]
      },
      {
        subjectId: "java",
        subjectName: "Java",
        accuracy: 65,
        totalQuestions: 20,
        correctAnswers: 13,
        totalTime: "2h 45m",
        questionLevels: [
          { level: "básico", correct: 6, incorrect: 2, total: 8 },
          { level: "intermediário", correct: 5, incorrect: 3, total: 8 },
          { level: "avançado", correct: 2, incorrect: 2, total: 4 }
        ]
      },
      {
        subjectId: "c",
        subjectName: "C",
        accuracy: 67,
        totalQuestions: 18,
        correctAnswers: 12,
        totalTime: "1h 00m",
        questionLevels: [
          { level: "básico", correct: 6, incorrect: 2, total: 8 },
          { level: "intermediário", correct: 4, incorrect: 2, total: 6 },
          { level: "avançado", correct: 2, incorrect: 2, total: 4 }
        ]
      }
    ],
    forumInteractions: {
      questionsAsked: 5,
      answersGiven: 3,
      totalParticipations: 8,
      lastActivity: "2024-01-19 19:45"
    },
    difficultTopics: ["Loops", "Arrays", "Funções"],
    lastActivity: "2024-01-19 19:45"
  },
  {
    id: 5,
    name: "Letícia Costa",
    classId: "turma-a",
    overallAccuracy: 79,
    totalTime: "10h 12m",
    subjectPerformances: [
      {
        subjectId: "python",
        subjectName: "Python",
        accuracy: 82,
        totalQuestions: 40,
        correctAnswers: 33,
        totalTime: "4h 20m",
        questionLevels: [
          { level: "básico", correct: 13, incorrect: 2, total: 15 },
          { level: "intermediário", correct: 12, incorrect: 3, total: 15 },
          { level: "avançado", correct: 8, incorrect: 2, total: 10 }
        ]
      },
      {
        subjectId: "java",
        subjectName: "Java",
        accuracy: 76,
        totalQuestions: 29,
        correctAnswers: 22,
        totalTime: "3h 52m",
        questionLevels: [
          { level: "básico", correct: 10, incorrect: 2, total: 12 },
          { level: "intermediário", correct: 8, incorrect: 3, total: 11 },
          { level: "avançado", correct: 4, incorrect: 2, total: 6 }
        ]
      },
      {
        subjectId: "c",
        subjectName: "C",
        accuracy: 78,
        totalQuestions: 25,
        correctAnswers: 20,
        totalTime: "2h 00m",
        questionLevels: [
          { level: "básico", correct: 9, incorrect: 1, total: 10 },
          { level: "intermediário", correct: 7, incorrect: 2, total: 9 },
          { level: "avançado", correct: 4, incorrect: 2, total: 6 }
        ]
      }
    ],
    forumInteractions: {
      questionsAsked: 12,
      answersGiven: 18,
      totalParticipations: 30,
      lastActivity: "2024-01-20 11:30"
    },
    difficultTopics: ["Ponteiros", "Herança"],
    lastActivity: "2024-01-20 11:30"
  }
];