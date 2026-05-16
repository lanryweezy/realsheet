import React, { useState } from 'react';
import { Shield, Mail, ArrowRight, Github, Chrome, Zap } from 'lucide-react';

interface LoginViewProps {
    onLogin: (user: { name: string; email: string }) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleDemoLogin = () => {
        setIsLoading(true);
        setTimeout(() => {
            onLogin({ name: 'Nexus User', email: 'user@realsheet.ai' });
        }, 1200);
    };

    return (
        <div className="flex min-h-screen bg-slate-950 items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 grid grid-cols-[repeat(40,1fr)] grid-rows-[repeat(40,1fr)] opacity-[0.03] pointer-events-none">
                {Array.from({ length: 1600 }).map((_, i) => (
                    <div key={i} className="border-[0.5px] border-white" />
                ))}
            </div>
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-0.5 mb-6 shadow-2xl shadow-cyan-500/20">
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                            <Zap className="w-8 h-8 text-cyan-400 fill-cyan-400/10" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">RealSheet</h1>
                    <p className="text-slate-400 font-medium">The Intelligent Workspace Engine</p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2 ml-1">Work Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all font-mono text-sm"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleDemoLogin}
                            disabled={isLoading}
                            className="w-full bg-white text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                            ) : (
                                <>
                                    Continue with Email
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-slate-600"><span className="bg-slate-900/40 px-3">Instant Access</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handleDemoLogin} className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2.5 rounded-xl transition-all font-medium text-sm">
                                <Chrome className="w-4 h-4 text-orange-400" />
                                Google
                            </button>
                            <button onClick={handleDemoLogin} className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white py-2.5 rounded-xl transition-all font-medium text-sm">
                                <Github className="w-4 h-4" />
                                GitHub
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center mt-8 text-slate-500 text-xs px-10 leading-relaxed">
                    By continuing, you agree to the <span className="text-slate-300 cursor-pointer hover:underline text-[11px] font-semibold">Nexus Cloud Agreement</span> and <span className="text-slate-300 cursor-pointer hover:underline text-[11px] font-semibold">Data Privacy Protocol</span>.
                </p>
            </div>

            {/* Footer Version Info */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em]">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure Node</span>
                <span className="opacity-20">|</span>
                <span>Version 4.1.0-Core</span>
            </div>
        </div>
    );
};

export default LoginView;
