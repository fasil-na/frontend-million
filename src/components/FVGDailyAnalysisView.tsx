import { useState, useEffect } from "react";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Activity, TrendingUp, TrendingDown, Target, RefreshCw } from "lucide-react";
import axios from "axios";
import { LiveMarketChart } from "./LiveMarketChart";
import { API_BASE_URL } from "../constants";

dayjs.extend(utc);
dayjs.extend(timezone);

const API_BASE = `${API_BASE_URL}/strategy`;
const API_MARKET = `${API_BASE_URL}/market`;

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function FVGDailyAnalysisView({
  currentPair,
  onViewTrade,
  riskAmount: globalRiskAmount,
}: {
  currentPair: string;
  onViewTrade: (trade: any) => void;
  riskAmount: number | null;
}) {
  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [selectedTradeForChart, setSelectedTradeForChart] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [hasLiveConfig, setHasLiveConfig] = useState(false);

  useEffect(() => {
    checkLiveConfigs();
  }, [currentPair]);

  const checkLiveConfigs = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/live-configs`);
      const exists = data.some((c: any) => c.pair === currentPair && c.strategyId === 'fvg-imbalance' && c.isEnabled);
      setHasLiveConfig(exists);
    } catch (err) {
      console.error("Failed to fetch live configs", err);
    }
  };

  useEffect(() => {
    if (globalRiskAmount === null) return;
    fetchDailyAnalysis(currentDate.format("YYYY-MM-DD"), currentPair);
  }, [currentDate, currentPair, globalRiskAmount]);

  useEffect(() => {
    if (globalRiskAmount === null) return;
    fetchMonthlyStats(currentDate.year(), currentDate.month(), currentPair);
  }, [currentDate.month(), currentDate.year(), currentPair, globalRiskAmount]);
  // ***
  const fetchMonthlyStats = async (year: number, month: number, pair: string) => {
    setMonthlyLoading(true);
    try {
      const { data } = await axios.post(`${API_MARKET}/backtest`, {
        strategyId: "fvg-imbalance",
        year,
        month,
        pair,
        timezone: "IST",
        resolution: "1",
        riskAmount: globalRiskAmount
      });
      setMonthlyStats(data.summary);
    } catch (err) {
      console.error("Failed to fetch monthly stats", err);
    } finally {
      setMonthlyLoading(false);
    }
  };

  const fetchDailyAnalysis = async (dateStr: string, pairStr: string) => {
    setLoading(true);
    setCurrentRecord(null);
    setSelectedTradeForChart(null);
    try {
      const { data } = await axios.get(`${API_BASE}/fvg-analysis`, {
        params: { date: dateStr, pair: pairStr, resolution: "1" }
      });
      setCurrentRecord(data);
    } catch (err) {
      console.error("Failed to fetch FVG daily analysis", err);
    } finally {
      setLoading(false);
    }
  };

  const prevDay = () => setCurrentDate((c) => c.subtract(1, "day"));
  const nextDay = () => setCurrentDate((c) => c.add(1, "day"));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              FVG Imbalance Analysis
            </span>
          </div>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-white tracking-tighter">FVG Day-by-Day</h2>
            <div className="px-3 py-1 rounded-xl bg-slate-900 border border-white/10 flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Risk: ${currentRecord?.riskAmount || globalRiskAmount}</span>
            </div>
          </div>
        </div>

        {/* Monthly Summary Stats */}
        {!monthlyLoading && monthlyStats && (
          <div className="flex flex-wrap gap-4">
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-3 flex flex-col justify-center min-w-[140px]">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-slate-400" /> Total Trades
              </span>
              <span className="text-xl font-black text-white">{monthlyStats.count}</span>
            </div>
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-3 flex flex-col justify-center min-w-[140px]">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Target className="w-3 h-3 text-indigo-500" /> Month Wins
              </span>
              <span className="text-xl font-black text-white">{monthlyStats.successCount}</span>
            </div>
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-3 flex flex-col justify-center min-w-[140px]">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-rose-500" /> Month Losses
              </span>
              <span className="text-xl font-black text-white">{monthlyStats.failedCount}</span>
            </div>
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-3 flex flex-col justify-center min-w-[140px]">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-emerald-500" /> Win Ratio
              </span>
              <span className="text-xl font-black text-emerald-400">{monthlyStats.winRate.toFixed(1)}%</span>
            </div>
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-3 flex flex-col justify-center min-w-[140px]">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-indigo-500" /> Month Net PnL
              </span>
              <span className={cn(
                "text-xl font-black",
                monthlyStats.totalProfit >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {monthlyStats.totalProfit >= 0 ? "+" : ""}${monthlyStats.totalProfit.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden min-h-[500px]">
        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 border-b border-white/5 pb-8">
          <button onClick={prevDay} disabled={loading} className="px-4 py-3 rounded-xl bg-slate-950 border border-white/10 hover:bg-slate-800 transition flex items-center gap-2 text-xs font-black uppercase text-slate-300 disabled:opacity-50">
            <ChevronLeft className="w-4 h-4" /> Prev Day
          </button>

          <div className="flex items-center gap-4 bg-slate-950 px-6 py-3 rounded-2xl border border-white/10">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <input
              type="date"
              value={currentDate.format("YYYY-MM-DD")}
              onChange={(e) => setCurrentDate(dayjs(e.target.value))}
              disabled={loading}
              className="bg-transparent text-white font-black text-lg outline-none cursor-pointer disabled:opacity-50"
            />
          </div>

          <button onClick={nextDay} disabled={loading} className="px-4 py-3 rounded-xl bg-slate-950 border border-white/10 hover:bg-slate-800 transition flex items-center gap-2 text-xs font-black uppercase text-slate-300 disabled:opacity-50">
            Next Day <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-32 text-center flex flex-col items-center">
            <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Identifying Gaps...</h3>
          </div>
        ) : !currentRecord ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center mb-4 border border-white/5">
              <Activity className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">No Data Available</h3>
            <p className="text-sm text-slate-500">Failed to load data for {currentDate.format("MMM D, YYYY")}.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* IN-PAGE CHART */}
            <div className="bg-slate-950 rounded-[2.5rem] border border-white/5 overflow-hidden">
              <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" /> Day Visual Audit
                </h3>
                <div className="flex items-center gap-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">
                    {currentRecord.trades.length} Real
                  </div>
                  <div className="text-[10px] font-bold text-indigo-500 uppercase">
                    {currentRecord.simulatedTrades?.length || 0} Simulated
                  </div>
                </div>
              </div>
              <div className="h-[400px]">
                <LiveMarketChart
                  candles={currentRecord.candles}
                  trades={[...currentRecord.trades, ...(currentRecord.simulatedTrades || []).map((t: any) => ({ ...t, type: 'paper' }))]}
                  selectedTrade={selectedTradeForChart}
                  fvgs={currentRecord.indicators?.fvgs}
                  height={400}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Daily Stats Card */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-950 rounded-[2rem] p-6 border border-white/5">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" /> Daily Performance
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-400">Strategy Signals</span>
                      <span className="text-lg font-black text-white">{currentRecord.simulatedTrades?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400">Strategy PnL</span>
                      <span className={cn(
                        "text-lg font-black",
                        (currentRecord.simulatedTrades?.reduce((a: any, t: any) => a + t.profit, 0) || 0) > 0 ? "text-emerald-400" : (currentRecord.simulatedTrades?.reduce((a: any, t: any) => a + t.profit, 0) || 0) < 0 ? "text-rose-400" : "text-slate-400"
                      )}>
                        ${(currentRecord.simulatedTrades?.reduce((a: any, t: any) => a + t.profit, 0) || 0).toFixed(4)}
                      </span>
                    </div>
                    {hasLiveConfig && (
                      <div className="pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-emerald-500">Real Trades</span>
                          <span className="text-sm font-black text-slate-400">{currentRecord.tradesCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500">Real Net PnL</span>
                          <span className={cn(
                            "text-sm font-bold",
                            currentRecord.dailyPnl >= 0 ? "text-emerald-500/60" : "text-rose-500/60"
                          )}>
                            ${currentRecord.dailyPnl.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-indigo-600/5 border border-indigo-500/10 rounded-[2rem]">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">FVG Insight</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Highlighting candles that triggered Fair Value Gaps in <span className="text-indigo-400 font-bold">blue</span> for visual audit.
                  </p>
                </div>
              </div>

              {/* Trades List */}
              <div className="lg:col-span-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 px-4">
                  Daily Execution History
                </h4>
                {currentRecord.tradesCount === 0 && (!currentRecord.simulatedTrades || currentRecord.simulatedTrades.length === 0) ? (
                  <div className="bg-slate-950 rounded-[2rem] p-12 text-center border border-white/5">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No signals detected on this day</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      ...(hasLiveConfig ? currentRecord.trades.map((t: any) => ({ ...t, isReal: true })) : []),
                      ...(currentRecord.simulatedTrades || []).map((t: any) => ({ ...t, isReal: false }))
                    ].sort((a, b) => dayjs(a.entryTime).valueOf() - dayjs(b.entryTime).valueOf()).map((trade: any, idx: number) => (
                      <div key={idx} className={cn(
                        "bg-slate-950 rounded-[2rem] p-6 border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors",
                        trade.isReal ? "border-white/5 hover:border-indigo-500/30" : "border-indigo-500/10 opacity-80"
                      )}>
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                            trade.direction === "buy" ? "bg-indigo-500/10 text-indigo-400" : "bg-rose-500/10 text-rose-400"
                          )}>
                            {trade.direction === "buy" ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-black uppercase tracking-widest text-white">
                                {trade.direction === "buy" ? "Long" : "Short"} FVG
                              </p>
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                                trade.isReal ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                              )}>
                                {trade.isReal ? "Real" : "Paper"}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 font-mono">
                              {dayjs(trade.entryTime).tz('Asia/Kolkata').format("HH:mm:ss")} IST
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-8">
                          <div>
                            <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Entry</p>
                            <p className="text-sm font-bold text-white font-mono">${trade.entryPrice.toFixed(4)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-600 uppercase mb-1">SL</p>
                            <p className="text-sm font-bold text-rose-400 font-mono">${trade.sl ? trade.sl.toFixed(4) : '---'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-600 uppercase mb-1">TP</p>
                            <p className="text-sm font-bold text-emerald-400 font-mono">${trade.tp ? trade.tp.toFixed(4) : '---'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Profit</p>
                            <p className={cn(
                              "text-sm font-black font-mono",
                              trade.profit > 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                              {trade.profit > 0 ? "+" : ""}{trade.profit.toFixed(4)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedTradeForChart(trade);
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shrink-0 border",
                            selectedTradeForChart === trade
                              ? "bg-indigo-500 text-white border-indigo-400"
                              : "bg-indigo-500/10 text-indigo-400 border-indigo-500/10 hover:bg-indigo-500/20"
                          )}
                        >
                          {selectedTradeForChart === trade ? "Selected" : "Highlight Gap"}
                        </button>

                        <button
                          onClick={() => {
                            onViewTrade({
                              ...trade,
                              indicators: currentRecord.indicators
                            });
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors shrink-0 border border-white/5"
                        >
                          Full Graph
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
