export type TradeDirection = 'Long' | 'Short';
export type TradeOutcome = 'Win' | 'Loss' | 'Breakeven';

// ── Profile ──
export interface Profile {
  id: string;
  name: string;
  avatarUrl: string; // Identifier for predefined avatars (e.g. "avatar-1", "avatar-2", etc.)
  accountCurrency?: 'USD' | 'CENT';
  createdAt: string;
}

export interface FundingTransaction {
  id: string;
  profileId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  date: string;
  notes?: string;
}

// ── Single Trade Entry ──
export interface Trade {
  id: string;
  profileId: string; // Belongs to a profile
  pair: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number | null;
  positionSize: number;
  profitLevel?: number;
  stopLevel?: number;
  pnl?: number | null;
  outcome: TradeOutcome;
  riskReward: number;
  notes: string;
  image_url?: string; // Uploaded chart screenshot URL from Supabase Storage
  images?: string[];  // Retain string array compatibility
  setup_grade?: string | null; // 'A' | 'B' | 'C' optionally stored from pre-trade checklist
  news_event?: string | null; // Optional macro/news event tag
  entryTime?: string;
  exitTime?: string;
  session?: 'Asian' | 'London' | 'New York' | 'Overlap' | 'None';
  emotion?: 'Calm' | 'FOMO' | 'Revenge' | 'Confident' | 'Neutral';
  status: 'OPEN' | 'CLOSED' | 'PLAN';
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
