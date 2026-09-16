export interface LessonPlan {
    curso: string;
    nivel: string;
    carga_total: string;
    planos_de_aula: Aula[];
}

export interface Aula {
    aula: number;
    tema: string;
    duracao: string;
    objetivos: string[];
    conteudo_programatico: string[];
    estrategias: string[];
    recursos: string[];
    avaliacao: string;
}