
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ae', {
        style: 'currency',
        currency: 'AED',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}
