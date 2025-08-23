/**
 * Utility functions for formatting data consistently across the application
 */

/**
 * Formats a price with proper currency formatting
 * @param price - The price amount
 * @param currency - The currency code (MXN, USD, EUR, etc.)
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: string): string => {
    switch (currency) {
        case 'MXN':
            return `$${price.toLocaleString('es-MX')} ${currency}`;
        case 'USD':
            return `$${price.toLocaleString('en-US')}`;
        case 'EUR':
            return `€${price.toLocaleString('es-ES')}`;
        default:
            return `${currency}${price.toFixed(2)}`;
    }
};

/**
 * Calculates discount percentage
 * @param originalPrice - The original price
 * @param currentPrice - The current/discounted price
 * @returns Discount percentage as a number
 */
export const calculateDiscountPercentage = (originalPrice: number, currentPrice: number): number => {
    if (originalPrice <= 0) return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

/**
 * Formats a blockchain address for display
 * @param address - The full blockchain address
 * @param prefixLength - Number of characters to show at the beginning (default: 6)
 * @param suffixLength - Number of characters to show at the end (default: 4)
 * @returns Shortened address string
 */
export const shortenAddress = (address: string, prefixLength: number = 6, suffixLength: number = 4): string => {
    if (address.length <= prefixLength + suffixLength) return address;
    return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};
