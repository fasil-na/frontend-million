import { useState, useEffect } from "react";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Activity, TrendingUp, TrendingDown, Target, RefreshCw } from "lucide-react";
import axios from "axios";

dayjs.extend(utc);
dayjs.extend(timezone);

const API_BASE_URL = `/api`;
const API_BASE = `${API_BASE_URL}/strategy`;
const API_MARKET = `${API_BASE_URL}/market`;

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function DailyAnalysisView({
  currentPair,
  onViewTrade,
}: {
  currentPair: string;
  onViewTrade: (trade: any) => void;
}) {
  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(dayjs());
  const [loading, setLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  useEffect(() => {
    fetchDailyAnalysis(currentDate.format("YYYY-MM-DD"), currentPair);
  }, [currentDate, currentPair]);

  useEffect(() => {
    fetchMonthlyStats(currentDate.year(), currentDate.month(), currentPair);
  }, [currentDate.month(), currentDate.year(), currentPair]);

  const fetchMonthlyStats = async (year: number, month: number, pair: string) => {
    setMonthlyLoading(true);
    try {
      const { data } = await axios.post(`${API_MARKET}/backtest`, {
        strategyId: "tp-gold-opening-breakout",
        year,
        month,
        pair,
        timezone: "IST",
        resolution: "15"
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
    try {
      const { data } = await axios.get(`${API_BASE}/daily-analysis`, {
        params: { date: dateStr, pair: pairStr }
      });
      setCurrentRecord(data);
    } catch (err) {
      console.error("Failed to fetch daily analysis", err);
    } finally {
      setLoading(false);
    }
  };

  const prevDay = () => setCurrentDate((c) => c.subtract(1, "day"));
  const nextDay = () => setCurrentDate((c) => c.add(1, "day"));
  const isWeekend = currentDate.day() === 0 || currentDate.day() === 6;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">
              Daily Breakdown
            </span>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Day-by-Day Analysis</h2>
        </div>

        {/* Monthly Summary Stats */}
        {!monthlyLoading && monthlyStats && (
          <div className="flex flex-wrap gap-4">
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-3 flex flex-col justify-center min-w-[140px]">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Target className="w-3 h-3 text-blue-500" /> Month Wins
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
                <TrendingUp className="w-3 h-3 text-emerald-500" /> Month PnL
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
            <Calendar className="w-5 h-5 text-blue-500" />
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

        {isWeekend ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center mb-4 border border-white/5">
              <Calendar className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">Weekend</h3>
            <p className="text-sm text-slate-500">Markets are closed. No trading activity.</p>
          </div>
        ) : loading ? (
          <div className="py-32 text-center flex flex-col items-center">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Fetching Market Data...</h3>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Daily Stats Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-950 rounded-[2rem] p-6 border border-white/5">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" /> 3:45—4:00 AM IST Range
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Range High</p>
                    <p className="text-xl font-bold text-white font-mono">
                      {currentRecord.rangeHigh ? `$${currentRecord.rangeHigh.toFixed(4)}` : "---"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-600 uppercase mb-1">Range Low</p>
                    <p className="text-xl font-bold text-white font-mono">
                      {currentRecord.rangeLow ? `$${currentRecord.rangeLow.toFixed(4)}` : "---"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 rounded-[2rem] p-6 border border-white/5">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Performance</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Total Trades</span>
                    <span className="text-lg font-black text-white">{currentRecord.tradesCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">Daily PnL</span>
                    <span className={cn(
                      "text-lg font-black",
                      currentRecord.dailyPnl > 0 ? "text-emerald-400" : currentRecord.dailyPnl < 0 ? "text-rose-400" : "text-slate-400"
                    )}>
                      {currentRecord.dailyPnl > 0 ? "+" : ""}{currentRecord.dailyPnl > 0 || currentRecord.dailyPnl < 0 ? `$${currentRecord.dailyPnl.toFixed(4)}` : "$0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trades List */}
            <div className="lg:col-span-2">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 px-4">
                Executed Trades
              </h4>
              {currentRecord.tradesCount === 0 ? (
                <div className="bg-slate-950 rounded-[2rem] p-12 text-center border border-white/5">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">No entry triggered on this day</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentRecord.trades.map((trade: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 rounded-[2rem] p-6 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center",
                          trade.direction === "buy" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                          {trade.direction === "buy" ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-white mb-1">
                            {trade.direction} Position
                          </p>
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
                          <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Exit</p>
                          <p className="text-sm font-bold text-white font-mono">{trade.exitPrice ? `$${trade.exitPrice.toFixed(4)}` : "---"}</p>
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
                        onClick={() => onViewTrade(trade)}
                        className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-colors shrink-0"
                      >
                        View Graph
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
