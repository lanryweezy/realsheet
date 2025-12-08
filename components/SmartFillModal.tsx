import React, { useState } from 'react';
import { X, Sparkles, Wand2 } from 'lucide-react';

interface SmartFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (columnName: string, prompt: string) => void;
  initialColumnName?: string;
}

const SmartFillModal: React.FC<SmartFillModalProps> = ({ isOpen, onClose, onApply, initialColumnName = '' }) => {
  const [columnName, setColumnName] = useState(initialColumnName);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Update local state if initialColumnName changes when opening
  React.useEffect(() => {
      if(isOpen) {
          setColumnName(initialColumnName);
          setPrompt('');
          setIsProcessing(false);
      }
  }, [isOpen, initialColumnName]);

  if (!isOpen) return null;

  const handleApply = async () => {
      if (!columnName || !prompt) return;
      setIsProcessing(true);
      // Simulate small delay or just wait for parent to handle
      await onApply(columnName, prompt);
      setIsProcessing(false);
      onClose();
  };

  const suggestions = [
      "Extract the first name from Name",
      "Determine the Sentiment (Positive/Negative) of Feedback",
      "Categorize the Industry based on Company Name",
      "Format the Phone Number to (XXX) XXX-XXXX",
      "Translate the Description to Spanish"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-0 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-6 border-b border-slate-700">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/30">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">AI Smart Fill</h2>
                        <p className="text-indigo-200 text-sm">Generate data using artificial intelligence</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Column Name</label>
            <input 
              type="text" 
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="e.g., Industry, Sentiment, First Name"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Instruction (Prompt)</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what the AI should generate based on the other columns..."
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none transition-all placeholder:text-slate-600"
            />
            
            <div className="mt-3">
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                    {suggestions.slice(0, 3).map((s, i) => (
                        <button 
                            key={i}
                            onClick={() => setPrompt(s)}
                            className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full transition-colors text-left"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-800/30 border-t border-slate-700 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleApply}
            disabled={!columnName || !prompt || isProcessing}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
                <>
                    <Wand2 className="w-4 h-4 animate-spin" /> Generating...
                </>
            ) : (
                <>
                    <Sparkles className="w-4 h-4" /> Generate Column
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartFillModal;