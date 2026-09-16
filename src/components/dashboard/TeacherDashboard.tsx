import { useState } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardAnalytics } from "./DashboardAnalytics";
import LessonPlanGenerator from "./CreateLessonPlan/LessonPlanGenerator";

export function TeacherDashboard() {

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40">
        <DashboardHeader />
      </div>
      
      {/* Main Content */}
      <DashboardAnalytics />
    </div>
  );
}
