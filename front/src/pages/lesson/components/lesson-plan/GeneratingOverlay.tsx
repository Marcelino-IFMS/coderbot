import { Loader2 } from "lucide-react";

const GeneratingOverlay = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
        </div>
        <div className="absolute inset-0 w-20 h-20 rounded-full gradient-primary opacity-30 animate-ping" />
      </div>
      <h3 className="text-xl font-bold text-foreground mt-6">Gerando Plano com IA...</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md text-center">
        O Ollama está processando seus dados e criando as aulas. Isso pode levar alguns instantes.
      </p>
    </div>
  );
};

export default GeneratingOverlay;
