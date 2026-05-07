import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import type { Candle, Trade } from "./tradingTypes";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineStyle,
} from "lightweight-charts";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  BarChart3,
  Database,
  Shield,
  Zap,
  Settings2,
  Play,
  PieChart,
  AlertCircle,
  Eye,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  History,
  Activity as Heartbeat,
  Target
} from "lucide-react";
import ErrorLog from "./components/ErrorLog";
import { DailyAnalysisView } from "./components/DailyAnalysisView";
import { FVGDailyAnalysisView } from "./components/FVGDailyAnalysisView";
import { LiveMarketChart } from "./components/LiveMarketChart";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


interface BacktestResponse {
  trades: Trade[];
  summary: {
    totalProfit: number;
    count: number;
    successCount: number;
    failedCount: number;
    winRate: number;
    initialCapital: number;
    finalBalance: number;
  };
  indicators?: any;
}

interface OptimizationResponse {
  best: {
    resolution: string;
    atrMultiplierSL: number;
    totalProfit: number;
    totalTrades: number;
    winRate: number;
    monthlyProfits: {
      year: number;
      month: number;
      profit: number;
      trades: number;
    }[];
  };
  topResults: any[];
  totalTested: number;
  periodChecked: string;
}

interface ApiResponse {
  s: string;
  data: Candle[];
}

interface Strategy {
  id: string;
  name: string;
  description: string;
}




// const API_BASE_URL = window.location.hostname === "localhost" ? "http://localhost:5001/api" : "/api";
// const SOCKET_URL = window.location.hostname === "localhost" ? "http://localhost:5001" : "/";
// const socket = io(SOCKET_URL, { autoConnect: false, transports: ["polling", "websocket"] });


// Replace with your AWS Elastic Beanstalk or EC2 Public IP / Domain
// const SERVER_HOST = "million-dollar-env.eba-caqvuxfh.eu-north-1.elasticbeanstalk.com";

// const API_BASE_URL = `/api`;
// const SOCKET_URL = `/`;

// const API_BASE_URL = `http://million-dollar-env.eba-caqvuxfh.eu-north-1.elasticbeanstalk.com/api`;
// const SOCKET_URL = `http://million-dollar-env.eba-caqvuxfh.eu-north-1.elasticbeanstalk.com`;

const API_BASE_URL = "http://localhost:5001/api"
const SOCKET_URL = "http://localhost:5001"

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  upgrade: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});



function TradeHistoryView({ tickerPrice, currentPair, leverage }: { tickerPrice: number | null, currentPair: string, leverage: number }) {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/trade-history`);
      setTrades(data);
    } catch (err) {
      console.error("Failed to fetch trade history", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryTime: string) => {
    if (!window.confirm("Delete this trade record?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/trade-history/${entryTime}`);
      setTrades(prev => prev.filter(t => t.entryTime !== entryTime));
    } catch (err) {
      console.error("Failed to delete trade", err);
      alert("Delete failed");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("CLEAR ALL trade history? This cannot be undone.")) return;
    try {
      await axios.delete(`${API_BASE_URL}/trade-history/clear`);
      setTrades([]);
    } catch (err) {
      console.error("Failed to clear history", err);
      alert("Clear failed");
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
          <h2 className="text-3xl font-black text-white">Trade History</h2>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">
            Real Executions Log
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleClearAll} className="px-5 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition active:scale-95 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-400">
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
          <button onClick={fetchTrades} className="px-5 py-3 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 transition active:scale-95 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-300">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Reload
          </button>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
            Recorded Trades List ({trades.length})
          </h3>
        </div>
        <div className="max-h-[600px] overflow-auto no-scrollbar">
          {trades.length === 0 ? (
            <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
              No Trades Recorded Yet
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-950/40 sticky top-0 z-10">
                  <th className="px-8 py-5">Date / Time</th>
                  <th className="px-5 py-5">Pair</th>
                  <th className="px-5 py-5">Entry / Exit</th>
                  <th className="px-5 py-5">SL / Units</th>
                  <th className="px-5 py-5 text-center">Trailing</th>
                  <th className="px-5 py-5 text-right">Profit</th>
                  <th className="px-10 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {Array.isArray(trades) && [...trades].sort((a, b) => new Date(b.recordedAt || b.entryTime).getTime() - new Date(a.recordedAt || a.entryTime).getTime()).map(t => {
                  const isExpanded = expandedTradeId === t.entryTime;
                  return (
                    <React.Fragment key={t.entryTime}>
                      <tr className={cn(
                        "transition-colors group",
                        isExpanded ? "bg-blue-500/5" : "bg-slate-900/20 hover:bg-slate-800/40"
                      )}>
                        <td className="px-8 py-4">
                          <div className="text-sm font-bold text-white">{dayjs(t.entryTime).tz('Asia/Kolkata').format("MMM D, YYYY")}</div>
                          <div className="text-[10px] text-slate-500">{dayjs(t.entryTime).tz('Asia/Kolkata').format("HH:mm:ss")} IST</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs font-bold text-slate-300">{t.pair}</div>
                          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{t.type || 'auto'}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className={cn("text-xs font-black uppercase", t.direction === 'buy' ? 'text-emerald-400' : 'text-rose-400')}>
                            {t.direction} @ ${t.entryPrice}
                          </div>
                          {t.exitPrice && (
                            <div className="text-[10px] text-slate-400">
                              Exited @ ${t.exitPrice}
                              <span className="ml-2 opacity-50 italic">({t.exitReason || 'Target Hit'})</span>
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-[10px] font-bold text-rose-400/80">SL: ${t.sl ? t.sl.toFixed(4) : 'N/A'}</div>
                          <div className="text-[10px] text-slate-500">Units: {t.units ? t.units.toFixed(4) : '0'}</div>
                          {t.status === 'failed' && t.executionError && (
                            <div className="mt-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] font-bold text-rose-400 leading-tight">
                              Error: {t.executionError}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => setExpandedTradeId(isExpanded ? null : t.entryTime)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-95 border",
                              isExpanded
                                ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                                : "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                            )}
                          >
                            <Zap className={cn("w-3.5 h-3.5", isExpanded && "text-blue-300")} />
                            <span className="text-xs font-black">{t.trailingCount || 0}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 opacity-50" /> : <ChevronDown className="w-3.5 h-3.5 opacity-50" />}
                          </button>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {(() => {
                            const isTradeOpen = t.status === 'open';
                            let displayProfit = t.profit ?? 0;
                            let displayPnl = t.pnlPercent;

                            const cleanTPair = (t.pair || '').replace('B-', '').toUpperCase();
                            const cleanCPair = (currentPair || '').replace('B-', '').toUpperCase();

                            if (isTradeOpen && tickerPrice && cleanTPair === cleanCPair) {
                              const entryPrice = Number(t.entryPrice) || 0;
                              const diff = t.direction === 'buy' ? (tickerPrice - entryPrice) : (entryPrice - tickerPrice);
                              const units = Number(t.units) || 0;
                              displayProfit = diff * units;
                              displayPnl = entryPrice > 0 ? (diff / entryPrice) * 100 * (Number(leverage) || 1) : 0;
                            }

                            return (
                              <>
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className={cn("text-sm font-black", displayProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                    {displayProfit >= 0 ? '+' : ''}{displayProfit.toFixed(4)}
                                  </span>
                                  {isTradeOpen && tickerPrice && cleanTPair === cleanCPair && (
                                    <div className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                                      <span className="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Live</span>
                                    </div>
                                  )}
                                </div>
                                {displayPnl !== undefined && (
                                  <div className={cn("text-[10px] font-bold", displayPnl >= 0 ? "text-emerald-500/60" : "text-rose-500/60")}>
                                    {displayPnl.toFixed(2)}%
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </td>
                        <td className="px-10 py-4 text-center">
                          <span className={cn("px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest",
                            t.status === 'open' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              t.status === 'failed' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                'bg-slate-800 text-slate-400 border border-white/5')}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <button onClick={() => handleDelete(t.entryTime)} className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90 opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-950/40 border-l-2 border-blue-500/50">
                          <td colSpan={8} className="px-8 py-6">
                            <div className="flex flex-col gap-5">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 pb-3">
                                <History className="w-4 h-4 text-blue-500" />
                                Interactive Trade Lifecycle & Trailing Events
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Step 0: Starting Point */}
                                <div className="relative group">
                                  <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                  <div className="relative p-4 bg-slate-900 rounded-2xl border border-white/5">
                                    <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Initial Setup</div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400">Entry Price</span>
                                        <span className="text-sm font-bold text-white">${t.entryPrice ? t.entryPrice.toFixed(4) : '0.0000'}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400">Initial SL</span>
                                        <span className="text-sm font-bold text-rose-400/80">
                                          {t.initialSL
                                            ? `$${t.initialSL.toFixed(4)}`
                                            : (t.trailingCount === 0 || !t.trailingHistory || t.trailingHistory.length === 0)
                                              ? (t.sl ? `$${t.sl.toFixed(4)}` : 'N/A')
                                              : "Prior to Logs"
                                          }
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Trailing Steps */}
                                {t.trailingHistory && [...t.trailingHistory].sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()).map((h: any, idx: number) => (
                                  <div key={idx} className="relative group animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                    <div className="relative p-4 bg-slate-900 rounded-2xl border border-blue-500/10">
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Trail #{idx + 1}</div>
                                        <div className="text-[9px] font-mono text-slate-600">{dayjs(h.time).tz('Asia/Kolkata').format("HH:mm:ss")} IST</div>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[9px] text-slate-500">Trigger Price</span>
                                          <span className="text-xs font-bold text-slate-300">${h.marketPrice ? h.marketPrice.toFixed(4) : '0.0000'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[9px] text-slate-500">Updated SL</span>
                                          <span className="text-xs font-bold text-emerald-400/90">${h.sl ? h.sl.toFixed(4) : '0.0000'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {/* Final State */}
                                {t.status === 'closed' && (
                                  <div className="relative group">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                    <div className="relative p-4 bg-slate-900 rounded-2xl border border-amber-500/10">
                                      <div className="text-[10px] font-black text-amber-500 uppercase mb-2">Final Execution</div>
                                      <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[10px] text-slate-400">Exit Price</span>
                                          <span className="text-sm font-bold text-amber-400">${t.exitPrice ? t.exitPrice.toFixed(4) : '0.0000'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                          <span className="text-[10px] text-slate-400">Reason</span>
                                          <span className="text-[10px] font-bold text-slate-400">{t.exitReason || 'Target Hit'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [view, setView] = useState<"backtest" | "trade" | "history" | "logs" | "daily" | "fvg-daily">(
    "trade",
  );
  const [candles, setCandles] = useState<Candle[]>([]);
  const [pair, setPair] = useState("B-BTC_USDT");
  const [selectedStrategyId, setSelectedStrategyId] = useState("opening-breakout");
  const [initialCapital, setInitialCapital] = useState(5);
  const [liveInterval, setLiveInterval] = useState("60");
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false);
  const [isLiveTrading, setIsLiveTrading] = useState(false);
  const [riskMode, setRiskMode] = useState<"minimal" | "capital">("minimal");
  const [tickerPrice, setTickerPrice] = useState<number | null>(null);

  const [startDate, setStartDate] = useState(dayjs.utc().startOf("month").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs.utc().format("YYYY-MM-DD"));
  const [backtestTimezone, setBacktestTimezone] = useState<"UTC" | "IST">("UTC");
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [isBankruptcy, setIsBankruptcy] = useState(false);
  const [dynamicMaxLeverage, setDynamicMaxLeverage] = useState<number | null>(null);
  const isSettingsLoaded = useRef(false);

  // Removed hardcoded pair-strategy relationships to allow all pairs to use any strategy


  // Persistence Effects (Sync with Backend)
  const updateBackendSettings = async (updates: any) => {
    if (!isSettingsLoaded.current) return;
    try {
      await axios.post(`${API_BASE_URL}/settings`, updates);
    } catch (err) {
      console.error("Failed to update backend settings:", err);
    }
  };

  useEffect(() => {
    updateBackendSettings({ pair });
  }, [pair]);

  useEffect(() => {
    updateBackendSettings({ selectedStrategyId });
  }, [selectedStrategyId]);

  useEffect(() => {
    updateBackendSettings({ initialCapital });
  }, [initialCapital]);

  useEffect(() => {
    updateBackendSettings({ timeInterval: liveInterval });
  }, [liveInterval]);

  useEffect(() => {
    updateBackendSettings({ isLiveMonitoring });
  }, [isLiveMonitoring]);

  useEffect(() => {
    updateBackendSettings({ isLiveTrading });
  }, [isLiveTrading]);

  useEffect(() => {
    updateBackendSettings({ riskMode });
  }, [riskMode]);

  // Leverage & Trailing SL
  const [maxPositionSize, setMaxPositionSize] = useState(100);
  const [leverage, setLeverage] = useState(0);
  const [trailingSL, setTrailingSL] = useState(true);

  useEffect(() => {
    updateBackendSettings({ leverage });
  }, [leverage]);

  useEffect(() => {
    updateBackendSettings({ maxPositionSize });
  }, [maxPositionSize]);

  useEffect(() => {
    updateBackendSettings({ trailingSL });
  }, [trailingSL]);

  const [backtestResult, setBacktestResult] = useState<BacktestResponse | null>(
    null,
  );
  const [optimizationResult, setOptimizationResult] =
    useState<OptimizationResponse | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedTradeForView, setSelectedTradeForView] =
    useState<Trade | null>(null);
  const [expandedBacktestTradeId, setExpandedBacktestTradeId] =
    useState<string | null>(null);
  const [selectedTradeForChart, setSelectedTradeForChart] =
    useState<Trade | null>(null);
  const [configTab, setConfigTab] = useState<"manual" | "optimize">("manual");
  const [startYear, setStartYear] = useState(new Date().getFullYear() - 3);
  const [isSilent, setIsSilent] = useState(false);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);

  // Audio Alert
  // const playAlert = useCallback(() => {
  //   if (isSilent) return;
  //   const audio = new Audio("/cash_register.mp3");
  //   audio.play().catch((err) => console.error("Audio playback failed:", err));
  // }, [isSilent]);


  const fetchStrategies = async () => {
    try {
      const response = await axios.get<Strategy[]>(
        `${API_BASE_URL}/market/strategies`,
      );
      setStrategies(response.data);
      if (response.data.length > 0) {
        setSelectedStrategyId(response.data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch strategies:", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`);
      const s = response.data;
      if (s.pair) setPair(s.pair);
      if (s.selectedStrategyId) setSelectedStrategyId(s.selectedStrategyId);
      if (s.initialCapital) setInitialCapital(s.initialCapital);
      if (s.timeInterval) setLiveInterval(s.timeInterval);
      if (s.isLiveMonitoring !== undefined) setIsLiveMonitoring(s.isLiveMonitoring);
      if (s.isLiveTrading !== undefined) setIsLiveTrading(s.isLiveTrading);
      if (s.leverage !== undefined) setLeverage(s.leverage);
      if (s.maxPositionSize !== undefined) setMaxPositionSize(s.maxPositionSize);
      if (s.trailingSL !== undefined) setTrailingSL(s.trailingSL);
      if (s.riskMode) setRiskMode(s.riskMode);
      isSettingsLoaded.current = true;
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      isSettingsLoaded.current = true; // Still allow updates even if fetch fails
    }
  };



  const fetchTradeHistory = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/trade-history`);
      setTradeHistory(data);
    } catch (err) {
      console.error("Failed to fetch trade history", err);
    }
  };

  useEffect(() => {
    fetchStrategies();
    fetchSettings();
    fetchTradeHistory();
  }, []);
  const fetchMarketData = async () => {
    try {
      const response = await axios.get<ApiResponse>(
        `${API_BASE_URL}/market/market-data`,
        {
          params: {
            pair,
            resolution: liveInterval,
            isTest: isLiveMonitoring,
          },
        },
      );
      if (response.data.s === "ok") {
        setCandles([...response.data.data].sort((a, b) => b.time - a.time));
      }
    } catch (err) {
      console.error("fetchMarketData failed:", err);
    }
  };

  const fetchDynamicLeverage = async () => {
    try {
      const response = await axios.get<{ leverage: number }>(
        `${API_BASE_URL}/market/leverage/${pair}`,
      );
      console.log(response.data, 'response.data.----')
      setDynamicMaxLeverage(response.data.leverage);
    } catch (err) {
      console.error("Leverage fetch failed:", err);
      setDynamicMaxLeverage(null);
    }
  };

  const runBacktest = async () => {
    try {
      setIsBacktesting(true);
      let strategyParams: any = {};
      if (selectedStrategyId === "opening-breakout") {
        strategyParams = {};
      }

      const response = await axios.post<BacktestResponse>(
        `${API_BASE_URL}/market/backtest`,
        {
          pair,
          resolution: liveInterval,
          strategyId: selectedStrategyId,
          startDate,
          endDate,
          capital: initialCapital,
          maxPositionSize,
          leverage,
          trailingSL,
          timezone: backtestTimezone,
          isLive: isLiveMonitoring,
          ...strategyParams,
        },
      );
      setBacktestResult(response.data);
      setView("backtest");
    } catch (err) {
      console.error(err);
    } finally {
      setIsBacktesting(false);
    }
  };

  const handleManualTrade = async (side: "buy" | "sell") => {
    console.log(`[ManualTrade] 🚀 Initiating manual ${side} order...`);
    console.log(`[ManualTrade] 📍 Pair: ${pair}, Price: ${tickerPrice}, Capital: ${initialCapital}`);

    // if (!tickerPrice) {
    //   console.warn("[ManualTrade] ⚠️ Ticker price is missing, aborting.");
    //   return;
    // }

    try {
      const payload = {
        side,
        pair: pair.replace("B-", "").replace("_", ""),
        price: 0.1946,
        capital: initialCapital,
      };

      console.log(`[ManualTrade] 📤 Sending POST request to ${API_BASE_URL}/trade/execute`, payload);

      const res = await axios.post(`${API_BASE_URL}/trade/execute`, payload);

      console.log(`[ManualTrade] ✅ Order Response:`, res.data);
      alert(`Manual ${side === "buy" ? "Buy" : "Sell/Close"} Order: ${JSON.stringify(res.data)}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      console.error(`[ManualTrade] ❌ Manual ${side} Failed:`, msg, err);
      alert(`Manual ${side === "buy" ? "Buy" : "Sell"} Failed: ${msg}`);
    }
  };

  const handleCheckBalance = async () => {
    console.log("[Balance] 💰 Checking account balances...");
    try {
      // In your previous code you used /user/balances, but based on backend routes it should be /trade/balances
      console.log(`[Balance] 📤 Sending POST request to ${API_BASE_URL}/trade/balances`);
      const res = await axios.post(`${API_BASE_URL}/trade/balances`);
      console.log("[Balance] ✅ Balance Response:", res.data);

      const inrBalance = res.data.find((b: any) => b.currency === "INR");
      const dogeBalance = res.data.find((b: any) => b.currency === "DOGE");

      alert(`Balances:\nINR: ${inrBalance?.balance || 0}\nDOGE: ${dogeBalance?.balance || 0}\n\nFull Response: ${JSON.stringify(res.data)}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      console.error("[Balance] ❌ Balance Check Failed:", msg, err);
      alert(`Balance Check Failed: ${msg}`);
    }
  };

  const handleOptimize = async () => {
    try {
      setIsOptimizing(true);
      const response = await axios.post<OptimizationResponse>(
        `${API_BASE_URL}/backtest/optimize`,
        {
          pair,
          startYear,
          resolutions: ["5", "15", "30"],
          atrMultipliers: [1, 2, 3, 4, 5],
          capital: initialCapital,
          maxPositionSize,
          leverage,
          trailingSL,
        },
      );
      setOptimizationResult(response.data);
      // If we found a best config, let's update the current settings to match it
      if (response.data.best) {
        setLiveInterval(response.data.best.resolution);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    fetchDynamicLeverage();
  }, [pair, isLiveMonitoring]);

  // Polling for Live Monitoring
  useEffect(() => {
    let candleIntervalId: any;

    if (isLiveMonitoring && view === "trade") {
      // Initial fetch
      fetchMarketData();

      // Setup WebSocket Link
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit("subscribe", pair);

      const handlePriceChange = (data: any) => {
        const rawPrice = data.p || data.price || data.last_price;
        const incomingM = (data.m || '').replace('B-', '').toUpperCase();
        const currentP = (pair || '').replace('B-', '').toUpperCase();

        if (rawPrice && (incomingM === currentP || !data.m)) {
          const price = parseFloat(rawPrice);
          setTickerPrice(price);
          setCandles((prev) => {
            if (prev.length === 0) return prev;
            const newCandles = [...prev];
            const last = { ...newCandles[0] };
            last.close = price;
            if (price > last.high) last.high = price;
            if (price < last.low) last.low = price;
            newCandles[0] = last;
            return newCandles;
          });
        }
      };

      socket.on("price-change", handlePriceChange);
      socket.on("candlestick", (data) => {
        if (data && data.time) {
          setCandles((prev) => {
            // Update existing candle or prepend new one
            const index = prev.findIndex(c => c.time === data.time);
            if (index !== -1) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...data };
              return updated;
            }
            return [data, ...prev];
          });
        }
      });

      // Fetch live balance for compounding/bankruptcy
      const fetchInitialBalance = async () => {
        try {
          const res = await axios.post(`${API_BASE_URL}/trade/balances`);
          const inrBalance = res.data.find((b: any) => b.currency === "INR");
          if (inrBalance) {
            setLiveBalance(parseFloat(inrBalance.balance));
            if (parseFloat(inrBalance.balance) <= 0) setIsBankruptcy(true);
          }
        } catch (err) {
          console.error("fetchInitialBalance failed:", err);
        }
      };
      fetchInitialBalance();

      // Poll candles regularly to refresh chart
      candleIntervalId = window.setInterval(() => {
        fetchMarketData();
      }, 60000);

    }

    return () => {
      socket.off("price-change");
      socket.off("candlestick");
      socket.disconnect();
      if (candleIntervalId) clearInterval(candleIntervalId);
    };
  }, [
    isLiveMonitoring,
    view,
    pair,
    selectedStrategyId,
    initialCapital,
    liveInterval,
  ]);

  useEffect(() => {
    socket.on("trade-history-update", () => {
      console.log("Trade history updated on backend, refreshing...");
      fetchTradeHistory();
    });
    return () => {
      socket.off("trade-history-update");
    };
  }, []);

  const tradesByDay = useMemo(() => {
    if (!backtestResult) return {};
    return backtestResult.trades.reduce(
      (acc, trade: any) => {
        const day = dayjs(trade.entryTime).tz(backtestTimezone === 'IST' ? 'Asia/Kolkata' : 'UTC').format("YYYY-MM-DD");
        if (!acc[day])
          acc[day] = { trades: [], profit: 0, success: 0, failure: 0 };
        acc[day].trades.push(trade);
        acc[day].profit += (trade.profit ?? 0);
        if ((trade.profit ?? 0) > 0) acc[day].success++;
        else acc[day].failure++;
        return acc;
      },
      {} as Record<
        string,
        { trades: Trade[]; profit: number; success: number; failure: number }
      >,
    );
  }, [backtestResult]);

  const combinedActiveTrades = useMemo(() => {
    const backtestOpen = Array.isArray(backtestResult?.trades) ? backtestResult.trades.filter(t => t?.status === 'open') : [];
    const liveOpen = Array.isArray(tradeHistory) ? tradeHistory.filter(t => t?.status === 'open') : [];

    // De-duplicate by entryTime to avoid double showing
    const seen = new Set();
    const combined: Trade[] = [];

    [...liveOpen, ...backtestOpen].forEach(t => {
      const key = `${t.entryTime}-${t.direction}`;
      if (!seen.has(key)) {
        seen.add(key);
        const trade: Trade = { ...t };
        // Recalculate profit if ticker price is available for open positions
        if (trade.status === 'open' && tickerPrice) {
          const diff = trade.direction === 'buy' ? (tickerPrice - trade.entryPrice) : (trade.entryPrice - tickerPrice);
          // If units not present, estimate from current capital setting
          const currentLeverage = leverage || 1;
          const units = trade.units || (initialCapital * currentLeverage / trade.entryPrice);
          trade.profit = diff * units;

          const margin = (units * trade.entryPrice) / currentLeverage;
          trade.pnlPercent = ((trade.profit ?? 0) / margin) * 100;
        }
        combined.push(trade);
      }
    });

    return combined;
  }, [backtestResult, tradeHistory, tickerPrice, initialCapital]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Background decoration */}
      <AnimatePresence>
        {selectedTradeForView && (
          <TradeViewModal
            trade={selectedTradeForView}
            pair={pair}
            resolution={liveInterval}
            onClose={() => setSelectedTradeForView(null)}
            isLiveMonitoring={isLiveMonitoring}
            backtestTimezone={backtestTimezone}
          />
        )}
      </AnimatePresence>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <nav className="relative border-b border-white/5 backdrop-blur-xl bg-slate-950/70 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="hidden xs:block">
              <span className="font-bold text-base sm:text-xl tracking-tight block leading-none">
                Resistance<span className="text-blue-400">Terminal</span>
              </span>
              <span className="text-[8px] sm:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] leading-none mt-1">
                Intelligence Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
            <ViewToggle
              active={view === "trade"}
              onClick={() => setView("trade")}
              icon={Zap}
              label="Trade"
            />
            <ViewToggle
              active={view === "backtest"}
              onClick={() => setView("backtest")}
              icon={Settings2}
              label="Test"
            />
            <ViewToggle
              active={view === "history"}
              onClick={() => setView("history")}
              icon={Database}
              label="History"
            />
            <ViewToggle
              active={view === "logs"}
              onClick={() => setView("logs")}
              icon={Heartbeat}
              label="Logs"
            />
            <ViewToggle
              active={view === "daily"}
              onClick={() => setView("daily")}
              icon={Target}
              label="Gold"
            />
            <ViewToggle
              active={view === "fvg-daily"}
              onClick={() => setView("fvg-daily")}
              icon={Activity}
              label="FVG"
            />
          </div>

          <div className="hidden md:flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/50 border border-white/5 text-xs font-bold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              NODE ACTIVE
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Main Views */}
        {view === "backtest" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            {/* Control Panel */}
            <div className="space-y-8">
              <div className="p-8 bg-slate-900/60 border border-white/10 rounded-[2.5rem] shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/20">
                    <Settings2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight">
                    Configuration
                  </h2>
                </div>

                <div className="flex bg-slate-950/50 p-1 rounded-2xl border border-white/5 mb-8">
                  <button
                    onClick={() => setConfigTab("manual")}
                    className={cn(
                      "flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      configTab === "manual"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-500 hover:text-slate-300",
                    )}
                  >
                    Manual Test
                  </button>
                  <button
                    onClick={() => setConfigTab("optimize")}
                    className={cn(
                      "flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      configTab === "optimize"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-500 hover:text-slate-300",
                    )}
                  >
                    Auto Optimize
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Strategy Selection (Common) */}
                  <div className="flex bg-slate-950/50 p-1 rounded-2xl border border-white/5 mb-4">
                    {Array.isArray(strategies) && strategies.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedStrategyId(s.id);
                          setBacktestResult(null);
                        }}
                        className={cn(
                          "flex-1 py-2.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                          selectedStrategyId === s.id
                            ? "bg-slate-800 text-white shadow-lg"
                            : "text-slate-500 hover:text-slate-300",
                        )}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>

                  {configTab === "manual" ? (
                    <motion.div
                      key="manual-fields"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {!isLiveMonitoring && (
                        <div className="grid grid-cols-2 gap-4">
                          <InputGroup label="Start Date" sub="Target start">
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none [color-scheme:dark]"
                            />
                          </InputGroup>
                          <InputGroup label="End Date" sub="Target end">
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none [color-scheme:dark]"
                            />
                          </InputGroup>
                        </div>
                      )}

                      <InputGroup label="Interval" sub="Candle timeframe">
                        <select
                          value={liveInterval}
                          onChange={(e) => setLiveInterval(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none"
                        >
                          {["1", "5", "15", "30", "60", "D"].map((i) => (
                            <option key={i} value={i}>
                              {i === "D" ? "1 Day" : i + " Min"}
                            </option>
                          ))}
                        </select>
                      </InputGroup>

                      <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Capital ($)" sub="Total balance">
                          <input
                            type="number"
                            value={initialCapital}
                            onChange={(e) =>
                              setInitialCapital(Number(e.target.value))
                            }
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none"
                          />
                        </InputGroup>
                        <InputGroup label="Pos Size %" sub="Of capital">
                          <input
                            type="number"
                            value={maxPositionSize}
                            onChange={(e) =>
                              setMaxPositionSize(Number(e.target.value))
                            }
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none"
                          />
                        </InputGroup>
                        <InputGroup
                          label="Leverage"
                          sub={dynamicMaxLeverage ? `Max: ${dynamicMaxLeverage}x (Enter 0 for Max)` : "0 = Dynamic Max"}
                        >
                          <input
                            type="number"
                            value={leverage}
                            onChange={(e) =>
                              setLeverage(Number(e.target.value))
                            }
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none"
                          />
                        </InputGroup>
                      </div>

                      <div className="flex items-center justify-between px-2 py-2">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Risk Mode: {riskMode === 'capital' ? 'Manual Capital' : 'Minimal Notional'}
                          </span>
                        </div>
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
                          <button
                            onClick={() => setRiskMode("minimal")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                              riskMode === "minimal" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                          >
                            Minimal
                          </button>
                          <button
                            onClick={() => setRiskMode("capital")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                              riskMode === "capital" ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                          >
                            Capital
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-2 py-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Timezone: {backtestTimezone}
                          </span>
                        </div>
                        <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
                          <button
                            onClick={() => setBacktestTimezone("UTC")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                              backtestTimezone === "UTC" ? "bg-blue-600 text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                          >
                            UTC
                          </button>
                          <button
                            onClick={() => setBacktestTimezone("IST")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                              backtestTimezone === "IST" ? "bg-amber-600 text-white" : "text-slate-500 hover:text-slate-300"
                            )}
                          >
                            IST
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-2 py-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Trailing Stop Loss
                          </span>
                        </div>
                        <button
                          onClick={() => setTrailingSL(!trailingSL)}
                          className={cn(
                            "w-12 h-6 rounded-full transition-all relative",
                            trailingSL ? "bg-blue-600" : "bg-slate-800",
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                              trailingSL ? "left-7" : "left-1",
                            )}
                          />
                        </button>
                      </div>

                      <div className="h-px w-full bg-white/5 my-4" />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Live Trading Mode
                            </span>
                          </div>
                          <button
                            onClick={() => setIsLiveTrading(!isLiveTrading)}
                            className={cn(
                              "w-12 h-6 rounded-full transition-all relative",
                              isLiveTrading ? "bg-emerald-600" : "bg-slate-800",
                            )}
                          >
                            <div
                              className={cn(
                                "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                                isLiveTrading ? "left-7" : "left-1",
                              )}
                            />
                          </button>
                        </div>

                        {isLiveTrading && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-4"
                          >
                            <div className="p-4 border rounded-2xl space-y-2 bg-emerald-500/5 border-emerald-500/10">
                              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                Live Auto-Trade Active
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                                Trading with real funds. Ensure your backend .env is configured with API credentials.
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <button
                                onClick={() => handleManualTrade("buy")}
                                className="py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                              >
                                Manual Buy
                              </button>
                              <button
                                onClick={() => handleManualTrade("sell")}
                                className="py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-rose-600/20"
                              >
                                Manual Sell
                              </button>
                              <button
                                onClick={handleCheckBalance}
                                className="col-span-2 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-white/5"
                              >
                                Check Balance
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <button
                        onClick={() => runBacktest()}
                        disabled={isBacktesting || isOptimizing}
                        className={cn(
                          "w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-slate-800",
                          isLiveTrading
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20",
                        )}
                      >
                        {isBacktesting ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Play className="w-5 h-5 fill-current" />
                        )}
                        {isBacktesting
                          ? "Computing..."
                          : isLiveTrading
                            ? "Start Live Trading"
                            : "Run Simulation"}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="optimize-fields"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <InputGroup label="Start Year" sub="Optimization range">
                        <select
                          value={startYear}
                          onChange={(e) => setStartYear(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none"
                        >
                          {[2021, 2022, 2023, 2024, 2025, 2026].map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </InputGroup>

                      <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Capital ($)" sub="Total balance">
                          <input
                            type="number"
                            value={initialCapital}
                            onChange={(e) =>
                              setInitialCapital(Number(e.target.value))
                            }
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none"
                          />
                        </InputGroup>
                        <InputGroup label="Pos Size %" sub="Of capital">
                          <input
                            type="number"
                            value={maxPositionSize}
                            onChange={(e) =>
                              setMaxPositionSize(Number(e.target.value))
                            }
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none"
                          />
                        </InputGroup>
                        <InputGroup
                          label="Leverage"
                          sub={dynamicMaxLeverage ? `Max: ${dynamicMaxLeverage}x (Enter 0 for Max)` : "0 = Dynamic Max"}
                        >
                          <input
                            type="number"
                            value={leverage}
                            onChange={(e) =>
                              setLeverage(Number(e.target.value))
                            }
                            className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none"
                          />
                        </InputGroup>
                      </div>

                      <div className="p-6 bg-indigo-600/5 border border-indigo-500/10 rounded-3xl">
                        <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2">
                          Optimization Scope
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          This will test multiple resolutions and ATR
                          multipliers month-by-month for 3 years starting from{" "}
                          {startYear}.
                        </p>
                      </div>

                      <button
                        onClick={handleOptimize}
                        disabled={isBacktesting || isOptimizing}
                        className="w-full py-5 rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:bg-slate-800"
                      >
                        {isOptimizing ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Zap className="w-5 h-5 fill-current" />
                        )}
                        {isOptimizing ? "Optimizing..." : "Find Best Config"}
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {optimizationResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] space-y-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-black text-sm uppercase tracking-widest text-indigo-200">
                      Best Configuration Found
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">
                        Resolution
                      </p>
                      <p className="text-xl font-black text-white">
                        {optimizationResult.best.resolution}M
                      </p>
                    </div>
                    <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">
                        ATR Mult
                      </p>
                      <p className="text-xl font-black text-white">
                        {optimizationResult.best.atrMultiplierSL}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">
                      Total 3Y Profit
                    </p>
                    <p className="text-2xl font-black text-emerald-400">
                      $
                      {optimizationResult.best.totalProfit.toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 },
                      )}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1">
                      WIN RATE: {optimizationResult.best.winRate.toFixed(4)}%
                    </p>
                  </div>
                  <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest">
                    Checked: {optimizationResult.periodChecked}
                  </p>
                </motion.div>
              )}

              <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-[2.5rem] flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-200 mb-1">
                    Backtesting Engine
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Simulated using direct historical data from CoinDCX. Results
                    may vary based on live slippage and execution latencies.
                  </p>
                </div>
              </div>
            </div>

            {/* Results Display */}
            <div className="lg:col-span-2 space-y-8">
              {!backtestResult ? (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] text-slate-600 p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                    <PieChart className="w-10 h-10 opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400 mb-2">
                    No Results Available
                  </h3>
                  <p className="max-w-xs text-sm">
                    Configure your strategy parameters on the left and run the
                    simulation to see historical performance.
                  </p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <ResultCard
                      title="Final Balance"
                      value={`$${backtestResult.summary.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`}
                      icon={Database}
                      color={
                        backtestResult.summary.finalBalance >= backtestResult.summary.initialCapital
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    />
                    <ResultCard
                      title="Total P/L"
                      value={`$${backtestResult.summary.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`}
                      icon={TrendingUp}
                      color={
                        backtestResult?.summary?.totalProfit >= 0
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }
                    />
                    <ResultCard
                      title="Success"
                      value={backtestResult?.summary?.successCount?.toString()}
                      icon={Zap}
                      color="text-emerald-400"
                    />
                    <ResultCard
                      title="Failed"
                      value={backtestResult?.summary?.failedCount?.toString()}
                      icon={AlertCircle}
                      color="text-rose-400"
                    />
                    <ResultCard
                      title="Win Rate"
                      value={`${backtestResult.summary.winRate.toFixed(4)}%`}
                      icon={RefreshCw}
                      color="text-blue-400"
                    />
                  </div>

                  <div className="bg-slate-900/40 border border-white/10 rounded-[2.5rem] overflow-hidden">
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                        Trade Execution Log
                      </h3>
                      <div className="p-2 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-500">
                        {pair}
                      </div>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-950/40 sticky top-0 z-10">
                            <th className="px-8 py-5">Time/Type</th>
                            <th className="px-5 py-5">Entry / Exit</th>
                            <th className="px-5 py-5">SL / Units</th>
                            <th className="px-5 py-5 text-center">Trailing</th>
                            <th className="px-5 py-5 text-right">Net Profit</th>
                            <th className="px-10 py-5 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {Object.entries(tradesByDay)
                            .sort((a, b) => b[0].localeCompare(a[0]))
                            .map(([day, data]) => (
                              <React.Fragment key={day}>
                                {/* Daily Summary Header */}
                                <tr className="bg-slate-900/60 border-y border-white/5 group">
                                  <td colSpan={2} className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <Clock className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5 leading-none">
                                          Execution Date
                                        </div>
                                        <div className="text-sm font-bold text-slate-100">
                                          {dayjs(day).tz(backtestTimezone === 'IST' ? 'Asia/Kolkata' : 'UTC').format("MMM D, YYYY")}
                                        </div>
                                      </div>
                                      <div className="h-8 w-px bg-white/5 ml-4" />
                                      <div className="flex items-center gap-6 ml-4">
                                        <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          <span className="text-[9px] font-black uppercase text-slate-500">
                                            {data.success}{" "}
                                            <span className="opacity-60">
                                              Wins
                                            </span>
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                          <span className="text-[9px] font-black uppercase text-slate-500">
                                            {data.failure}{" "}
                                            <span className="opacity-60">
                                              Losses
                                            </span>
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td
                                    colSpan={2}
                                    className="px-8 py-5 text-right"
                                  >
                                    <div className="inline-flex flex-col items-end">
                                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5 leading-none">
                                        Daily Performance
                                      </div>
                                      <div
                                        className={cn(
                                          "text-lg font-black tracking-tight",
                                          data.profit >= 0
                                            ? "text-emerald-400"
                                            : "text-rose-400",
                                        )}
                                      >
                                        {data.profit >= 0 ? "+" : ""}
                                        {data.profit.toLocaleString(undefined, {
                                          minimumFractionDigits: 4,
                                          maximumFractionDigits: 4,
                                        })}
                                      </div>
                                    </div>
                                  </td>
                                  <td></td>
                                </tr>

                                {/* Daily Trades */}
                                {data.trades
                                  .sort(
                                    (a, b) =>
                                      dayjs(b.entryTime).valueOf() -
                                      dayjs(a.entryTime).valueOf(),
                                  )
                                  .map((trade, idx) => {
                                    const isExpanded = expandedBacktestTradeId === trade.entryTime;
                                    return (
                                      <React.Fragment key={`${day}-${idx}`}>
                                        <tr
                                          className={cn(
                                            "group transition-colors border-b border-white/5 last:border-0",
                                            isExpanded ? "bg-blue-500/5" : "hover:bg-white/[0.02]"
                                          )}
                                        >
                                          <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                              <div
                                                className={cn(
                                                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                                                  trade.direction === "buy"
                                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                                    : "bg-rose-500/10 border-rose-500/20 text-rose-400",
                                                )}
                                              >
                                                {trade.direction === "buy" ? (
                                                  <TrendingUp className="w-5 h-5" />
                                                ) : (
                                                  <TrendingDown className="w-5 h-5" />
                                                )}
                                              </div>
                                              <div>
                                                <div className="text-sm font-bold text-white capitalize">
                                                  {trade.direction} Position
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-tighter mt-1">
                                                  {dayjs(trade.entryTime).tz(backtestTimezone === 'IST' ? 'Asia/Kolkata' : 'UTC').format("HH:mm:ss")} {backtestTimezone}
                                                </div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-5 py-6">
                                            <div className={cn("text-xs font-black uppercase", trade.direction === 'buy' ? 'text-emerald-400' : 'text-rose-400')}>
                                              {trade.direction} @ ${trade.entryPrice.toFixed(4)}
                                            </div>
                                            {trade.exitPrice && (
                                              <div className="text-[10px] text-slate-400 mt-1">
                                                Exited @ ${trade.exitPrice.toFixed(4)}
                                                <span className="ml-2 opacity-50 italic">({trade.exitReason || 'Target Hit'})</span>
                                              </div>
                                            )}
                                          </td>
                                          <td className="px-5 py-6">
                                            <div className="text-[10px] font-bold text-rose-400/80">SL: ${trade.sl?.toFixed(4) || 'N/A'}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">Units: {trade.units?.toFixed(4) || '0'}</div>
                                          </td>
                                          <td className="px-5 py-6 text-center">
                                            <button
                                              onClick={() => setExpandedBacktestTradeId(isExpanded ? null : trade.entryTime)}
                                              className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-95 border",
                                                isExpanded
                                                  ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                                                  : "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                                              )}
                                            >
                                              <Zap className={cn("w-3.5 h-3.5", isExpanded && "text-blue-300")} />
                                              <span className="text-xs font-black">{trade.trailingCount || 0}</span>
                                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 opacity-50" /> : <ChevronDown className="w-3.5 h-3.5 opacity-50" />}
                                            </button>
                                          </td>
                                          <td
                                            className={cn(
                                              "px-5 py-6 text-right font-black text-sm",
                                              (trade.profit ?? 0) > 0
                                                ? "text-emerald-400"
                                                : "text-rose-400",
                                            )}
                                          >
                                            {(trade.profit ?? 0) > 0 ? "+" : ""}
                                            {(trade.profit ?? 0).toLocaleString(
                                              undefined,
                                              {
                                                minimumFractionDigits: 4,
                                                maximumFractionDigits: 4,
                                              },
                                            )}
                                          </td>
                                          <td className="px-10 py-6 text-center">
                                            <button
                                              onClick={() =>
                                                setSelectedTradeForView(trade)
                                              }
                                              className="p-3 rounded-xl bg-slate-800 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 border border-white/5 transition-all shadow-lg active:scale-95"
                                              title="View on Chart"
                                            >
                                              <Eye className="w-5 h-5" />
                                            </button>
                                          </td>
                                        </tr>
                                        {isExpanded && (
                                          <tr className="bg-slate-950/40 border-l-2 border-blue-500/50">
                                            <td colSpan={6} className="px-8 py-6">
                                              <div className="flex flex-col gap-5">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5 pb-3">
                                                  <History className="w-4 h-4 text-blue-500" />
                                                  Interactive Trade Lifecycle & Trailing Events
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                  {/* Step 0: Starting Point */}
                                                  <div className="relative group">
                                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                                    <div className="relative p-4 bg-slate-900 rounded-2xl border border-white/5">
                                                      <div className="text-[10px] font-black text-slate-500 uppercase mb-2">Initial Setup</div>
                                                      <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                          <span className="text-[10px] text-slate-400">Entry Price</span>
                                                          <span className="text-sm font-bold text-white">${trade.entryPrice.toFixed(4)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                          <span className="text-[10px] text-slate-400">Initial SL</span>
                                                          <span className="text-sm font-bold text-rose-400/80">
                                                            {trade.initialSL
                                                              ? `$${trade.initialSL.toFixed(4)}`
                                                              : (trade.trailingCount === 0 || !trade.trailingHistory || trade.trailingHistory.length === 0)
                                                                ? `$${trade.sl?.toFixed(4)}`
                                                                : "Prior to Logs"
                                                            }
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>

                                                  {/* Trailing Steps */}
                                                  {trade.trailingHistory && [...trade.trailingHistory].sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()).map((h: any, idx: number) => (
                                                    <div key={idx} className="relative group animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                                      <div className="relative p-4 bg-slate-900 rounded-2xl border border-blue-500/10">
                                                        <div className="flex justify-between items-center mb-2">
                                                          <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Trail #{idx + 1}</div>
                                                          <div className="text-[9px] font-mono text-slate-600">{dayjs(h.time).tz(backtestTimezone === 'IST' ? 'Asia/Kolkata' : 'UTC').format("HH:mm:ss")}</div>
                                                        </div>
                                                        <div className="space-y-1">
                                                          <div className="flex justify-between items-center">
                                                            <span className="text-[9px] text-slate-500">Trigger</span>
                                                            <span className="text-xs font-bold text-slate-300">${h.marketPrice.toFixed(4)}</span>
                                                          </div>
                                                          <div className="flex justify-between items-center">
                                                            <span className="text-[9px] text-slate-500">Updated SL</span>
                                                            <span className="text-xs font-bold text-emerald-400/90">${h.sl.toFixed(4)}</span>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}

                                                  {/* Final State */}
                                                  {trade.status === 'closed' && (
                                                    <div className="relative group">
                                                      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                                      <div className="relative p-4 bg-slate-900 rounded-2xl border border-amber-500/10">
                                                        <div className="text-[10px] font-black text-amber-500 uppercase mb-2">Final Execution</div>
                                                        <div className="space-y-1">
                                                          <div className="flex justify-between items-center">
                                                            <span className="text-[10px] text-slate-400">Exit Price</span>
                                                            <span className="text-sm font-bold text-amber-400">${(trade.exitPrice || 0).toFixed(4)}</span>
                                                          </div>
                                                          <div className="flex justify-between items-center">
                                                            <span className="text-[10px] text-slate-400">Reason</span>
                                                            <span className="text-[10px] font-bold text-slate-400">{trade.exitReason || 'Target Hit'}</span>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                              </React.Fragment>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}


        {view === "trade" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-10"
          >
            {/* Terminal Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    Execution Terminal
                  </span>
                  <div className="h-px w-8 bg-slate-800" />
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-none">
                    Live Strategy Engine
                  </span>
                  {isBankruptcy && (
                    <span className="ml-4 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-black text-rose-400 uppercase tracking-widest animate-bounce">
                      BANKRUPTCY TRIPPED
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-br from-white via-slate-200 to-emerald-500 bg-clip-text text-transparent">
                  Live Trade Console
                </h1>
              </div>

              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10">
                <div className="w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                  <div className="flex items-center gap-2 bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 w-max">
                    {[
                      "B-BTC_USDT",
                      "B-ETH_USDT",
                      "B-SUSHI_USDT",
                      "B-XAU_USDT",
                    ].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPair(p)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap",
                          pair === p
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                            : "text-slate-500 hover:text-slate-200 hover:bg-white/5",
                        )}
                      >
                        {p.split("-")[1].replace("_", "/")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-4 w-full lg:w-auto justify-between lg:justify-end">
                  <div className="flex items-center gap-4">
                    {liveBalance !== null && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                        <Database className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-black text-blue-400 font-mono">
                          {liveBalance.toLocaleString()} INR
                        </span>
                      </div>
                    )}
                    {tickerPrice && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black text-emerald-400 font-mono">
                          ${tickerPrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsSilent(!isSilent)}
                    className={cn(
                      "p-3 rounded-2xl border transition-all active:scale-95",
                      isSilent
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-400",
                    )}
                  >
                    {isSilent ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Terminal Body */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Sidebar: Controls & Status */}
              <aside className="lg:col-span-1 space-y-6">
                {/* Strategy Control */}
                <div className="p-8 bg-slate-900/60 border border-white/10 rounded-[2.5rem] shadow-2xl space-y-8">
                  <section>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-emerald-500" />{" "}
                      Strategy Configuration
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Live Monitor
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isLiveMonitoring}
                            onChange={(e) =>
                              setIsLiveMonitoring(e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Auto-Trade
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isLiveTrading}
                            onChange={(e) => setIsLiveTrading(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                        </label>
                      </div>

                      <InputGroup label="Select Strategy" sub="Active logic">
                        <select
                          value={selectedStrategyId}
                          onChange={(e) =>
                            setSelectedStrategyId(e.target.value)
                          }
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none"
                        >
                          {Array.isArray(strategies) && strategies.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </InputGroup>

                      <InputGroup label="Time Interval" sub="Candle timeframe">
                        <div className="grid grid-cols-3 gap-2">
                          {["1", "5", "15", "30", "60", "D"].map((tf) => (
                            <button
                              key={tf}
                              onClick={() => setLiveInterval(tf)}
                              className={cn(
                                "py-3 rounded-xl text-[10px] font-black uppercase transition-all border",
                                liveInterval === tf
                                  ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                                  : "bg-slate-950 border-white/5 text-slate-500 hover:text-slate-300",
                              )}
                            >
                              {tf === "D" ? "1D" : tf + "M"}
                            </button>
                          ))}
                        </div>
                      </InputGroup>

                      <InputGroup
                        label="Per Trade Capital ($)"
                        sub="Position size"
                      >
                        <input
                          type="number"
                          value={initialCapital}
                          onChange={(e) =>
                            setInitialCapital(Number(e.target.value))
                          }
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold outline-none"
                        />
                      </InputGroup>
                    </div>
                  </section>
                </div>

                <div className="p-8 bg-slate-900/60 border border-white/10 rounded-[2.5rem] shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-500" /> Activity
                      Log
                    </h3>
                    {backtestResult && (
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[8px] font-black text-slate-500 uppercase">
                            Win/Loss
                          </p>
                          <p className="text-[10px] font-bold text-white">
                            <span className="text-emerald-400">
                              {
                                backtestResult.trades.filter(
                                  (t) => (t.profit ?? 0) > 0,
                                ).length
                              }
                            </span>
                            <span className="text-slate-600 mx-1">/</span>
                            <span className="text-rose-400">
                              {
                                backtestResult.trades.filter(
                                  (t) => (t.profit ?? 0) < 0,
                                ).length
                              }
                            </span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-slate-500 uppercase">
                            Total P/L
                          </p>
                          <p
                            className={cn(
                              "text-[10px] font-bold",
                              backtestResult.summary.totalProfit >= 0
                                ? "text-emerald-400"
                                : "text-rose-400",
                            )}
                          >
                            ${backtestResult.summary.totalProfit.toFixed(4)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-slate-500 uppercase">
                            Final Balance
                          </p>
                          <p className="text-[10px] font-bold text-white">
                            ${backtestResult.summary.finalBalance.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                    {[...(backtestResult?.trades || [])]
                      .sort(
                        (a, b) =>
                          dayjs(b.entryTime).valueOf() -
                          dayjs(a.entryTime).valueOf(),
                      )
                      .slice(0, 15)
                      .map((trade, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedTradeForChart(trade)}
                          className={cn(
                            "flex items-center justify-between text-[10px] font-mono py-2 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 px-2 rounded-lg transition-colors",
                            selectedTradeForChart === trade &&
                            "bg-blue-500/10 border-blue-500/20",
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-slate-500 text-[8px]">
                              {dayjs(trade.entryTime).tz(backtestTimezone === 'IST' ? 'Asia/Kolkata' : 'UTC').format("HH:mm:ss")} {backtestTimezone}
                            </span>
                            <span
                              className={cn(
                                "font-black",
                                trade.direction === "buy"
                                  ? "text-emerald-500"
                                  : "text-rose-500",
                              )}
                            >
                              {trade.direction.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-300 block">
                              ${trade.entryPrice}
                            </span>
                            <span
                              className={cn(
                                "font-black",
                                (trade.profit ?? 0) >= 0
                                  ? "text-emerald-400"
                                  : "text-rose-400",
                              )}
                            >
                              {(trade.profit ?? 0) >= 0 ? "+" : ""}
                              {(trade.profit ?? 0).toFixed(4)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </aside>

              {/* Center: Main Chart & Active Trade */}
              <div className="lg:col-span-3 space-y-8">
                <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" /> Live
                      Market Chart
                    </h2>
                    <div className="px-4 py-1.5 rounded-xl bg-slate-950/50 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {pair} •{" "}
                      {liveInterval === "D" ? "1D" : liveInterval + "M"}
                    </div>
                  </div>
                  <div className="h-[350px] sm:h-[500px] w-full bg-slate-950/50 rounded-[2rem] border border-white/5 overflow-hidden">
                    <LiveMarketChart
                      candles={candles}
                      trades={[...(backtestResult?.trades || []), ...combinedActiveTrades]}
                      selectedTrade={selectedTradeForChart}
                      fvgs={backtestResult?.indicators?.fvgs}
                      srLevels={backtestResult?.indicators?.srLevels}
                    />
                  </div>
                </div>

                {/* Active Trade Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {combinedActiveTrades.length === 0 ? (
                    <div className="md:col-span-2 p-12 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-600">
                      <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4">
                        <Zap className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-sm font-black uppercase tracking-widest">
                        No Active Positions
                      </p>
                    </div>
                  ) : (
                    combinedActiveTrades
                      .slice(0, 2)
                      .map((trade, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-8 border rounded-[2.5rem] shadow-2xl relative overflow-hidden group bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20"
                        >
                          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <Activity className="w-32 h-32 text-emerald-400" />
                          </div>
                          <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div
                                  className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                                    trade.direction === "buy"
                                      ? "bg-emerald-500 text-slate-950"
                                      : "bg-rose-500 text-white",
                                  )}
                                >
                                  {trade.direction === "buy" ? (
                                    <TrendingUp className="w-6 h-6" />
                                  ) : (
                                    <TrendingDown className="w-6 h-6" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-white uppercase tracking-tighter">
                                    {trade.direction} Position
                                  </h4>
                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {pair} • IN PROGRESS
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p
                                  className={cn(
                                    "text-xs font-black",
                                    (trade.profit ?? 0) >= 0
                                      ? "text-emerald-400"
                                      : "text-rose-400",
                                  )}
                                >
                                  {(trade.profit ?? 0) >= 0 ? "+" : ""}$
                                  {(trade.profit ?? 0).toFixed(4)}
                                </p>
                                <div className={cn(
                                  "px-2 py-0.5 rounded-md text-[8px] font-black uppercase flex items-center gap-1.5",
                                  (trade.profit ?? 0) >= 0
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-rose-500/10 text-rose-400",
                                )}>
                                  <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", (trade.profit ?? 0) >= 0 ? "bg-emerald-500" : "bg-rose-500")} />
                                  {trade.pnlPercent}%
                                </div>
                              </div>
                            </div>

                            <div className="h-px w-full bg-white/5" />

                            <div className="grid grid-cols-3 gap-6">
                              <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">
                                  Entry Price
                                </p>
                                <p className="text-xs font-bold text-white font-mono">
                                  ${trade.entryPrice.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">
                                  Stop Loss {trade.trailingCount ? " (Trailed)" : ""}
                                </p>
                                <p className="text-xs font-bold text-rose-400 font-mono">
                                  ${(trade.sl || 0).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">
                                  Live Price
                                </p>
                                <p className="text-xs font-bold text-blue-400 animate-pulse font-mono">
                                  ${tickerPrice ? tickerPrice.toLocaleString() : '---'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}


        {view === "history" && (
          <TradeHistoryView tickerPrice={tickerPrice} currentPair={pair} leverage={leverage} />
        )}

        {view === "daily" && (
          <DailyAnalysisView 
            currentPair={pair}
            onViewTrade={(t) => setSelectedTradeForView(t)}
          />
        )}

        {view === "fvg-daily" && (
          <FVGDailyAnalysisView 
            currentPair={pair}
            onViewTrade={(t) => setSelectedTradeForView(t)}
          />
        )}

        {view === "logs" && (
          <ErrorLog />
        )}
      </main>

      <footer className="mt-20 border-t border-white/5 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-12 flex flex-col md:flex-row items-center justify-between text-slate-600 text-[10px] font-black uppercase tracking-widest leading-none">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-4 h-4 opacity-30" />
            <span>&copy; 2026 Resistance Intelligence Terminal</span>
          </div>
          <div className="flex items-center gap-10">
            <a href="#" className="hover:text-blue-400 transition-colors">
              Documentation
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              Risk Protocol
            </a>
            <a href="#" className="hover:text-blue-400 transition-colors">
              Network Status
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}




function TradeViewModal({
  trade,
  pair,
  resolution,
  onClose,
  isLiveMonitoring,
  backtestTimezone,
}: {
  trade: Trade;
  pair: string;
  resolution: string;
  onClose: () => void;
  isLiveMonitoring: boolean;
  backtestTimezone: "UTC" | "IST";
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[Modal] Trade Object:", trade);
    let isMounted = true;
    let chart: any;

    const fetchTradeData = async () => {
      try {
        setLoading(true);
        const resInMin = resolution === "D" ? 1440 : parseInt(resolution);
        const paddingBefore = 40 * resInMin * 60;
        const paddingAfter = 20 * resInMin * 60;

        // Use breakoutTime if available, else entryTime. Ensure we don't have NaN.
        const refTimeStr = trade.breakoutTime || trade.entryTime;
        const refTimeUnix = dayjs(refTimeStr).isValid()
          ? Math.floor(dayjs(refTimeStr).valueOf() / 1000)
          : Math.floor(Date.now() / 1000);

        const startUnix = refTimeUnix - paddingBefore;
        const endUnix =
          trade.exitTime && dayjs(trade.exitTime).isValid()
            ? Math.floor(dayjs(trade.exitTime).valueOf() / 1000) + paddingAfter
            : Math.floor(Date.now() / 1000);

        const response = await axios.get<ApiResponse>(
          `${API_BASE_URL}/market/market-data`,
          {
            params: {
              pair,
              resolution,
              from: startUnix,
              to: endUnix,
              isTest: isLiveMonitoring,
            },
          },
        );
        console.log(
          `[Modal] Received ${response.data.data?.length || 0} candles`,
        );

        if (!isMounted || !chartContainerRef.current) return;

        // Clean up any lingering charts to prevent duplicates
        chartContainerRef.current.innerHTML = "";

        chart = createChart(chartContainerRef.current, {
          layout: {
            background: { type: ColorType.Solid, color: "transparent" },
            textColor: "#94a3b8",
          },
          grid: {
            vertLines: { color: "rgba(255, 255, 255, 0.03)" },
            horzLines: { color: "rgba(255, 255, 255, 0.03)" },
          },
          width: chartContainerRef.current.clientWidth || 900,
          height: 450,
          timeScale: {
            borderColor: "rgba(255, 255, 255, 0.1)",
            timeVisible: true,
          },
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
          upColor: "#10b981",
          downColor: "#ef4444",
          borderVisible: false,
          wickUpColor: "#10b981",
          wickDownColor: "#ef4444",
        });

        const entryT = dayjs(trade.entryTime).valueOf();
        const exitT = trade.exitTime ? dayjs(trade.exitTime).valueOf() : null;
        const istOffset = 5.5 * 60 * 60; // 5 hours 30 mins in seconds
        const fvgs = (trade as any).indicators?.fvgs || [];

        if (!response.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
          console.warn("[Modal] No candle data returned from API.");
          setLoading(false);
          return;
        }

        const sortedData = [...response.data.data]
          .sort((a, b) => a.time - b.time)
          .map((c) => {
            const candleTimeUnix = Math.floor(c.time / 1000) + istOffset;
            const isFormation = fvgs.some((f: any) => {
                const fStart = Math.floor(f.formationStartTime / 1000) + istOffset;
                const fEnd = Math.floor(f.formationEndTime / 1000) + istOffset;
                return candleTimeUnix >= fStart && candleTimeUnix <= fEnd;
            });
            
            return {
              time: candleTimeUnix as any,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              color: isFormation ? '#6366f1' : undefined,
              wickColor: isFormation ? '#ffffff' : undefined,
              borderColor: isFormation ? '#ffffff' : undefined,
              borderVisible: isFormation ? true : undefined,
            };
          });

        const rawEntryTime = Math.floor(entryT / 1000) + istOffset;
        let entryIdx = 0;
        for (let i = 0; i < sortedData.length; i++) {
            if (sortedData[i].time <= rawEntryTime) entryIdx = i;
            else break;
        }
        
        if (sortedData[entryIdx]) {
            (sortedData[entryIdx] as any).color = "#eab308"; // yellow
            (sortedData[entryIdx] as any).wickColor = "#eab308";
        }

        if (exitT) {
            const rawExitTime = Math.floor(exitT / 1000) + istOffset;
            let exitIdx = 0;
            for (let i = 0; i < sortedData.length; i++) {
                if (sortedData[i].time <= rawExitTime) exitIdx = i;
                else break;
            }
            
            if (sortedData[exitIdx]) {
                (sortedData[exitIdx] as any).color = "#8b5cf6"; // violet
                (sortedData[exitIdx] as any).wickColor = "#8b5cf6";
            }
        }

        candleSeries.setData(sortedData);

        // Render FVG Boxes if available
        if (fvgs.length > 0) {
            const fvgSeries = chart.addSeries(CandlestickSeries, {
                upColor: "rgba(99, 102, 241, 0.45)",
                downColor: "rgba(244, 63, 94, 0.45)",
                borderVisible: true,
                wickVisible: false,
                borderColor: "rgba(255, 255, 255, 0.8)",
                priceLineVisible: false,
                lastValueVisible: false,
            });

            const fvgData: any[] = [];
            fvgs.forEach((fvg: any) => {
                const fStart = Math.floor(fvg.formationStartTime / 1000) + istOffset;
                const fEnd = Math.floor(fvg.fillTime / 1000) + istOffset;
                sortedData.forEach(c => {
                    if (c.time >= fStart && c.time <= fEnd) {
                        fvgData.push({
                            time: c.time,
                            open: fvg.top,
                            high: fvg.top,
                            low: fvg.bottom,
                            close: fvg.bottom,
                        });
                    }
                });
            });
            fvgData.sort((a, b) => a.time - b.time);
            fvgSeries.setData(fvgData);
        }

        // Add Horizontal Lines for Range, Entry, and Exit
        if (trade.rangeHigh) {
          candleSeries.createPriceLine({
            price: trade.rangeHigh,
            color: "#f59e0b",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "Range High",
          });
        }
        if (trade.rangeLow) {
          candleSeries.createPriceLine({
            price: trade.rangeLow,
            color: "#f59e0b",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "Range Low",
          });
        }

        candleSeries.createPriceLine({
          price: Number(trade.entryPrice),
          color: "#eab308", // Bright Yellow for Entry
          lineWidth: 3,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: "ENTRY",
        });

        // FVG Section Horizontal Lines
        const ind = (trade as any).indicators;
        if (ind?.fvgTop) {
            candleSeries.createPriceLine({
                price: ind.fvgTop,
                color: "rgba(99, 102, 241, 0.8)",
                lineWidth: 1,
                lineStyle: LineStyle.Dashed,
                axisLabelVisible: true,
                title: "FVG TOP",
            });
        }
        if (ind?.fvgBottom) {
            candleSeries.createPriceLine({
                price: ind.fvgBottom,
                color: "rgba(244, 63, 94, 0.8)",
                lineWidth: 1,
                lineStyle: LineStyle.Dashed,
                axisLabelVisible: true,
                title: "FVG BOTTOM",
            });
        }

        if (trade.sl) {
          candleSeries.createPriceLine({
            price: Number(trade.sl),
            color: "#ff4444", // Bright Red for SL
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `SL: ${trade.sl}`,
          });
        }

        if (trade.tp) {
          candleSeries.createPriceLine({
            price: Number(trade.tp),
            color: "#00ff88", // Bright Green for TP
            lineWidth: 2,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `TP: ${trade.tp}`,
          });
        }

        if (trade.exitPrice) {
          candleSeries.createPriceLine({
            price: trade.exitPrice,
            color: "#94a3b8",
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "Exit",
          });
        }

        const markers: any[] = [];
        
        const entryTimeUnix = Math.floor(dayjs(trade.entryTime).valueOf() / 1000) + istOffset;
        let closestEntryCandle = sortedData[0];
        for (const c of sortedData) {
            if (c.time <= entryTimeUnix) closestEntryCandle = c;
            else break;
        }

        if (closestEntryCandle) {
          markers.push({
            time: closestEntryCandle.time,
            position: trade.direction === "buy" ? "belowBar" : "aboveBar",
            color: "#eab308", // yellow
            shape: trade.direction === "buy" ? "arrowUp" : "arrowDown",
            text: `ENTRY @ ${trade.entryPrice}`,
          });
        }

        if (trade.exitTime) {
          const exitTimeUnix = Math.floor(dayjs(trade.exitTime).valueOf() / 1000) + istOffset;
          let closestExitCandle = sortedData[0];
          for (const c of sortedData) {
              if (c.time <= exitTimeUnix) closestExitCandle = c;
              else break;
          }

          if (closestExitCandle) {
            markers.push({
              time: closestExitCandle.time,
              position: trade.direction === "buy" ? "aboveBar" : "belowBar",
              color: "#8b5cf6", // violet
              shape: trade.direction === "buy" ? "arrowDown" : "arrowUp",
              text: `EXIT @ ${trade.exitPrice}`,
            });
          }
        }

        // Sort markers by time as required by lightweight-charts
        markers.sort((a, b) => a.time - b.time);
        
        candleSeries.setMarkers(markers);
        
        const timeScale = chart.timeScale();
        timeScale.setVisibleRange({
            from: (entryTimeUnix - (10 * 60 * 60)) as any, 
            to: (entryTimeUnix + (10 * 60 * 60)) as any,  
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchTradeData();
    return () => {
      isMounted = false;
      if (chart) chart.remove();
    };
  }, [trade, pair, resolution, isLiveMonitoring]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/90 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.95, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 30 }}
        className="w-full max-w-6xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden relative"
      >
        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-6">
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-2xl",
                trade.direction === "buy"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400",
              )}
            >
              {trade.direction === "buy" ? (
                <TrendingUp className="w-8 h-8" />
              ) : (
                <TrendingDown className="w-8 h-8" />
              )}
            </div>
            <div>
              <h3 className="font-black text-2xl tracking-tighter uppercase">
                {trade.direction === "buy" ? "Long" : "Short"} Execution
                Analysis
              </h3>
              <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
                {pair} • {resolution}M Resolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <ModalStat
              label="Entry"
              value={`$${trade.entryPrice.toLocaleString()}`}
            />
            <ModalStat
              label="Exit"
              value={
                trade.exitPrice ? `$${trade.exitPrice.toLocaleString()}` : "---"
              }
            />
            <ResultCard
              title="Execution Net Profit"
              value={`$${(trade.profit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`}
              icon={TrendingUp}
              color={(trade.profit ?? 0) > 0 ? "text-emerald-400" : "text-rose-400"}
            />
            <ModalStat
              label="Timeline"
              value={`${dayjs(trade.entryTime).tz(backtestTimezone === 'IST' ? 'Asia/Kolkata' : 'UTC').format("MMM D, HH:mm")} — ${trade.exitTime ? dayjs(trade.exitTime).tz(backtestTimezone === 'IST' ? 'Asia/Kolkata' : 'UTC').format("HH:mm") : "Active"} ${backtestTimezone}`}
            />
          </div>

          <div className="relative bg-slate-950/50 rounded-[2.5rem] border border-white/5 overflow-hidden min-h-[450px]">
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-md">
                <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Rendering Simulation...
                </span>
              </div>
            )}
            <div ref={chartContainerRef} className="w-full" />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModalStat({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="p-6 bg-slate-950/40 border border-white/5 rounded-3xl group hover:border-white/10 transition-colors">
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className={cn("text-xl font-black tracking-tight", color)}>{value}</p>
    </div>
  );
}

function ResultCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
}) {
  return (
    <div className="p-8 bg-slate-900/40 border border-white/10 rounded-[2.5rem] flex flex-col items-center text-center group">
      <div
        className={cn(
          "p-4 rounded-full bg-slate-950 mb-4 border border-white/5 group-hover:scale-110 transition-transform",
          color,
        )}
      >
        <Icon className="w-8 h-8" />
      </div>
      <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-600 mb-1 md:mb-2">
        {title}
      </p>
      <p className={cn("text-2xl md:text-4xl font-black tracking-tighter", color)}>
        {value}
      </p>
    </div>
  );
}

function ViewToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black transition-all whitespace-nowrap",
        active
          ? "bg-blue-600 text-white shadow-lg sm:shadow-xl shadow-blue-600/20"
          : "text-slate-500 hover:text-slate-300 hover:bg-white/5",
      )}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span className="hidden xs:inline">{label}</span>
    </button>
  );
}

function InputGroup({
  label,
  sub,
  children,
}: {
  label: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-black text-slate-200 block mb-0.5">
          {label}
        </label>
        <span className="text-[10px] font-bold text-slate-600 lowercase block">
          {sub}
        </span>
      </div>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  Strategy Builder View
// ════════════════════════════════════════════════════════════

