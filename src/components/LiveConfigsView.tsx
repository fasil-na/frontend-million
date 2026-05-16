import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    Trash2, 
    Play, 
    Pause, 
    Target,
    Zap,
    Shield,
    BarChart3,
    X,
    Cpu,
    Clock,
    Monitor
} from 'lucide-react';
import { API_BASE_URL } from '../constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Strategy {
    id: string;
    name: string;
    description: string;
}

interface LiveConfig {
    _id: string;
    strategyId: string;
    pair: string;
    timeInterval: string;
    leverage: number;
    riskAmount: number;
    isEnabled: boolean;
    autoTrade: boolean;
    riskMode: 'minimal' | 'capital';
    maxPositionSize: number;
}

export const LiveConfigsView = () => {
    const [configs, setConfigs] = useState<LiveConfig[]>([]);
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // New config form state
    const [newConfig, setNewConfig] = useState({
        strategyId: '',
        pair: 'B-XAU_USDT',
        timeInterval: '1',
        leverage: 20,
        riskAmount: 5,
        autoTrade: false,
        isEnabled: true,
        riskMode: 'minimal' as const,
        maxPositionSize: 100
    });

    useEffect(() => {
        fetchConfigs();
        fetchStrategies();
    }, []);

    const fetchConfigs = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/live-configs`);
            setConfigs(data);
        } catch (err) {
            console.error('Failed to fetch configs', err);
        }
    };

    const fetchStrategies = async () => {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/market/strategies`);
            setStrategies(data);
            if (data.length > 0 && !newConfig.strategyId) {
                setNewConfig(prev => ({ ...prev, strategyId: data[0].id }));
            }
        } catch (err) {
            console.error('Failed to fetch strategies', err);
        }
    };

    const handleCreate = async () => {
        try {
            await axios.post(`${API_BASE_URL}/live-configs`, newConfig);
            setShowAddModal(false);
            fetchConfigs();
        } catch (err: any) {
            console.error('Failed to create config', err);
            const msg = err.response?.data?.error || err.message || 'Unknown error';
            alert(`Failed to create configuration: ${msg}`);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await axios.post(`${API_BASE_URL}/live-configs/${id}/toggle`);
            fetchConfigs();
        } catch (err) {
            console.error('Failed to toggle config', err);
        }
    };

    const handleUpdate = async (id: string, updates: Partial<LiveConfig>) => {
        try {
            const config = configs.find(c => c._id === id);
            if (!config) return;
            await axios.post(`${API_BASE_URL}/live-configs`, { ...config, ...updates });
            fetchConfigs();
        } catch (err) {
            console.error('Failed to update config', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this configuration?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/live-configs/${id}`);
            fetchConfigs();
        } catch (err) {
            console.error('Failed to delete config', err);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tight">System Engine</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">
                        Independent Strategy Execution Nodes
                    </p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="w-full sm:w-auto px-6 py-4 sm:py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
                >
                    <Plus className="w-4 h-4" />
                    Deploy New Node
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {configs.length === 0 ? (
                    <div className="lg:col-span-2 p-24 text-center bg-slate-950/40 border border-white/5 rounded-[3rem] backdrop-blur-xl">
                        <Cpu className="w-16 h-16 text-slate-800 mx-auto mb-6 animate-pulse" />
                        <h3 className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm">No Active Nodes Detected</h3>
                        <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-3">Initialize a configuration to begin live signal processing</p>
                    </div>
                ) : (
                    configs.map((config) => (
                        <ConfigCard 
                            key={config._id} 
                            config={config} 
                            strategyName={strategies.find(s => s.id === config.strategyId)?.name || config.strategyId}
                            onToggle={() => handleToggle(config._id)}
                            onDelete={() => handleDelete(config._id)}
                            onUpdate={(updates) => handleUpdate(config._id, updates)}
                        />
                    ))
                )}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
                        <motion.div 
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-slate-950/50">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-widest italic">Node Configuration</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Set Parameters for Isolated Execution</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white/5 rounded-2xl transition text-slate-400">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-10 space-y-8 max-h-[70vh] overflow-auto no-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Market Pair</label>
                                        <select 
                                            value={newConfig.pair}
                                            onChange={(e) => setNewConfig(prev => ({ ...prev, pair: e.target.value }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase text-xs focus:ring-2 focus:ring-indigo-500 transition outline-none"
                                        >
                                            <option value="B-XAU_USDT">Gold (XAU/USDT)</option>
                                            <option value="B-BTC_USDT">Bitcoin (BTC/USDT)</option>
                                            <option value="B-ETH_USDT">Ethereum (ETH/USDT)</option>
                                            <option value="B-SUSHI_USDT">Sushi (SUSHI/USDT)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Logic Core</label>
                                        <select 
                                            value={newConfig.strategyId}
                                            onChange={(e) => setNewConfig(prev => ({ ...prev, strategyId: e.target.value }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase text-xs focus:ring-2 focus:ring-indigo-500 transition outline-none"
                                        >
                                            {strategies.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Interval Resolution</label>
                                        <select 
                                            value={newConfig.timeInterval}
                                            onChange={(e) => setNewConfig(prev => ({ ...prev, timeInterval: e.target.value }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase text-xs focus:ring-2 focus:ring-indigo-500 transition outline-none"
                                        >
                                            <option value="1">1 Minute</option>
                                            <option value="5">5 Minutes</option>
                                            <option value="15">15 Minutes</option>
                                            <option value="30">30 Minutes</option>
                                            <option value="60">1 Hour</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Execution Leverage</label>
                                        <input 
                                            type="number"
                                            value={newConfig.leverage}
                                            onChange={(e) => setNewConfig(prev => ({ ...prev, leverage: Number(e.target.value) }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-xs focus:ring-2 focus:ring-indigo-500 transition outline-none"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Allocated Risk ($)</label>
                                        <input 
                                            type="number"
                                            value={newConfig.riskAmount}
                                            onChange={(e) => setNewConfig(prev => ({ ...prev, riskAmount: Number(e.target.value) }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-xs focus:ring-2 focus:ring-indigo-500 transition outline-none"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Risk Profile</label>
                                        <select 
                                            value={newConfig.riskMode}
                                            onChange={(e) => setNewConfig(prev => ({ ...prev, riskMode: e.target.value as any }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase text-xs focus:ring-2 focus:ring-indigo-500 transition outline-none"
                                        >
                                            <option value="minimal">Minimal ($6 Notional)</option>
                                            <option value="capital">Full Capital</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Live Monitor Toggle */}
                                    <div className="p-6 bg-blue-500/5 rounded-[2rem] border border-blue-500/10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "p-3 rounded-2xl",
                                                    newConfig.isEnabled ? "bg-blue-500/10 text-blue-400" : "bg-slate-800 text-slate-500"
                                                )}>
                                                    <Monitor className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Live Monitor</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Start Engine Processing</p>
                                                </div>
                                            </div>
                                            <div 
                                                onClick={() => setNewConfig(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
                                                className={cn(
                                                    "w-12 h-6 rounded-full transition-all relative cursor-pointer border-2",
                                                    newConfig.isEnabled ? "bg-blue-600 border-blue-400" : "bg-slate-800 border-white/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-md",
                                                    newConfig.isEnabled ? "left-6" : "left-0.5"
                                                )} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Auto Trade Toggle */}
                                    <div className="p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "p-3 rounded-2xl",
                                                    newConfig.autoTrade ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-500"
                                                )}>
                                                    <Zap className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Auto Trade</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Real Order Execution</p>
                                                </div>
                                            </div>
                                            <div 
                                                onClick={() => setNewConfig(prev => ({ ...prev, autoTrade: !prev.autoTrade }))}
                                                className={cn(
                                                    "w-12 h-6 rounded-full transition-all relative cursor-pointer border-2",
                                                    newConfig.autoTrade ? "bg-emerald-600 border-emerald-400" : "bg-slate-800 border-white/10"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-md",
                                                    newConfig.autoTrade ? "left-6" : "left-0.5"
                                                )} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-10 py-8 bg-slate-950/50 border-t border-white/5 flex items-center justify-end gap-6">
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="px-8 py-4 rounded-2xl text-slate-500 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition"
                                >
                                    Abort
                                </button>
                                <button 
                                    onClick={handleCreate}
                                    disabled={!newConfig.strategyId}
                                    className={cn(
                                        "px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition shadow-lg border",
                                        newConfig.strategyId 
                                            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 border-indigo-400/30" 
                                            : "bg-slate-800 text-slate-500 border-white/5 cursor-not-allowed opacity-50"
                                    )}
                                >
                                    {newConfig.strategyId ? 'Confirm Deployment' : 'Initializing Strategy...'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ConfigCard = ({ config, strategyName, onToggle, onDelete, onUpdate }: { 
    config: LiveConfig, 
    strategyName: string, 
    onToggle: () => void,
    onDelete: () => void,
    onUpdate: (updates: Partial<LiveConfig>) => void
}) => {
    return (
        <div className="relative group h-full">
            <div className={cn(
                "absolute -inset-0.5 rounded-[2rem] md:rounded-[3rem] blur opacity-10 transition duration-1000 group-hover:opacity-30",
                config.isEnabled ? "bg-indigo-500" : "bg-slate-700"
            )}></div>
            
            <div className="relative bg-slate-900 border border-white/10 rounded-[2rem] md:rounded-[3rem] overflow-hidden p-6 md:p-10 flex flex-col h-full shadow-2xl">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className={cn(
                            "w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center border transition-all duration-500",
                            config.isEnabled ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-slate-950 border-white/5 text-slate-700"
                        )}>
                            <Cpu className="w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-1">
                                <span className="text-xl md:text-3xl font-black text-white italic tracking-tighter">{config.pair}</span>
                                <span className={cn(
                                    "px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest border",
                                    config.isEnabled 
                                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                                        : "bg-slate-950 text-slate-600 border-white/5"
                                )}>
                                    {config.isEnabled ? 'Active' : 'Standby'}
                                </span>
                            </div>
                            <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">{strategyName}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button 
                            onClick={onToggle}
                            className={cn(
                                "p-3 md:p-4 rounded-2xl transition-all active:scale-90 border",
                                config.isEnabled 
                                    ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20 shadow-lg shadow-amber-500/10" 
                                    : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 shadow-lg shadow-emerald-500/10"
                            )}
                        >
                            {config.isEnabled ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button 
                            onClick={onDelete}
                            className="p-3 md:p-4 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 transition-all active:scale-90 shadow-lg shadow-rose-500/10"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    <Stat label="Interval" value={`${config.timeInterval}M`} icon={<Clock className="w-3 h-3" />} />
                    <Stat label="Risk Amt" value={`$${config.riskAmount}`} icon={<BarChart3 className="w-3 h-3" />} />
                    <Stat label="Leverage" value={`${config.leverage}X`} icon={<Target className="w-3 h-3" />} />
                    <Stat label="Risk" value={config.riskMode} icon={<Shield className="w-3 h-3" />} />
                </div>

                <div className="mt-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-start">
                        <div 
                            onClick={() => onUpdate({ autoTrade: !config.autoTrade })}
                            className="flex items-center gap-3 cursor-pointer group"
                        >
                            <div className={cn(
                                "w-10 h-5 rounded-full transition-all relative border",
                                config.autoTrade ? "bg-emerald-500 border-emerald-400" : "bg-slate-800 border-white/5"
                            )}>
                                <div className={cn(
                                    "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-md",
                                    config.autoTrade ? "left-5.5" : "left-0.5"
                                )} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest transition group-hover:text-white",
                                config.autoTrade ? "text-emerald-400" : "text-slate-600"
                            )}>Auto Trade</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-700 uppercase tracking-widest font-mono w-full sm:w-auto justify-end">
                        UID: {config._id.slice(-8).toUpperCase()}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Stat = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
    <div className="p-5 bg-slate-950/50 border border-white/5 rounded-2xl hover:bg-white/[0.02] transition-colors group">
        <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 group-hover:text-slate-400 transition-colors">
            {icon}
            {label}
        </div>
        <div className="text-sm font-black text-white uppercase tracking-tight">{value}</div>
    </div>
);
