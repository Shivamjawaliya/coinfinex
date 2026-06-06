// Builds OHLC candles from individual trade prices

interface Candle {
  t: number;  // timestamp (minute start)
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
}

interface CandleStore {
  current:  Candle | null;
  history:  Candle[];
}

// In-memory store — { 'AAPL': { current, history } }
const candleStore = new Map<string, CandleStore>();

// Round timestamp down to nearest minute
function getMinuteKey(ts: number): number {
  const d = new Date(ts);
  d.setSeconds(0, 0);
  return d.getTime();
}

// Called on every trade from Finnhub
export function updateCandle(
  sym:    string,
  price:  number,
  volume: number
): { candle: Candle; isNew: boolean } {

  const minuteKey = getMinuteKey(Date.now());

  if (!candleStore.has(sym)) {
    candleStore.set(sym, { current: null, history: [] });
  }

  const store = candleStore.get(sym)!;
  let isNew   = false;

  if (!store.current || store.current.t !== minuteKey) {
    // New minute started — archive old candle
    if (store.current) {
      store.history.push({ ...store.current });
      // Keep max 390 candles (full trading day = 6.5h × 60)
      if (store.history.length > 390) store.history.shift();
    }

    // Start fresh candle
    store.current = { t: minuteKey, o: price, h: price, l: price, c: price, v: volume };
    isNew = true;

  } else {
    // Same minute — update existing candle
    store.current.h  = Math.max(store.current.h, price);
    store.current.l  = Math.min(store.current.l, price);
    store.current.c  = price;
    store.current.v += volume;
  }

  return { candle: store.current, isNew };
}

// Get full candle history + current candle for a symbol
export function getCandleData(sym: string): Candle[] {
  const store = candleStore.get(sym);
  if (!store) return [];
  return store.current
    ? [...store.history, store.current]
    : [...store.history];
}