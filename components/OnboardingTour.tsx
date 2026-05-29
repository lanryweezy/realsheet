import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Wand2, GitBranch, LayoutGrid } from 'lucide-react';

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: "Welcome to RealSheet 2.0",
    content: "The intelligent productivity engine that goes beyond spreadsheets. Let's take a quick tour of what's new.",
    icon: <Sparkles className="w-10 h-10 text-cyan-400" />,
  },
  {
    title: "NexAgent AI",
    content: "Your autonomous assistant. Ask it to clean data, create charts, or even plan your week. It uses multi-turn reasoning to get things right.",
    icon: <Wand2 className="w-10 h-10 text-indigo-400" />,
  },
  {
    title: "Visual Formula Builder",
    content: "No more memorizing complex syntax. Build formulas by dragging and dropping blocks. Access it via the 'Formulas' tab.",
    icon: <LayoutGrid className="w-10 h-10 text-emerald-400" />,
  },
  {
    title: "Git-like Versioning",
    content: "Branch, commit, and merge changes. Experiment safely without losing your work. Found under the 'File' menu.",
    icon: <GitBranch className="w-10 h-10 text-purple-400" />,
  },
  {
    title: "Mobile Optimized",
    content: "RealSheet now works beautifully on your phone. Tap any row number to open a focused detail view for quick data entry.",
    icon: <ChevronRight className="w-10 h-10 text-orange-400 rotate-90" />,
  }
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-slate-800/50 rounded-2xl border border-white/5 shadow-inner">
               {step.icon}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">{step.title}</h2>
            <p className="text-slate-400 leading-relaxed">{step.content}</p>
          </div>

          <div className="flex items-center justify-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-cyan-400' : 'w-2 bg-slate-700'}`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white font-medium transition-colors"
            >
              Skip tour
            </button>

            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => {
                  if (currentStep < steps.length - 1) {
                    setCurrentStep(prev => prev + 1);
                  } else {
                    onClose();
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
