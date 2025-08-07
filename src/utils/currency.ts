// Currency utility functions for PKR conversion
export const USD_TO_PKR_RATE = 280;

export const formatPKR = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-PK', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

export const convertUSDToPKR = (usdAmount: number): number => {
  return usdAmount * USD_TO_PKR_RATE;
};

export const formatCurrency = (amount: number): string => {
  return formatPKR(amount);
};