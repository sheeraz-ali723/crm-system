// PKR to USD exchange rate
export const PKR_TO_USD_RATE = 0.00361095;

export const pkrToUsd = (amount) => {
  return Number(amount || 0) * PKR_TO_USD_RATE;
};

export const formatUSD = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(pkrToUsd(amount));
};