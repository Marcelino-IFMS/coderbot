import { useState, useEffect } from "react";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <img src="/coderbot2.png" alt="Loading" className="w-64 h-64 object-contain" />
      </div>
    );
  }

  return <TeacherDashboard />;
};

export default Index;
