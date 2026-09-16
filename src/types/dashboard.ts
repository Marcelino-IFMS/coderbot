// Enhanced types for the analytics dashboard

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface Class {
  id: string;
  name: string;
  code: string;
  totalStudents: number;
}

export interface QuestionLevel {
  level: "básico" | "intermediário" | "avançado";
  correct: number;
  incorrect: number;
  total: number;
}

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  accuracy: number;
  totalQuestions: number;
  correctAnswers: number;
  totalTime: string;
  questionLevels: QuestionLevel[];
}

export interface ForumInteraction {
  questionsAsked: number;
  answersGiven: number;
  totalParticipations: number;
  lastActivity: string;
}

export interface StudentAnalytics {
  id: number;
  name: string;
  classId: string;
  overallAccuracy: number;
  totalTime: string;
  subjectPerformances: SubjectPerformance[];
  forumInteractions: ForumInteraction;
  difficultTopics: string[];
  lastActivity: string;
}

export interface FilterOptions {
  selectedClass: string;
  selectedSubject: string;
  sortBy: "accuracy" | "participation" | "difficulty" | "time";
  sortOrder: "desc" | "asc";
}
