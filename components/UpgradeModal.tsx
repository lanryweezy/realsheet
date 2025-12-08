import React from 'react';
import { X, Check, Zap, Shield, Crown } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
      "Unlimited AI Analysis",
      "Advanced Goal Seek & Solver",
      "Real-time Collaboration",
      "Priority Support",
      "Custom Templates",
      "API Access"
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col md:flex-row max-h-[90vh] overflow-y-auto">
        
        {/* Left Side - Value Prop */}
        <div className="w-full md:w-2/5 bg-gradient-to-br from-indigo-900 to-slate-900 p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                 <div className="absolute top-[-50px] left-[-50px] w-[200px] h-[200px] rounded-full bg-indigo-500 blur-[80px]"></div>
                 <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full bg-cyan-500 blur-[80px]"></div>
            </div>

            <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/10">
                    <Crown className="w-6 h-6 text-amber-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Unlock the full power of NexSheet</h2>
                <p className="text-indigo-200 leading-relaxed">
                    Take your data analysis to the next level with Pro features designed for power users and teams.
                </p>
            </div>

            <div className="relative z-10 mt-8 space-y-4">
                <div className="flex items-center gap-3 text-indigo-100">
                    <Shield className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-medium">Enterprise-grade security</span>
                </div>
                <div className="flex items-center gap-3 text-indigo-100">
                    <Zap className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-medium">Faster AI processing</span>
                </div>
            </div>
        </div>

        {/* Right Side - Pricing */}
        <div className="flex-1 p-8 bg-slate-900 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-white mb-2">Choose your plan</h3>
                <div className="inline-flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button className="px-4 py-1.5 rounded-md bg-nexus-accent text-white text-sm font-medium shadow-lg">Monthly</button>
                    <button className="px-4 py-1.5 rounded-md text-slate-400 text-sm font-medium hover:text-white">Yearly (-20%)</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Plan */}
                <div className="border border-slate-700 rounded-xl p-6 bg-slate-800/30">
                    <h4 className="text-lg font-semibold text-white mb-1">Starter</h4>
                    <div className="text-3xl font-bold text-white mb-4">$0<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                    <ul className="space-y-3 mb-6">
                        <li className="flex items-center gap-2 text-sm text-slate-300"><Check className="w-4 h-4 text-slate-500" /> Basic Charts</li>
                        <li className="flex items-center gap-2 text-sm text-slate-300"><Check className="w-4 h-4 text-slate-500" /> Limited AI Queries</li>
                        <li className="flex items-center gap-2 text-sm text-slate-300"><Check className="w-4 h-4 text-slate-500" /> Local Storage</li>
                    </ul>
                    <button onClick={onClose} className="w-full py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 font-medium transition-colors">
                        Current Plan
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="border border-nexus-accent rounded-xl p-6 bg-nexus-accent/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-nexus-accent text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">POPULAR</div>
                    <h4 className="text-lg font-semibold text-white mb-1">Pro</h4>
                    <div className="text-3xl font-bold text-white mb-4">$12<span className="text-sm text-slate-500 font-normal">/mo</span></div>
                    <ul className="space-y-3 mb-6">
                        {features.slice(0, 4).map((f, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-white"><Check className="w-4 h-4 text-nexus-accent" /> {f}</li>
                        ))}
                    </ul>
                    <button className="w-full py-2.5 rounded-lg bg-nexus-accent text-white hover:bg-cyan-600 font-medium transition-colors shadow-lg shadow-cyan-500/20">
                        Upgrade Now
                    </button>
                </div>
            </div>
            
            <p className="text-center text-xs text-slate-500 mt-6">
                7-day free trial. Cancel anytime. Secure payment via Stripe.
            </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;