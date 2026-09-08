import type {
  Account,
  CashflowPoint,
  Card,
  Device,
  Payee,
  SecurityOverview,
  SessionEntry,
  SpendingSlice,
  Transaction,
  TransactionCategory,
  Transfer,
  User,
} from "./types";

/** Frozen "today" so generated data is identical on the server and the client. */
export const NOW = new Date(2026, 8, 7, 14, 30, 0);

/** Deterministic PRNG (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)]!;
const between = (r: () => number, min: number, max: number) => min + r() * (max - min);
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

export const USER: User = {
  id: "usr_alex",
  name: "Alexandra Morgan",
  firstName: "Alexandra",
  email: "alex.morgan@example.com",
  initials: "AM",
  memberSince: "2016-03-11",
  plan: "Premier",
};

interface AccountSeed {
  id: string;
  name: string;
  type: Account["type"];
  mask: string;
  balance: number;
  apy?: number;
  creditLimit?: number;
  openedAt: string;
}

const ACCOUNT_SEEDS: AccountSeed[] = [
  { id: "acc_checking", name: "Everyday Checking", type: "checking", mask: "•••• 4821", balance: 128_437, openedAt: "2016-03-11" },
  { id: "acc_savings", name: "High-Yield Savings", type: "savings", mask: "•••• 9042", balance: 4_218_900, apy: 0.041, openedAt: "2018-07-02" },
  { id: "acc_credit", name: "Sapphire Credit Card", type: "credit", mask: "•••• 3318", balance: -184_255, creditLimit: 1_500_000, openedAt: "2020-01-19" },
  { id: "acc_invest", name: "Brokerage & Investments", type: "investment", mask: "•••• 7751", balance: 8_640_120, apy: 0.086, openedAt: "2019-05-23" },
];

function buildHistory(r: () => number, end: number, volatility: number): number[] {
  const points: number[] = [];
  let v = end * between(r, 0.82, 0.95);
  for (let i = 0; i < 12; i++) {
    points.push(Math.round(v));
    v += (end - v) * 0.22 + (r() - 0.5) * volatility;
  }
  points[11] = end;
  return points;
}

export const ACCOUNTS: Account[] = ACCOUNT_SEEDS.map((s, i) => {
  const r = rng(1000 + i);
  const available =
    s.type === "credit" ? (s.creditLimit ?? 0) + s.balance : Math.round(s.balance * 0.98);
  return {
    ...s,
    currency: "USD" as const,
    available,
    history: buildHistory(r, s.balance, Math.abs(s.balance) * 0.04 + 5000),
  };
});

const MERCHANTS: Record<TransactionCategory, string[]> = {
  Income: ["Acme Corp Payroll", "Dividend — VTSAX", "Interest Payment", "Stripe Transfer"],
  Groceries: ["Whole Foods Market", "Trader Joe's", "Safeway", "Costco Wholesale"],
  Dining: ["Blue Bottle Coffee", "Sweetgreen", "Tartine Bakery", "Nopa", "Uber Eats"],
  Transport: ["Shell", "Chevron", "BART", "Lyft", "SF MTA Parking"],
  Shopping: ["Amazon", "Apple Store", "Uniqlo", "IKEA", "Best Buy"],
  "Bills & Utilities": ["PG&E", "Comcast Xfinity", "AT&T Wireless", "Rent — Hayes Valley", "State Farm"],
  Entertainment: ["Netflix", "Spotify", "AMC Theatres", "Steam", "The Fillmore"],
  Health: ["One Medical", "CVS Pharmacy", "Equinox", "ClassPass"],
  Travel: ["United Airlines", "Marriott Bonvoy", "Airbnb", "Hertz", "Expedia"],
  Transfers: ["Transfer to Savings", "Zelle — J. Rivera", "Venmo Cashout"],
  Fees: ["ATM Fee", "Foreign Transaction Fee", "Wire Fee"],
};

const SPEND_WEIGHTS: [TransactionCategory, number][] = [
  ["Groceries", 16],
  ["Dining", 18],
  ["Transport", 9],
  ["Shopping", 14],
  ["Bills & Utilities", 12],
  ["Entertainment", 7],
  ["Health", 6],
  ["Travel", 5],
  ["Transfers", 4],
  ["Fees", 1],
];

function weightedCategory(r: () => number): TransactionCategory {
  const total = SPEND_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let x = r() * total;
  for (const [cat, w] of SPEND_WEIGHTS) {
    if ((x -= w) <= 0) return cat;
  }
  return "Shopping";
}

function amountFor(r: () => number, category: TransactionCategory): number {
  const ranges: Partial<Record<TransactionCategory, [number, number]>> = {
    Groceries: [1800, 18500],
    Dining: [800, 9500],
    Transport: [400, 7200],
    Shopping: [1500, 42000],
    "Bills & Utilities": [3500, 240000],
    Entertainment: [999, 4500],
    Health: [1500, 26000],
    Travel: [8000, 145000],
    Transfers: [5000, 120000],
    Fees: [300, 3500],
  };
  const [min, max] = ranges[category] ?? [1000, 20000];
  return -Math.round(between(r, min, max) / 100) * 100;
}

/** All transactions across all accounts, newest first, with per-account running balance. */
export const TRANSACTIONS: Transaction[] = (() => {
  const all: Transaction[] = [];
  ACCOUNTS.forEach((account, ai) => {
    if (account.type === "investment") return;
    const r = rng(5000 + ai);
    const count = account.type === "checking" ? 128 : account.type === "credit" ? 84 : 22;
    let running = account.balance;
    for (let i = 0; i < count; i++) {
      const dayOffset = Math.floor((i / count) * 92) + Math.floor(r() * 2);
      const date = daysAgo(dayOffset);
      date.setHours(Math.floor(r() * 14) + 7, Math.floor(r() * 60));

      let category: TransactionCategory;
      let amount: number;
      if (account.type === "checking" && i % 15 === 3) {
        category = "Income";
        amount = Math.round(between(r, 285000, 340000) / 100) * 100;
      } else if (account.type === "savings") {
        category = i % 6 === 0 ? "Income" : "Transfers";
        amount = category === "Income" ? Math.round(between(r, 900, 4200)) : Math.round(between(r, 20000, 90000) / 100) * 100;
      } else {
        category = weightedCategory(r);
        amount = amountFor(r, category);
      }

      const merchant = pick(r, MERCHANTS[category]);
      const status: Transaction["status"] = dayOffset <= 1 && r() > 0.4 ? "pending" : "posted";
      all.push({
        id: `txn_${account.id}_${i}`,
        accountId: account.id,
        date: date.toISOString(),
        description: merchant,
        merchant,
        category,
        amount,
        status,
        runningBalance: running,
      });
      running -= amount;
    }
  });
  return all.sort((a, b) => +new Date(b.date) - +new Date(a.date));
})();

export const SPENDING_BY_CATEGORY: SpendingSlice[] = (() => {
  const cutoff = daysAgo(30).getTime();
  const totals = new Map<TransactionCategory, number>();
  for (const t of TRANSACTIONS) {
    if (t.amount >= 0) continue;
    if (new Date(t.date).getTime() < cutoff) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + Math.abs(t.amount));
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
})();

export const CASHFLOW: CashflowPoint[] = (() => {
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  return months.map((month, i) => {
    const r = rng(9000 + i);
    return {
      month,
      income: Math.round(between(r, 298000, 336000) / 100) * 100,
      spending: Math.round(between(r, 214000, 289000) / 100) * 100,
    };
  });
})();

export const PAYEES: Payee[] = [
  { id: "pay_rivera", name: "Jordan Rivera", bank: "Chase", accountMask: "•••• 2210", reference: "Rent share", lastPaidAt: daysAgo(6).toISOString(), favorite: true },
  { id: "pay_landlord", name: "Hayes Valley Properties", bank: "Wells Fargo", accountMask: "•••• 8890", reference: "Apt 4B rent", lastPaidAt: daysAgo(7).toISOString(), favorite: true },
  { id: "pay_amex", name: "Sapphire Card Payment", bank: "Bank of America", accountMask: "•••• 3318", lastPaidAt: daysAgo(12).toISOString(), favorite: false },
  { id: "pay_taylor", name: "Taylor Kim", bank: "Ally Bank", accountMask: "•••• 5567", reference: "Dinner + tickets", lastPaidAt: daysAgo(21).toISOString(), favorite: false },
  { id: "pay_freelance", name: "Bright Studio LLC", bank: "Mercury", accountMask: "•••• 1104", reference: "Invoice 0098", favorite: false },
  { id: "pay_charity", name: "SF Food Bank", bank: "Citibank", accountMask: "•••• 7788", reference: "Monthly gift", lastPaidAt: daysAgo(3).toISOString(), favorite: false },
];

export const TRANSFERS: Transfer[] = [
  { id: "trf_1001", fromAccountId: "acc_checking", toPayeeId: "pay_landlord", toName: "Hayes Valley Properties", amount: 3_250_00, currency: "USD", reference: "Apt 4B rent", status: "scheduled", createdAt: daysAgo(2).toISOString(), executeAt: daysAgo(-3).toISOString() },
  { id: "trf_1002", fromAccountId: "acc_checking", toPayeeId: "pay_charity", toName: "SF Food Bank", amount: 50_00, currency: "USD", reference: "Monthly gift", status: "scheduled", createdAt: daysAgo(1).toISOString(), executeAt: daysAgo(-6).toISOString() },
  { id: "trf_0998", fromAccountId: "acc_checking", toPayeeId: "pay_rivera", toName: "Jordan Rivera", amount: 820_00, currency: "USD", reference: "Rent share", status: "completed", createdAt: daysAgo(6).toISOString(), executeAt: daysAgo(6).toISOString() },
  { id: "trf_0995", fromAccountId: "acc_savings", toPayeeId: "pay_amex", toName: "Sapphire Card Payment", amount: 1_200_00, currency: "USD", reference: "Statement balance", status: "completed", createdAt: daysAgo(12).toISOString(), executeAt: daysAgo(12).toISOString() },
  { id: "trf_0991", fromAccountId: "acc_checking", toPayeeId: "pay_taylor", toName: "Taylor Kim", amount: 143_50, currency: "USD", reference: "Dinner + tickets", status: "completed", createdAt: daysAgo(21).toISOString(), executeAt: daysAgo(21).toISOString() },
  { id: "trf_0987", fromAccountId: "acc_checking", toPayeeId: "pay_freelance", toName: "Bright Studio LLC", amount: 2_400_00, currency: "USD", reference: "Invoice 0098", status: "failed", createdAt: daysAgo(28).toISOString(), executeAt: daysAgo(27).toISOString() },
];

export const DEVICES: Device[] = [
  { id: "dev_1", name: "iPhone 16 Pro", kind: "phone", os: "iOS 19.1", lastActive: NOW.toISOString(), location: "San Francisco, US", trusted: true, current: true },
  { id: "dev_2", name: "MacBook Pro 14”", kind: "laptop", os: "macOS 15.2", lastActive: daysAgo(0).toISOString(), location: "San Francisco, US", trusted: true, current: false },
  { id: "dev_3", name: "iPad Air", kind: "tablet", os: "iPadOS 19.1", lastActive: daysAgo(4).toISOString(), location: "San Francisco, US", trusted: true, current: false },
  { id: "dev_4", name: "Windows PC", kind: "desktop", os: "Windows 11", lastActive: daysAgo(19).toISOString(), location: "Austin, US", trusted: false, current: false },
];

export const SESSIONS: SessionEntry[] = [
  { id: "ses_1", browser: "Safari on iPhone", ip: "24.9.114.20", location: "San Francisco, US", startedAt: daysAgo(0).toISOString(), current: true },
  { id: "ses_2", browser: "Chrome on macOS", ip: "24.9.114.20", location: "San Francisco, US", startedAt: daysAgo(1).toISOString(), current: false },
  { id: "ses_3", browser: "Firefox on Windows", ip: "70.112.8.44", location: "Austin, US", startedAt: daysAgo(19).toISOString(), current: false },
];

export const SECURITY: SecurityOverview = {
  score: 82,
  twoFactorEnabled: true,
  method: "authenticator",
  recoveryCodesRemaining: 8,
  passwordUpdatedAt: daysAgo(96).toISOString(),
  alerts: [
    { id: "al_1", level: "warning", title: "New sign-in from Austin, US", detail: "Firefox on Windows • verify this was you", at: daysAgo(19).toISOString() },
    { id: "al_2", level: "info", title: "Recovery codes running low", detail: "8 of 10 unused — generate a fresh set", at: daysAgo(5).toISOString() },
    { id: "al_3", level: "info", title: "Trusted device added", detail: "iPad Air was added to trusted devices", at: daysAgo(4).toISOString() },
  ],
};

export const CARDS: Card[] = [
  { id: "card_1", accountId: "acc_credit", name: "Sapphire Credit", network: "Visa", mask: "•••• 3318", expiry: "08/29", frozen: false, contactless: true, monthlyLimit: 5_000_00, monthlySpent: 1_842_55, color: "sapphire" },
  { id: "card_2", accountId: "acc_checking", name: "Everyday Debit", network: "Mastercard", mask: "•••• 4821", expiry: "03/28", frozen: false, contactless: true, monthlyLimit: 3_000_00, monthlySpent: 986_20, color: "graphite" },
];

/** The demo one-time code accepted by the 2FA challenge. */
export const DEMO_2FA_CODE = "123456";
