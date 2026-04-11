const SUPPORTED_FIAT_CURRENCIES = ["USD", "EUR", "GBP", "TRY"];

const PRICE_SOURCE_PRIORITY = ["USD", "EUR", "GBP", "TRY"];

const SPECIAL_OFFER_PRICE_FIELDS = {
  USD: "priceUSD",
  EUR: "priceEUR",
  GBP: "priceGBP",
  TRY: "priceTRY",
};

const FLOOR_PLAN_PRICE_FIELDS = {
  USD: "fiyatUSD",
  EUR: "fiyatEUR",
  GBP: "fiyatGBP",
  TRY: "fiyatTRY",
};

const toPositiveNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
};

export const toRoundedPrice = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return 0;
  return Math.round(numericValue);
};

export const normalizeFiatCurrencyCode = (currencyCode, fallback = "USD") => {
  const normalizedFallback = String(fallback || "USD").trim().toUpperCase();
  const safeFallback = SUPPORTED_FIAT_CURRENCIES.includes(normalizedFallback)
    ? normalizedFallback
    : "USD";
  const normalized = String(currencyCode || "").trim().toUpperCase();
  return SUPPORTED_FIAT_CURRENCIES.includes(normalized) ? normalized : safeFallback;
};

const convertAndRound = (
  amount,
  fromCurrency,
  toCurrency = "USD",
  convertAmount
) => {
  const roundedAmount = toRoundedPrice(amount);
  if (!roundedAmount) return 0;

  const sourceCurrency = normalizeFiatCurrencyCode(fromCurrency, toCurrency);
  const targetCurrency = normalizeFiatCurrencyCode(toCurrency, "USD");

  if (sourceCurrency === targetCurrency) {
    return roundedAmount;
  }

  if (typeof convertAmount === "function") {
    const convertedValue = Number(
      convertAmount(roundedAmount, sourceCurrency, targetCurrency)
    );
    if (Number.isFinite(convertedValue) && convertedValue > 0) {
      return Math.round(convertedValue);
    }
  }

  return roundedAmount;
};

const resolvePriceSource = (
  source,
  fieldMap,
  legacyField,
  fallbackCurrency = "USD"
) => {
  for (const currencyCode of PRICE_SOURCE_PRIORITY) {
    const fieldKey = fieldMap[currencyCode];
    const amount = toPositiveNumber(source?.[fieldKey]);
    if (amount > 0) {
      return { amount, currency: currencyCode };
    }
  }

  const legacyAmount = toPositiveNumber(source?.[legacyField]);
  if (legacyAmount > 0) {
    return {
      amount: legacyAmount,
      currency: normalizeFiatCurrencyCode(source?.currency, fallbackCurrency),
    };
  }

  return {
    amount: 0,
    currency: normalizeFiatCurrencyCode(source?.currency, fallbackCurrency),
  };
};

export const getProjectSpecialOfferPriceInfo = (
  specialOffer,
  { convertAmount, fallbackCurrency = "USD", targetCurrency = "USD" } = {}
) => {
  const source = resolvePriceSource(
    specialOffer,
    SPECIAL_OFFER_PRICE_FIELDS,
    "price",
    fallbackCurrency
  );

  return {
    amount: convertAndRound(
      source.amount,
      source.currency,
      targetCurrency,
      convertAmount
    ),
    currency: normalizeFiatCurrencyCode(targetCurrency, "USD"),
    sourceCurrency: source.currency,
  };
};

export const getProjectFloorPlanPriceInfo = (
  plan,
  { convertAmount, fallbackCurrency = "USD", targetCurrency = "USD" } = {}
) => {
  const source = resolvePriceSource(
    plan,
    FLOOR_PLAN_PRICE_FIELDS,
    "fiyat",
    fallbackCurrency
  );

  return {
    amount: convertAndRound(
      source.amount,
      source.currency,
      targetCurrency,
      convertAmount
    ),
    currency: normalizeFiatCurrencyCode(targetCurrency, "USD"),
    sourceCurrency: source.currency,
  };
};

export const normalizeProjectFloorPlan = (
  plan,
  { convertAmount, fallbackCurrency = "USD" } = {}
) => {
  const usdAmount = getProjectFloorPlanPriceInfo(plan, {
    convertAmount,
    fallbackCurrency,
    targetCurrency: "USD",
  }).amount;

  const nextPlan = {
    ...(plan || {}),
    fiyat: usdAmount,
    fiyatUSD: usdAmount,
    currency: "USD",
  };

  if (!usdAmount) {
    nextPlan.fiyatEUR = toRoundedPrice(plan?.fiyatEUR);
    nextPlan.fiyatGBP = toRoundedPrice(plan?.fiyatGBP);
    nextPlan.fiyatTRY = toRoundedPrice(plan?.fiyatTRY);
    return nextPlan;
  }

  nextPlan.fiyatEUR = convertAndRound(usdAmount, "USD", "EUR", convertAmount);
  nextPlan.fiyatGBP = convertAndRound(usdAmount, "USD", "GBP", convertAmount);
  nextPlan.fiyatTRY = convertAndRound(usdAmount, "USD", "TRY", convertAmount);

  return nextPlan;
};

const normalizeSpecialOfferDownPayment = (
  specialOffer,
  sourceCurrency,
  convertAmount
) => {
  const downPaymentAmount = toPositiveNumber(
    specialOffer?.downPaymentAmount ?? specialOffer?.downPaymentPercent
  );
  const downPaymentPercent = toPositiveNumber(specialOffer?.downPaymentPercent);

  const isLikelyPercent =
    downPaymentPercent > 0 &&
    downPaymentPercent <= 100 &&
    (downPaymentAmount <= 0 || downPaymentAmount === downPaymentPercent);

  if (isLikelyPercent) {
    return downPaymentPercent;
  }

  return convertAndRound(
    downPaymentAmount,
    sourceCurrency,
    "USD",
    convertAmount
  );
};

export const normalizeProjectSpecialOffer = (
  specialOffer,
  { convertAmount, fallbackCurrency = "USD" } = {}
) => {
  const priceInfo = getProjectSpecialOfferPriceInfo(specialOffer, {
    convertAmount,
    fallbackCurrency,
    targetCurrency: "USD",
  });
  const normalizedDownPayment = normalizeSpecialOfferDownPayment(
    specialOffer,
    priceInfo.sourceCurrency,
    convertAmount
  );

  return {
    ...(specialOffer || {}),
    priceUSD: priceInfo.amount,
    priceGBP: 0,
    currency: "USD",
    downPaymentAmount: normalizedDownPayment,
    downPaymentPercent:
      normalizedDownPayment > 0
        ? normalizedDownPayment
        : toPositiveNumber(specialOffer?.downPaymentPercent),
  };
};
