import React, { useState } from 'react';
import { FormSchema } from '../services/FormService';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FormModeProps {
    schema: FormSchema;
    onExit: () => void;
    onSubmit: (data: any) => void;
}

export const FormMode: React.FC<FormModeProps> = ({ schema, onExit, onSubmit }) => {
    const [formData, setFormData] = useState<any>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
        setIsSubmitted(true);
        setTimeout(() => {
            setIsSubmitted(false);
            setFormData({});
        }, 3000);
    };

    return (
        <div className="absolute inset-0 z-[100] flex flex-col font-sans overflow-y-auto custom-scrollbar" style={{ backgroundColor: schema.theme.background }}>
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center px-6 justify-between bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <button onClick={onExit} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold">
                    <ArrowLeft size={16} /> Back to Sheet
                </button>
                <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-blue-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">Semantic Form Portal</span>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 flex flex-col items-center py-12 px-6">
                <div className="w-full max-w-xl">
                    <div className="mb-10 text-center">
                        <h1 className="text-4xl font-black text-white mb-3" style={{ color: schema.theme.primaryColor }}>{schema.title}</h1>
                        <p className="text-gray-400 leading-relaxed">{schema.description}</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {isSubmitted ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-12 text-center"
                            >
                                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.4)]">
                                    <Save size={32} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-white mb-2">Submission Received!</h2>
                                <p className="text-emerald-400/70 text-sm">The data has been appended to the spreadsheet.</p>
                            </motion.div>
                        ) : (
                            <motion.form 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onSubmit={handleSubmit}
                                className="space-y-6 bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-xl"
                            >
                                {schema.fields.map(field => (
                                    <div key={field.id} className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        
                                        {field.type === 'select' ? (
                                            <select 
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                                                required={field.required}
                                                value={formData[field.columnKey] || ''}
                                                onChange={e => setFormData({ ...formData, [field.columnKey]: e.target.value })}
                                            >
                                                <option value="">Select an option</option>
                                                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : field.type === 'boolean' ? (
                                            <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
                                                <input 
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-white/10 bg-black"
                                                    checked={!!formData[field.columnKey]}
                                                    onChange={e => setFormData({ ...formData, [field.columnKey]: e.target.checked })}
                                                />
                                                <span className="text-sm text-gray-300">Enabled</span>
                                            </div>
                                        ) : (
                                            <input 
                                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder-white/10"
                                                placeholder={field.placeholder || `Enter ${field.label}...`}
                                                required={field.required}
                                                value={formData[field.columnKey] || ''}
                                                onChange={e => setFormData({ ...formData, [field.columnKey]: e.target.value })}
                                            />
                                        )}
                                    </div>
                                ))}

                                <button 
                                    type="submit"
                                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-white shadow-xl hover:opacity-90 transition-all transform active:scale-[0.98]"
                                    style={{ backgroundColor: schema.theme.primaryColor, boxShadow: `0 10px 30px -10px ${schema.theme.primaryColor}80` }}
                                >
                                    Submit Entry
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
