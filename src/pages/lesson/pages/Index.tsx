import { Link } from "react-router-dom";
import { BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg animate-fade-in">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-foreground tracking-tight">
            Plataforma Pedagógica
          </h1>
          <p className="mt-3 text-muted-foreground max-w-sm mx-auto">
            Crie planos de aula inteligentes com auxílio de IA. Automatize, revise e salve seus planos em segundos.
          </p>
          <Link to="/criar-plano">
            <Button className="mt-8 h-12 px-8 gradient-primary text-primary-foreground font-bold text-base hover:opacity-90 transition-opacity">
              <Sparkles className="w-4 h-4 mr-2" />
              Criar Plano de Aulas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        Powered by Ollama + PocketBase
      </footer>
    </div>
  );
};

export default Index;
