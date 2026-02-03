import { createContext, useCallback, useEffect, useMemo, useState } from "react";

const CurrencyContext = createContext(null);

const BASE_CURRENCY = "TRY";
const CACHE_KEY = "exchangeRatesCache_v2";
const SELECTED_KEY = "selectedCurrency";
const SUPPORTED_CURRENCIES = [
  { code: "EUR", symbol: "\u20AC" },
  { code: "USD", symbol: "$" },
  { code: "TRY", symbol: "\u20BA" },
];

const getTodayKey = () => {
  try {
    return new Date().toLocaleDateString("en-CA");
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.rates || typeof parsed.rates !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (data) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const CurrencyProvider = ({ children }) => {
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [rates, setRates] = useState({ [BASE_CURRENCY]: 1 });
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem(SELECTED_KEY);
    if (saved && SUPPORTED_CURRENCIES.some((c) => c.code === saved)) {
      setSelectedCurrency(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SELECTED_KEY, selectedCurrency);
  }, [selectedCurrency]);

  useEffect(() => {
    const cached = readCache();
    const todayKey = getTodayKey();
    const cacheHasRequiredRates =
      cached?.rates?.USD && cached?.rates?.EUR && cached?.rates?.TRY;

    if (cached?.date === todayKey && cached?.rates && cacheHasRequiredRates) {
      setRates({ [BASE_CURRENCY]: 1, ...cached.rates });
      setLastUpdated(cached.date || cached.fetchedAt || null);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const fetchRates = async () => {
      const apiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
      const symbolsParam = SUPPORTED_CURRENCIES.map((c) => c.code).join(",");
      const latestParams = new URLSearchParams({
        base: BASE_CURRENCY,
        symbols: symbolsParam,
      });
      if (apiKey) latestParams.set("access_key", apiKey);

      const liveParams = new URLSearchParams({
        source: "USD",
        currencies: symbolsParam,
      });
      if (apiKey) liveParams.set("access_key", apiKey);

      const requestOnce = async (url, params) => {
        const response = await fetch(`${url}?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Failed to fetch exchange rates");
        const payload = await response.json();
        if (payload?.success === false) {
          throw new Error(payload?.error?.info || "Exchange rate API error");
        }
        return payload;
      };

      const normalizeRates = (payload) => {
        if (payload?.rates) {
          return {
            base: payload.base || BASE_CURRENCY,
            rates: payload.rates,
            date: payload.date,
          };
        }
        if (payload?.quotes) {
          const source = payload.source || "USD";
          const quotes = payload.quotes;
          const getQuote = (code) => {
            if (code === source) return 1;
            return quotes?.[`${source}${code}`];
          };
          const sourceToBase = getQuote(BASE_CURRENCY);
          if (!sourceToBase) {
            throw new Error("Missing base currency quote");
          }

          const computedRates = {};
          SUPPORTED_CURRENCIES.forEach((currency) => {
            const code = currency.code;
            if (code === BASE_CURRENCY) {
              computedRates[code] = 1;
              return;
            }
            if (code === source) {
              computedRates[code] = 1 / sourceToBase;
              return;
            }
            const sourceToCode = getQuote(code);
            if (!sourceToCode) return;
            computedRates[code] = sourceToCode / sourceToBase;
          });

          return {
            base: BASE_CURRENCY,
            rates: computedRates,
            date: payload?.date,
          };
        }
        throw new Error("Invalid exchange rate response");
      };

      let payload;
      try {
        payload = await requestOnce(
          "https://api.exchangerate.host/latest",
          latestParams
        );
      } catch {
        try {
          payload = await requestOnce(
            "https://api.exchangerate.host/live",
            liveParams
          );
        } catch {
          payload = await requestOnce("https://exchangerate.host/latest", latestParams);
        }
      }

      const normalized = normalizeRates(payload);
      const nextRates = { [BASE_CURRENCY]: 1, ...normalized.rates };
      const cachePayload = {
        date: normalized?.date || todayKey,
        base: BASE_CURRENCY,
        rates: normalized.rates,
        fetchedAt: new Date().toISOString(),
      };

      if (!isCancelled) {
        setRates(nextRates);
        setLastUpdated(cachePayload.date || cachePayload.fetchedAt || null);
        writeCache(cachePayload);
      }
    };

    fetchRates().catch(() => {
      if (cached?.rates && cacheHasRequiredRates) {
        setRates({ [BASE_CURRENCY]: 1, ...cached.rates });
        setLastUpdated(cached.date || cached.fetchedAt || null);
      }
    });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, []);

  const convertAmount = useCallback(
    (amount, fromCurrency = BASE_CURRENCY, toCurrency = selectedCurrency) => {
      const value = Number(amount || 0);
      const fromCode = fromCurrency || BASE_CURRENCY;
      const toCode = toCurrency || selectedCurrency;

      if (!Number.isFinite(value)) return 0;
      if (fromCode === toCode) return value;

      const getRate = (code) => (code === BASE_CURRENCY ? 1 : rates?.[code]);
      const fromRate = getRate(fromCode);
      const toRate = getRate(toCode);

      if (!fromRate || !toRate) return value;

      if (fromCode === BASE_CURRENCY) return value * toRate;
      if (toCode === BASE_CURRENCY) return value / fromRate;

      const amountInBase = value / fromRate;
      return amountInBase * toRate;
    },
    [rates, selectedCurrency]
  );

  const formatMoney = useCallback((amount, currencyCode, locale = "tr-TR") => {
    const value = Number(amount || 0);
    if (!Number.isFinite(value)) return "";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `${currencyCode} ${Math.round(value).toLocaleString("tr-TR")}`;
    }
  }, []);

  const value = useMemo(
    () => ({
      currencies: SUPPORTED_CURRENCIES,
      selectedCurrency,
      setSelectedCurrency,
      rates,
      lastUpdated,
      convertAmount,
      formatMoney,
      baseCurrency: BASE_CURRENCY,
    }),
    [selectedCurrency, rates, lastUpdated, convertAmount, formatMoney]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;
