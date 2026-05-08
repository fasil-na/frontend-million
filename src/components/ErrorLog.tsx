import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, RefreshCw, AlertCircle, Clock } from 'lucide-react';

interface SystemLog {
    _id: string;
    timestamp: string;
    level: string;
    source: string;
    message: string;
    details?: any;
}

import { API_BASE_URL } from '../constants';

const API_BASE = `${API_BASE_URL}/system-logs`;

const ErrorLog: React.FC = () => {
    const [logs, setLogs] = useState<SystemLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState('ALL');

    const fetchLogs = async (level = selectedLevel) => {
        setLoading(true);
        try {
            const response = await axios.get(API_BASE, {
                params: { level: level !== 'ALL' ? level : undefined }
            });
            if (Array.isArray(response.data)) {
                setLogs(response.data);
            } else {
                console.error('API returned non-array:', response.data);
                setLogs([]);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        if (!window.confirm('Are you sure you want to clear all error logs?')) return;
        try {
            await axios.delete(API_BASE);
            setLogs([]);
        } catch (error) {
            console.error('Failed to clear logs:', error);
        }
    };

    useEffect(() => {
        fetchLogs(selectedLevel);
        const interval = setInterval(() => fetchLogs(selectedLevel), 10000); // Auto refresh every 10s
        return () => clearInterval(interval);
    }, [selectedLevel]);

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'ERROR': return { bg: 'bg-red-500/10', border: 'border-red-900/20', hover: 'hover:border-red-500/40', text: 'text-red-400', badge: 'bg-red-500/20' };
            case 'WARN': return { bg: 'bg-yellow-500/10', border: 'border-yellow-900/20', hover: 'hover:border-yellow-500/40', text: 'text-yellow-400', badge: 'bg-yellow-500/20' };
            case 'INFO': return { bg: 'bg-blue-500/10', border: 'border-blue-900/20', hover: 'hover:border-blue-500/40', text: 'text-blue-400', badge: 'bg-blue-500/20' };
            default: return { bg: 'bg-gray-500/10', border: 'border-gray-800/20', hover: 'hover:border-gray-500/40', text: 'text-gray-400', badge: 'bg-gray-500/20' };
        }
    };

    return (
        <div className="bg-[#1a1b1e] border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#121316]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-none">System Logs</h3>
                        <p className="text-xs text-gray-400 mt-1">Monitoring backend health & connectivity</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Level Filter */}
                    <div className="flex items-center bg-black/40 rounded-lg p-1 border border-gray-800">
                        {['ALL', 'ERROR', 'WARN', 'INFO'].map((level) => (
                            <button
                                key={level}
                                onClick={() => setSelectedLevel(level)}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                                    selectedLevel === level 
                                    ? 'bg-gray-700 text-white' 
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 border-l border-gray-800 pl-3">
                        <button 
                            onClick={() => fetchLogs()}
                            disabled={loading}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-all text-gray-400 hover:text-white"
                            title="Refresh Logs"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button 
                            onClick={clearLogs}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-all text-gray-400 hover:text-red-500"
                            title="Clear All Logs"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <AlertCircle className="w-12 h-12 mb-3 text-gray-600" />
                        <p className="text-sm font-medium text-gray-500">No {selectedLevel !== 'ALL' ? selectedLevel.toLowerCase() : ''} logs found.</p>
                    </div>
                ) : (
                    logs.map((log) => {
                        const colors = getLevelColor(log.level);
                        return (
                            <div key={log._id} className={`group ${colors.bg} border ${colors.border} ${colors.hover} p-4 rounded-lg transition-all`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 ${colors.badge} ${colors.text} text-[10px] font-bold rounded uppercase tracking-wider`}>
                                            {log.level}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-bold opacity-60">
                                            {log.source}
                                        </span>
                                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-200 font-medium leading-relaxed">
                                    {log.message}
                                </p>
                                {log.details && (
                                    <pre className="mt-2 text-[10px] bg-black/40 p-2 rounded text-gray-500 overflow-x-auto border border-gray-800/50">
                                        {JSON.stringify(log.details, null, 2)}
                                    </pre>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer Status */}
            <div className="px-6 py-2 bg-[#121316] border-t border-gray-800 flex items-center justify-center">
               <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${logs.length === 0 ? 'bg-green-500 animate-pulse' : 'bg-indigo-500'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {logs.length === 0 ? 'Diagnostic: Clean' : `${selectedLevel} Logs: ${logs.length} Active`}
                    </span>
               </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46;
                }
            `}</style>
        </div>
    );
};

export default ErrorLog;
