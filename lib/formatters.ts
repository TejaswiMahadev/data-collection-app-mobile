/**
 * Utility functions for formatting agricultural and personal data.
 */

/**
 * Formats a 10-digit phone number.
 * Returns only the digits, capped at 10.
 */
export function formatPhone(text: string): string {
    return text.replace(/\D/g, '').slice(0, 10);
}

/**
 * Formats a date string to YYYY-MM-DD.
 */
export function formatDate(text: string): string {
    const cleaned = text.replace(/\D/g, '').slice(0, 8);
    if (cleaned.length > 6) {
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length > 4) {
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }
    return cleaned;
}

/**
 * Formats NPK values to N:P:K.
 * Example: 102010 -> 10:20:10
 */
export function formatNPK(text: string): string {
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    if (cleaned.length > 4) {
        return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}:${cleaned.slice(4)}`;
    } else if (cleaned.length > 2) {
        return `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
    }
    return cleaned;
}

/**
 * Validates and formats numeric input with optional precision.
 */
export function formatNumeric(text: string, precision: number = 2): string {
    // Allow only numbers and one decimal point
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
    }

    if (cleaned.includes('.')) {
        const [int, dec] = cleaned.split('.');
        return `${int}.${dec.slice(0, precision)}`;
    }

    return cleaned;
}
