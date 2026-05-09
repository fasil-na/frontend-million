import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    Trash2, 
    Play, 
    Pause, 
    Activity, 
    Target,
    Zap,
    Shield,
    BarChart3,
    X,
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
    initialCapital: number;
    isEnabled: boolean;
    isLiveTrading: boolean;
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
        leverage: 1,
        initialCapital: 10,
        isLiveTrading: false,
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
        } finally {
             console.error('Failed to fetch configs');
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
        } catch (err) {
            console.error('Failed to create config', err);
            alert('Failed to create configuration');
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white">Live Configurations</h2>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
                        Manage Multiple Independent Trading Pairs
                    </p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Add Configuration
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {configs.length === 0 ? (
                    <div className="lg:col-span-2 p-20 text-center bg-slate-900/40 border border-white/5 rounded-[2.5rem]">
                        <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-slate-500 font-black uppercase tracking-widest text-sm">No Live Configurations Found</h3>
                        <p className="text-slate-600 text-xs mt-2">Create your first configuration to start live monitoring</p>
                    </div>
                ) : (
                    configs.map((config) => (
                        <ConfigCard 
                            key={config._id} 
                            config={config} 
                            strategyName={strategies.find(s => s.id === config.strategyId)?.name || config.strategyId}
                            onToggle={() => handleToggle(config._id)}
                            onDelete={() => handleDelete(config._id)}
                        />
                    ))
                )}
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                        >
                            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-slate-950/50">
                                <h3 className="text-xl font-black text-white uppercase tracking-widest">New Configuration</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/5 rounded-full transition text-slate-400">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 space-y-6 max-h-[70vh] overflow-auto no-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Trading Pair</label>
                                        <select 
                                            value={newConfig.pair}
                                            onChange={(e) => setNewConfig(prev => ({ ...prev, pair: e.target.value }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500 transition outline-none"
                                        >
                                            <option value="B-XAU_USDT">Gold (XAU/USDT)</option>
                                            <option value="B-BTC_USDT">Bitcoin (BTC/USDT)</option>
                                            <option value="B-ETH_USDT">Ethereum (ETH/USDT)</option>
                                            <option value="B-SUSHI_USDT">Sushi (SUSHI/USDT)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Strategy</label>
                                        <select 
                                            value={newConfig.strategyId}
                                            onChange={(e) => setNewConfig(prev => ({ ...prev, strategyId: e.target.value }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500 transition outline-none"
                                        >
                                            {strategies.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Resolution (Minutes)</label>
                                        <select 
                                            value={newConfig.timeInterval}
                                            onChange={(e) => setNewConfig(prev => ({ ...prev, timeInterval: e.target.value }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500 transition outline-none"
                                        >
                                            <option value="1">1 Minute</option>
                                            <option value="5">5 Minutes</option>
                                            <option value="15">15 Minutes</option>
                                            <option value="30">30 Minutes</option>
                                            <option value="60">1 Hour</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Leverage</label>
                                        <input 
                                            type="number"
                                            value={newConfig.leverage}
                                            onChange={(e) => setNewConfig(prev => ({ ...prev, leverage: Number(e.target.value) }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500 transition outline-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Initial Capital ($)</label>
                                        <input 
                                            type="number"
                                            value={newConfig.initialCapital}
                                            onChange={(e) => setNewConfig(prev => ({ ...prev, initialCapital: Number(e.target.value) }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500 transition outline-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Risk Mode</label>
                                        <select 
                                            value={newConfig.riskMode}
                                            onChange={(e) => setNewConfig(prev => ({ ...prev, riskMode: e.target.value as any }))}
                                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-blue-500 transition outline-none"
                                        >
                                            <option value="minimal">Minimal ($6 Notional)</option>
                                            <option value="capital">Full Capital</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-6 pt-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div 
                                            onClick={() => setNewConfig(prev => ({ ...prev, isLiveTrading: !prev.isLiveTrading }))}
                                            className={cn(
                                                "w-12 h-6 rounded-full transition-all relative border",
                                                newConfig.isLiveTrading ? "bg-emerald-500 border-emerald-400" : "bg-slate-800 border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                                                newConfig.isLiveTrading ? "left-7" : "left-1"
                                            )} />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition">Live Trading</span>
                                    </label>
                                </div>
                            </div>

                            <div className="px-8 py-6 bg-slate-950/50 border-t border-white/5 flex items-center justify-end gap-4">
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-3 rounded-xl text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-white/5 transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleCreate}
                                    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs transition shadow-lg shadow-blue-500/20"
                                >
                                    Create Config
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ConfigCard = ({ config, strategyName, onToggle, onDelete }: { 
    config: LiveConfig, 
    strategyName: string, 
    onToggle: () => void,
    onDelete: () => void
}) => {
    return (
        <div className="relative group">
            <div className={cn(
                "absolute -inset-0.5 rounded-[2.5rem] blur opacity-10 transition duration-500 group-hover:opacity-20",
                config.isEnabled ? "bg-blue-500" : "bg-slate-500"
            )}></div>
            
            <div className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden p-8">
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl font-black text-white">{config.pair}</span>
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                config.isEnabled 
                                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                                    : "bg-slate-800 text-slate-500 border-white/5"
                            )}>
                                {config.isEnabled ? 'Active' : 'Paused'}
                            </span>
                        </div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{strategyName}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onToggle}
                            className={cn(
                                "p-3 rounded-2xl transition active:scale-90",
                                config.isEnabled 
                                    ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20" 
                                    : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20"
                            )}
                        >
                            {config.isEnabled ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button 
                            onClick={onDelete}
                            className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 transition active:scale-90"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Stat label="Resolution" value={`${config.timeInterval}m`} icon={<Zap className="w-3 h-3" />} />
                    <Stat label="Capital" value={`$${config.initialCapital}`} icon={<BarChart3 className="w-3 h-3" />} />
                    <Stat label="Leverage" value={`${config.leverage}x`} icon={<Target className="w-3 h-3" />} />
                    <Stat label="Risk" value={config.riskMode} icon={<Shield className="w-3 h-3" />} />
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", config.isLiveTrading ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-700")} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Trade</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                        ID: {config._id.slice(-6)}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Stat = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
    <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl">
        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">
            {icon}
            {label}
        </div>
        <div className="text-sm font-black text-white">{value}</div>
    </div>
);
