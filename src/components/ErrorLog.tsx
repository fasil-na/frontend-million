import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import axios from 'axios';
import { Trash2, RefreshCw, AlertCircle, Clock, CheckCircle, Info, AlertTriangle, Activity, Shield } from 'lucide-react';
import { socket } from '../App';
import { API_BASE_URL } from '../constants';

interface SystemLog {
    _id?: string;
    timestamp: string | Date;
    level: 'info' | 'success' | 'warning' | 'error';
    source: string;
    message: string;
    metadata?: any;
}

const API_BASE = `${API_BASE_URL}/trade/logs`;

const ErrorLog: React.FC = () => {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState('ALL');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_BASE);
            if (Array.isArray(response.data)) {
                setLogs(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        if (!window.confirm('Are you sure you want to clear all system logs?')) return;
        try {
            await axios.delete(API_BASE);
            setLogs([]);
        } catch (error) {
            console.error('Failed to clear logs:', error);
        }
    };

    useEffect(() => {
        fetchLogs();

        // Listen for real-time logs
        socket.on('system_log', (newLog: SystemLog) => {
            setLogs(prev => [newLog, ...prev].slice(0, 200)); // Keep last 200
        });

        return () => {
            socket.off('system_log');
        };
    }, []);

    const getLevelConfig = (level: string) => {
        switch (level.toLowerCase()) {
            case 'error': return { 
                bg: 'bg-rose-500/10', 
                border: 'border-rose-500/20', 
                text: 'text-rose-400', 
                badge: 'bg-rose-500/20',
                icon: <AlertCircle className="w-3 h-3" />
            };
            case 'success': return { 
                bg: 'bg-emerald-500/10', 
                border: 'border-emerald-500/20', 
                text: 'text-emerald-400', 
                badge: 'bg-emerald-500/20',
                icon: <CheckCircle className="w-3 h-3" />
            };
            case 'warning': return { 
                bg: 'bg-amber-500/10', 
                border: 'border-amber-500/20', 
                text: 'text-amber-400', 
                badge: 'bg-amber-500/20',
                icon: <AlertTriangle className="w-3 h-3" />
            };
            default: return { 
                bg: 'bg-blue-500/10', 
                border: 'border-blue-500/20', 
                text: 'text-blue-400', 
                badge: 'bg-blue-500/20',
                icon: <Info className="w-3 h-3" />
            };
        }
    };

    const filteredLogs = selectedLevel === 'ALL' 
        ? logs 
        : logs.filter(l => l.level.toUpperCase() === selectedLevel);

    return (
        <div className="bg-slate-950/50 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-xl flex flex-col h-[500px]">
            {/* Header */}
            <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Activity className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">System Engine Logs</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-0.5">Real-time Socket & Execution Monitoring</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/5">
                        {['ALL', 'ERROR', 'SUCCESS', 'INFO'].map((level) => (
                            <button
                                key={level}
                                onClick={() => setSelectedLevel(level)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${
                                    selectedLevel === level 
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                        <button 
                            onClick={fetchLogs}
                            disabled={loading}
                            className="p-2.5 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white border border-transparent hover:border-white/10"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button 
                            onClick={clearLogs}
                            className="p-2.5 hover:bg-rose-500/10 rounded-xl transition-all text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/10"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/20">
                {filteredLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-4 border border-white/5 opacity-20">
                            <Shield className="w-10 h-10 text-slate-500" />
                        </div>
                        <p className="text-xs font-black text-slate-600 uppercase tracking-widest">System Diagnostics Clean</p>
                    </div>
                ) : (
                    filteredLogs.map((log, idx) => {
                        const config = getLevelConfig(log.level);
                        return (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={log._id || idx} 
                                className={`group ${config.bg} border ${config.border} p-5 rounded-[1.5rem] transition-all hover:bg-white/[0.04]`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 ${config.badge} ${config.text} text-[10px] font-black rounded-lg uppercase tracking-widest border border-white/5`}>
                                            {config.icon}
                                            {log.level}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {log.source}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        {dayjs(log.timestamp).format('HH:mm:ss.SSS')}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-slate-300 leading-relaxed tracking-tight">
                                    {log.message}
                                </p>
                                {log.metadata && (
                                    <div className="mt-4 overflow-hidden rounded-xl border border-white/5">
                                        <pre className="text-[10px] font-medium bg-black/60 p-4 text-slate-500 overflow-x-auto whitespace-pre-wrap leading-normal">
                                            {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Footer Status */}
            <div className="px-8 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Engine Status: Nominal
                    </span>
               </div>
               <div className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                   {filteredLogs.length} Events Captured
               </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.1);
                }
            `}</style>
        </div>
    );
};

export default ErrorLog;
