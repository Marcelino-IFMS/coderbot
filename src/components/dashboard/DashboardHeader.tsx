import { useState } from "react";
import { LogOut, Filter, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "../ThemeToggle";
import { useTheme } from "../../contexts/ThemeContext";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { theme } = useTheme();

  const handleLogout = () => {
    logout();
  };

  return (
    <Card className="bg-gradient-primary text-primary-foreground shadow-lg border-0 rounded-none">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{user?.name || "Professor"}</h1>
            <p className="text-primary-foreground/80">
              {user?.role === "teacher"
                ? "Dashboard do Professor"
                : "Dashboard"}
            </p>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />

            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => navigate("/classes")}
            >
              <School className="h-4 w-4 mr-2" />
              Gerenciar Turmas
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
