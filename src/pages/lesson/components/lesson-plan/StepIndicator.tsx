import { Check } from "lucide-react";

interface Step {
  label: string;
  description: string;
}

const steps: Step[] = [
  { label: "Dados Iniciais", description: "Informações do plano" },
  { label: "Geração IA", description: "Processando aulas" },
  { label: "Revisão", description: "Editar e ajustar" },
  { label: "Salvar", description: "Finalizar plano" },
];

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isDone = currentStep > stepNum;
          const isActive = currentStep === stepNum;

          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isDone
                      ? "bg-success text-success-foreground"
                      : isActive
                      ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-step-pending text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="w-5 h-5" /> : stepNum}
                </div>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    isActive ? "text-primary" : isDone ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:block">
                  {step.description}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mt-[-20px] rounded-full transition-all duration-500 ${
                    currentStep > stepNum + 1
                      ? "bg-success"
                      : currentStep > stepNum
                      ? "gradient-primary"
                      : "bg-step-pending"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
