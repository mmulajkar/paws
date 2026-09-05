export function fmtMoney(n) {
  const value = Number(n) || 0;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
