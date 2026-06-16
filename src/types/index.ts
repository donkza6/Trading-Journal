// ── Strategy & Emotion Tag Enums ──
export type StrategyTag =
  | 'Breakout'
  | 'Breakdown'
  | 'Trend Following'
  | 'Reversal'
  | 'Scalping'
  | 'Swing'
  | 'RSI'
  | 'MACD'
  | 'Support/Resistance'
  | 'Supply/Demand'
  | 'News Play'
  | 'Gap Fill';

export type EmotionTag =
  | 'Confident'
  | 'Neutral'
  | 'Anxious'
  | 'FOMO'
  | 'Greedy'
  | 'Fearful'
  | 'Revenge'
  | 'Patient'
  | 'Disciplined'
  | 'Impulsive';

export type TradeDirection = 'Long' | 'Short';
export type TradeOutcome = 'Win' | 'Loss' | 'Breakeven';

// ── Single Trade Entry ──
export interface Trade {
  id: string;
  pair: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  positionSize: number;
  profitLevel?: number;
  stopLevel?: number;
  pnl: number;
  outcome: TradeOutcome;
  riskReward: number;
  notes: string;
  images: string[];
  createdAt: string;
}

// ── Daily Log ──
export interface DailyLog {
  date: string;
  trades: Trade[];
  totalPnl: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
}

// ── Portfolio Metrics ──
export interface PortfolioMetrics {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  avgRiskReward: number;
  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
  currentStreak: { type: 'Win' | 'Loss' | 'None'; count: number };
  equityCurve: { date: string; cumPnl: number }[];
}
