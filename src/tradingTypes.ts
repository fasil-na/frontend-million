export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type Trade = {
  rangeHigh?: number;
  rangeLow?: number;
  breakoutTime?: string;
  entryTime: string;
  exitTime?: string;
  direction: "buy" | "sell";
  entryPrice: number;
  exitPrice?: number;
  sl?: number;
  initialSL?: number;
  tp?: number;
  status: "open" | "closed" | "failed";
  profit: number;
  exitReason?: string;
  units?: number;
  pnlPercent?: number;
  trailingCount?: number;
  trailingHistory?: {
    sl: number;
    marketPrice: number;
    time: string;
  }[];
  indicators?: any;
};
