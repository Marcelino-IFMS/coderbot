import { pb } from '@/lib/pocketbase';

export const createActivityPB = async (activity) => {
  try {
    const newActivity = await pb.collection("activities").create({
      title: activity.title,
      instructions: activity.instructions || "",
      points: activity.points ? Number(activity.points) : 0,
      dueDate: activity.dueDate || null,
      topic: activity.topic || "",
      class: [activity.classId],
      status: "em andamento", 
      submittedCount: 0,
      totalStudents: activity.totalStudents || 0,
      attachment: activity.attachment || "",
      
    });

    console.log("Atividade criada no PocketBase:", newActivity);
    return newActivity;
  } catch (error) {
    console.error("Erro ao criar atividade no PocketBase:", error);
    throw error;
  }
};

