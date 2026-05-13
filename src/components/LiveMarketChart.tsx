import { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, AreaSeries, LineSeries, LineStyle } from "lightweight-charts";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";


dayjs.extend(utc);
dayjs.extend(timezone);
import type { Candle, Trade } from "../tradingTypes";

interface LiveMarketChartProps {
  candles: Candle[];
  trades: Trade[];
  selectedTrade?: Trade | null;
  srLevels?: any[];
  fvgs?: any[];
  height?: number;
}

export function LiveMarketChart({
  candles = [],
  trades = [],
  selectedTrade,
  srLevels = [],
  fvgs = [],
  height = 400,
}: LiveMarketChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const ema20SeriesRef = useRef<any>(null);
  const ema50SeriesRef = useRef<any>(null);
  const highSeriesRef = useRef<any>(null);
  const lowSeriesRef = useRef<any>(null);
  const slLineRef = useRef<any>(null);
  const tpLineRef = useRef<any>(null);
  const entryLineRef = useRef<any>(null);
  const rangeHighLineRef = useRef<any>(null);
  const rangeLowLineRef = useRef<any>(null);
  const fvgTopLineRef = useRef<any>(null);
  const fvgBottomLineRef = useRef<any>(null);
  const fvgMidLineRef = useRef<any>(null);
  const tradeHighlightSeriesRef = useRef<any>(null);
  const fvgSeriesRef = useRef<any>(null);
  const srLinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    const fvgSeries = chart.addSeries(CandlestickSeries, {
      upColor: "rgba(99, 102, 241, 0.2)",
      downColor: "rgba(244, 63, 94, 0.2)",
      borderVisible: true,
      wickVisible: false,
      borderColor: "rgba(99, 102, 241, 0.4)",
      borderUpColor: "rgba(99, 102, 241, 0.4)",
      borderDownColor: "rgba(244, 63, 94, 0.4)",
      priceLineVisible: false,
      lastValueVisible: false,
    });

    const tradeHighlightSeries = chart.addSeries(AreaSeries, {
      topColor: "rgba(16, 185, 129, 0.4)",
      bottomColor: "rgba(16, 185, 129, 0.1)",
      lineColor: "rgba(16, 185, 129, 0.8)",
      lineWidth: 2,
      priceLineVisible: false,
    });

    const ema20Series = chart.addSeries(LineSeries, {
      color: "#3b82f6",
      lineWidth: 1,
      title: "EMA 20",
    });

    const ema50Series = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 1,
      title: "EMA 50",
    });

    const highSeries = chart.addSeries(LineSeries, {
      color: "rgba(16, 185, 129, 0.3)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: "High",
    });

    const lowSeries = chart.addSeries(LineSeries, {
      color: "rgba(239, 68, 68, 0.3)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: "Low",
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    tradeHighlightSeriesRef.current = tradeHighlightSeries;
    ema20SeriesRef.current = ema20Series;
    ema50SeriesRef.current = ema50Series;
    highSeriesRef.current = highSeries;
    lowSeriesRef.current = lowSeries;
    fvgSeriesRef.current = fvgSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !candles || candles.length === 0) return;

    const istOffset = 5.5 * 60 * 60;
    const sortedData = [...candles]
      .sort((a, b) => a.time - b.time)
      .map((c) => {
        const isFormation = fvgs.some(f => {
            const start = Math.floor(f.formationStartTime / 1000) + istOffset;
            const end = Math.floor(f.formationEndTime / 1000) + istOffset;
            const cTimeSec = Math.floor(c.time / 1000) + istOffset;
            return cTimeSec >= start && cTimeSec <= end;
        });
        return {
          time: (Math.floor(c.time / 1000) + istOffset) as any,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          color: isFormation ? '#6366f1' : undefined,
          wickColor: isFormation ? '#ffffff' : undefined,
          borderColor: isFormation ? '#ffffff' : undefined,
          borderVisible: isFormation ? true : undefined,
        };
      })
      // ENSURE UNIQUE TIMESTAMPS
      .filter((v, i, a) => i === 0 || v.time !== a[i - 1].time);

    const tradesToMark = selectedTrade ? [selectedTrade] : trades;
    
    tradesToMark.forEach((trade) => {
      const rawEntryTime = Math.floor(dayjs(trade.entryTime).valueOf() / 1000) + istOffset;
      let entryIdx = 0;
      for (let i = 0; i < sortedData.length; i++) {
          if (sortedData[i].time <= rawEntryTime) entryIdx = i;
          else break;
      }
      
      if (sortedData[entryIdx]) {
          (sortedData[entryIdx] as any).color = "#eab308"; // yellow-500
          (sortedData[entryIdx] as any).wickColor = "#eab308";
      }

      if (trade.exitTime) {
          const rawExitTime = Math.floor(dayjs(trade.exitTime).valueOf() / 1000) + istOffset;
          let exitIdx = 0;
          for (let i = 0; i < sortedData.length; i++) {
              if (sortedData[i].time <= rawExitTime) exitIdx = i;
              else break;
          }
          
          if (sortedData[exitIdx]) {
              (sortedData[exitIdx] as any).color = "#8b5cf6"; // violet-500
              (sortedData[exitIdx] as any).wickColor = "#8b5cf6";
          }
      }
    });

    if (sortedData.length > 0) {
      candleSeriesRef.current.setData(sortedData);

      // Calculate EMA 20
      const ema20 = calculateEMA(
        sortedData.map((d) => d.close),
        20,
      );
      ema20SeriesRef.current.setData(
        sortedData.map((d, i) => ({ time: d.time, value: ema20[i] })),
      );

      // Calculate EMA 50
      const ema50 = calculateEMA(
        sortedData.map((d) => d.close),
        50,
      );
      ema50SeriesRef.current.setData(
        sortedData.map((d, i) => ({ time: d.time, value: ema50[i] })),
      );

      // Calculate 20-period High/Low
      const hl = calculateHighLow(sortedData, 20);
      highSeriesRef.current.setData(
        sortedData.map((d, i) => ({ time: d.time, value: hl.highs[i] })),
      );
      lowSeriesRef.current.setData(
        sortedData.map((d, i) => ({ time: d.time, value: hl.lows[i] })),
      );

      // S/R Lines
      if (srLinesRef.current && candleSeriesRef.current) {
        srLinesRef.current.forEach((line) =>
          candleSeriesRef.current.removePriceLine(line)
        );
        srLinesRef.current = [];

        srLevels.forEach((level) => {
          const line = candleSeriesRef.current.createPriceLine({
            price: level.price,
            color: level.type === "support" ? "#00ff9d" : "#ff3e3e",
            lineWidth: 1,
            lineStyle: LineStyle.LargeDashed,
            axisLabelVisible: true,
            title: `${level.type.toUpperCase()} [${level.timeframe}] hits:${level.strength}`,
          });
          srLinesRef.current.push(line);
        });
      }

      // Render FVG Boxes
      // Show ALL FVGs that were detected for this period
      const fvgsToShow = fvgs || []; 

      const fvgData: any[] = [];
      fvgsToShow.forEach((fvg: any) => {
        const fStart = Math.floor(fvg.formationStartTime / 1000) + istOffset;
        // If not filled, use the end of the chart data
        const fEnd = fvg.filledAt 
            ? Math.floor(fvg.filledAt / 1000) + istOffset 
            : sortedData[sortedData.length - 1].time;
            
        const color = fvg.direction === 'bullish' ? "rgba(99, 102, 241, 0.2)" : "rgba(244, 63, 94, 0.2)";
        const borderColor = fvg.direction === 'bullish' ? "rgba(99, 102, 241, 0.5)" : "rgba(244, 63, 94, 0.5)";

        sortedData.forEach(c => {
          if (c.time >= fStart && c.time <= fEnd) {
            fvgData.push({
              time: c.time,
              open: fvg.top,
              high: fvg.top,
              low: fvg.bottom,
              close: fvg.bottom,
              color,
              borderColor,
              wickColor: 'transparent'
            });
          }
        });
      });
      // ENSURE UNIQUE TIMESTAMPS FOR FVG DATA
      const uniqueFvgData = fvgData
        .sort((a, b) => a.time - b.time)
        .filter((v, i, a) => i === 0 || v.time !== a[i - 1].time);

      fvgSeriesRef.current.setData(uniqueFvgData);
    }

    // Add markers for trades
    const markers: any[] = [];

    tradesToMark.forEach((trade) => {
      const rawEntryTime = Math.floor(dayjs(trade.entryTime).valueOf() / 1000) + istOffset;
      let closestEntryCandle = sortedData[0];
      for (const c of sortedData) {
          if (c.time <= rawEntryTime) closestEntryCandle = c;
          else break;
      }
      
      if (closestEntryCandle) {
        markers.push({
          time: closestEntryCandle.time,
          position: trade.direction === "buy" ? "belowBar" : "aboveBar",
          color: trade.direction === "buy" ? "#10b981" : "#ef4444",
          shape: trade.direction === "buy" ? "arrowUp" : "arrowDown",
          text: `ENTRY ${trade.direction.toUpperCase()} @ ${trade.entryPrice}`,
          size: 2,
        });

        if (trade.status === "open") {
          markers.push({
            time: closestEntryCandle.time,
            position: trade.direction === "buy" ? "belowBar" : "aboveBar",
            color: "#3b82f6",
            shape: "circle",
            text: "ACTIVE",
          });
        }
      }

      if (trade.exitTime) {
        const rawExitTime = Math.floor(dayjs(trade.exitTime).valueOf() / 1000) + istOffset;
        let closestExitCandle = sortedData[0];
        for (const c of sortedData) {
            if (c.time <= rawExitTime) closestExitCandle = c;
            else break;
        }

        if (closestExitCandle) {
          markers.push({
            time: closestExitCandle.time,
            position: trade.direction === "buy" ? "aboveBar" : "belowBar",
            color: "#94a3b8",
            shape: trade.direction === "buy" ? "arrowDown" : "arrowUp",
            text: `EXIT ${trade.exitReason || ""} @ ${trade.exitPrice || "---"}`,
            size: 2,
          });
        }
      }
    });

    markers.sort((a, b) => a.time - b.time);

    if (
      candleSeriesRef.current &&
      typeof candleSeriesRef.current.setMarkers === "function"
    ) {
      candleSeriesRef.current.setMarkers(markers);

      if (selectedTrade && chartRef.current) {
        chartRef.current.timeScale().scrollToPosition(0, false);
      }
    }

    // Add Entry/SL/TP Lines for the relevant trade
    if (candleSeriesRef.current) {
      // Clear previous FVG-specific channel lines
      if (slLineRef.current) {
        candleSeriesRef.current.removePriceLine(slLineRef.current);
        slLineRef.current = null;
      }
      if (tpLineRef.current) {
        candleSeriesRef.current.removePriceLine(tpLineRef.current);
        tpLineRef.current = null;
      }
      if (entryLineRef.current) {
        candleSeriesRef.current.removePriceLine(entryLineRef.current);
        entryLineRef.current = null;
      }
      if (rangeHighLineRef.current) {
        candleSeriesRef.current.removePriceLine(rangeHighLineRef.current);
        rangeHighLineRef.current = null;
      }
      if (rangeLowLineRef.current) {
        candleSeriesRef.current.removePriceLine(rangeLowLineRef.current);
        rangeLowLineRef.current = null;
      }

      // Dedicated FVG Channel Lines Rendering
      if (fvgTopLineRef.current) {
        candleSeriesRef.current.removePriceLine(fvgTopLineRef.current);
        fvgTopLineRef.current = null;
      }
      if (fvgBottomLineRef.current) {
        candleSeriesRef.current.removePriceLine(fvgBottomLineRef.current);
        fvgBottomLineRef.current = null;
      }
      if (fvgMidLineRef.current) {
        candleSeriesRef.current.removePriceLine(fvgMidLineRef.current);
        fvgMidLineRef.current = null;
      }

      // If a trade is selected or we have a primary trade, show its FVG levels
      const tradeForLines = selectedTrade || trades?.[0] || trades?.find((t) => t.status === "open");
      
      if (tradeForLines) {
        // FVG Parallel Channel Rendering
        const ind = (tradeForLines as any).indicators;
        if (ind?.fvgTop && ind?.fvgBottom) {
            fvgTopLineRef.current = candleSeriesRef.current.createPriceLine({
                price: ind.fvgTop,
                color: "#6366f1",
                lineWidth: 1,
                lineStyle: LineStyle.Solid,
                axisLabelVisible: true,
                title: "FVG TOP",
            });



            fvgBottomLineRef.current = candleSeriesRef.current.createPriceLine({
                price: ind.fvgBottom,
                color: "#6366f1",
                lineWidth: 1,
                lineStyle: LineStyle.Solid,
                axisLabelVisible: true,
                title: "FVG BOTTOM",
            });
        }

        if (tradeForLines.rangeHigh) {
          rangeHighLineRef.current = candleSeriesRef.current.createPriceLine({
            price: tradeForLines.rangeHigh,
            color: "#f59e0b",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "Range High",
          });
        }
        if (tradeForLines.rangeLow) {
          rangeLowLineRef.current = candleSeriesRef.current.createPriceLine({
            price: tradeForLines.rangeLow,
            color: "#f59e0b",
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "Range Low",
          });
        }
        entryLineRef.current = candleSeriesRef.current.createPriceLine({
          price: Number(tradeForLines.entryPrice),
          color: "#eab308",
          lineWidth: 3,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `ENTRY: ${tradeForLines.entryPrice}`,
        });

        if (tradeForLines.sl) {
          slLineRef.current = candleSeriesRef.current.createPriceLine({
            price: Number(tradeForLines.sl),
            color: "#ef4444",
            lineWidth: 3,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `SL: ${tradeForLines.sl}`,
          });
        }
        if (tradeForLines.tp) {
          tpLineRef.current = candleSeriesRef.current.createPriceLine({
            price: Number(tradeForLines.tp),
            color: "#10b981",
            lineWidth: 3,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `TP: ${tradeForLines.tp}`,
          });
        }
      }
    }

    if (selectedTrade && tradeHighlightSeriesRef.current) {
      const entryTime = Math.floor(dayjs(selectedTrade.entryTime).valueOf() / 1000) + istOffset;
      const exitTime = selectedTrade.exitTime
        ? Math.floor(dayjs(selectedTrade.exitTime).valueOf() / 1000) + istOffset
        : Math.floor(dayjs().valueOf() / 1000) + istOffset;

      const isProfit = (selectedTrade.profit ?? 0) >= 0;
      tradeHighlightSeriesRef.current.applyOptions({
        topColor: isProfit ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)",
        bottomColor: isProfit ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
        lineColor: isProfit ? "rgba(16, 185, 129, 0.8)" : "rgba(239, 68, 68, 0.8)",
        lineWidth: 2,
      });

      const highlightData = sortedData
        .filter((d) => d.time >= entryTime && d.time <= exitTime)
        .map((d) => ({ time: d.time, value: d.close }));

      tradeHighlightSeriesRef.current.setData(highlightData);
    } else if (tradeHighlightSeriesRef.current) {
      tradeHighlightSeriesRef.current.setData([]);
    }
  }, [candles, trades, selectedTrade]);

  return (
    <div className="p-6 bg-slate-900/40 border border-white/5 rounded-[2.5rem] backdrop-blur-sm overflow-hidden">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}

function calculateEMA(data: number[], period: number) {
  const k = 2 / (period + 1);
  let ema = data[0];
  const results = [ema];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
    results.push(ema);
  }
  return results;
}

function calculateHighLow(data: any[], period: number) {
  const highs = [];
  const lows = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - period + 1);
    const window = data.slice(start, i + 1);
    highs.push(Math.max(...window.map((d) => d.high)));
    lows.push(Math.min(...window.map((d) => d.low)));
  }
  return { highs, lows };
}
