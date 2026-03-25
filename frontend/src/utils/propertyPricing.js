const toArray = (value) => (Array.isArray(value) ? value : []);

const toPositiveNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
};

const normalizeCurrencyCode = (value, fallback = "USD") => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  return normalized || fallback;
};

const FLOOR_PLAN_PRICE_FIELDS = [
  { key: "fiyatUSD", currency: "USD" },
  { key: "fiyatEUR", currency: "EUR" },
  { key: "fiyatGBP", currency: "GBP" },
  { key: "fiyatTRY", currency: "TRY" },
];

const getFloorPlanPriceCandidates = (property, defaultCurrency = "USD") => {
  const propertyCurrency = normalizeCurrencyCode(
    property?.currency,
    defaultCurrency
  );

  return toArray(property?.dairePlanlari).flatMap((plan) => {
    const explicitCandidates = FLOOR_PLAN_PRICE_FIELDS.map(
      ({ key, currency }) => {
        const amount = toPositiveNumber(plan?.[key]);
        return amount ? { amount, currency } : null;
      }
    ).filter(Boolean);

    const legacyAmount = toPositiveNumber(plan?.fiyat);
    if (legacyAmount) {
      explicitCandidates.push({
        amount: legacyAmount,
        currency: normalizeCurrencyCode(plan?.currency, propertyCurrency),
      });
    }

    return explicitCandidates;
  });
};

export const getPropertyDisplayPriceInfo = (
  property,
  { convertAmount, comparisonCurrency = "USD", defaultCurrency = "USD" } = {}
) => {
  const propertyCurrency = normalizeCurrencyCode(
    property?.currency,
    defaultCurrency
  );
  const directAmount = toPositiveNumber(property?.price);

  if (directAmount) {
    return {
      amount: directAmount,
      currency: propertyCurrency,
    };
  }

  const floorPlanCandidates = getFloorPlanPriceCandidates(
    property,
    defaultCurrency
  );

  if (!floorPlanCandidates.length) {
    return {
      amount: 0,
      currency: propertyCurrency,
    };
  }

  if (typeof convertAmount !== "function") {
    return floorPlanCandidates[0];
  }

  return floorPlanCandidates.reduce((lowestPrice, currentPrice) => {
    const lowestComparable = convertAmount(
      lowestPrice.amount,
      lowestPrice.currency,
      comparisonCurrency
    );
    const currentComparable = convertAmount(
      currentPrice.amount,
      currentPrice.currency,
      comparisonCurrency
    );

    return currentComparable < lowestComparable ? currentPrice : lowestPrice;
  });
};

export const getPropertyComparablePrice = (
  property,
  { convertAmount, comparisonCurrency = "USD", defaultCurrency = "USD" } = {}
) => {
  const priceInfo = getPropertyDisplayPriceInfo(property, {
    convertAmount,
    comparisonCurrency,
    defaultCurrency,
  });

  if (!priceInfo.amount) return 0;
  if (typeof convertAmount !== "function") return priceInfo.amount;

  return convertAmount(
    priceInfo.amount,
    priceInfo.currency,
    comparisonCurrency
  );
};
