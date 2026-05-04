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

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_BASE);
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
        fetchLogs();
        const interval = setInterval(fetchLogs, 10000); // Auto refresh every 10s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-[#1a1b1e] border border-gray-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#121316]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-none">System Error Logs</h3>
                        <p className="text-xs text-gray-400 mt-1">Monitoring backend health & connectivity</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={fetchLogs}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <AlertCircle className="w-12 h-12 mb-3" />
                        <p className="text-sm font-medium">No critical errors detected. System is healthy.</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log._id} className="group bg-[#121316]/50 border border-red-900/20 hover:border-red-500/40 p-4 rounded-lg transition-all">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded uppercase tracking-wider">
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
                    ))
                )}
            </div>

            {/* Footer Status */}
            <div className="px-6 py-2 bg-[#121316] border-t border-gray-800 flex items-center justify-center">
               <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${logs.length === 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {logs.length === 0 ? 'Diagnostic: Clean' : `Alerts: ${logs.length} Active`}
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
