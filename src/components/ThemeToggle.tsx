import { Button } from "@/components/ui/button";
import { useTheme } from "../contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Ativar modo claro" : "Ativar modo escuro";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={label}
      className={cn(
        "relative h-9 w-9 rounded-full border border-border bg-background text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground",
        className
      )}
    >
      {/* Ícone Sol */}
      <Sun
        className={cn(
          "h-4 w-4 transition-all duration-200",
          isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
        )}
      />
      {/* Ícone Lua */}
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all duration-200",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
        )}
      />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
