export type TradeDirection = 'Long' | 'Short';
export type TradeOutcome = 'Win' | 'Loss' | 'Breakeven';

// ── Profile ──
export interface Profile {
  id: string;
  name: string;
  avatarUrl: string; // Identifier for predefined avatars (e.g. "avatar-1", "avatar-2", etc.)
  createdAt: string;
}

// ── Single Trade Entry ──
export interface Trade {
  id: string;
  profileId: string; // Belongs to a profile
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
