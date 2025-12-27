/**
 * Field Validation Utilities
 * Provides format, range, and consistency validation for contract fields
 */

export interface ValidationResult {
    isValid: boolean;
    level: 'error' | 'warning' | 'info';
    message: string;
}

/**
 * Validate percentage field (0-100)
 */
export function validatePercentage(value: string | number): ValidationResult {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
        return {
            isValid: false,
            level: 'error',
            message: 'Invalid format. Please enter a number.',
        };
    }

    if (numValue < 0 || numValue > 100) {
        return {
            isValid: false,
            level: 'error',
            message: 'Percentage must be between 0 and 100.',
        };
    }

    // Warning for unusual rebate values
    if (numValue > 50) {
        return {
            isValid: true,
            level: 'warning',
            message: 'Unusual value: Most rebates are between 0-50%. Are you sure this is correct?',
        };
    }

    if (numValue === 0) {
        return {
            isValid: true,
            level: 'warning',
            message: '0% rebate detected. Please verify this is intentional.',
        };
    }

    return { isValid: true, level: 'info', message: '' };
}

/**
 * Validate date field (YYYY-MM-DD format)
 */
export function validateDate(value: string): ValidationResult {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(value)) {
        return {
            isValid: false,
            level: 'error',
            message: 'Invalid date format. Use YYYY-MM-DD (e.g., 2024-12-31).',
        };
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
        return {
            isValid: false,
            level: 'error',
            message: 'Invalid date. Please check the day/month combination.',
        };
    }

    // Warning for very old or future dates
    const now = new Date();
    const yearsDiff = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (yearsDiff > 10) {
        return {
            isValid: true,
            level: 'warning',
            message: 'Date is more than 10 years in the future. Please verify.',
        };
    }

    if (yearsDiff < -10) {
        return {
            isValid: true,
            level: 'warning',
            message: 'Date is more than 10 years in the past. Please verify.',
        };
    }

    return { isValid: true, level: 'info', message: '' };
}

/**
 * Validate NDC (National Drug Code) format
 * Format: XXXXX-XXXX-XX or XXXXX-XXX-XX or XXXX-XXXX-XX
 */
export function validateNDC(value: string): ValidationResult {
    // Remove spaces
    const cleaned = value.replace(/\s/g, '');

    // Valid NDC formats: 5-4-2, 5-3-2, 4-4-2
    const ndcRegex = /^(\d{5}-\d{4}-\d{2})|(\d{5}-\d{3}-\d{2})|(\d{4}-\d{4}-\d{2})$/;

    if (!ndcRegex.test(cleaned)) {
        return {
            isValid: false,
            level: 'error',
            message: 'Invalid NDC format. Expected format: XXXXX-XXXX-XX (with dashes).',
        };
    }

    return { isValid: true, level: 'info', message: '' };
}

/**
 * Validate dollar amount
 */
export function validateAmount(value: string | number): ValidationResult {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : value;

    if (isNaN(numValue)) {
        return {
            isValid: false,
            level: 'error',
            message: 'Invalid amount. Please enter a valid number.',
        };
    }

    if (numValue < 0) {
        return {
            isValid: false,
            level: 'error',
            message: 'Amount cannot be negative.',
        };
    }

    if (numValue > 10000000) {
        return {
            isValid: true,
            level: 'warning',
            message: 'Very large amount detected. Please verify this is correct.',
        };
    }

    return { isValid: true, level: 'info', message: '' };
}

/**
 * Validate consistency between effective and expiration dates
 */
export function validateDateRange(effectiveDate: string, expirationDate: string): ValidationResult {
    const effective = new Date(effectiveDate);
    const expiration = new Date(expirationDate);

    if (isNaN(effective.getTime()) || isNaN(expiration.getTime())) {
        return {
            isValid: false,
            level: 'error',
            message: 'Both dates must be valid before checking range.',
        };
    }

    if (effective >= expiration) {
        return {
            isValid: false,
            level: 'error',
            message: 'Effective date must be before expiration date.',
        };
    }

    // Warning for very short contracts
    const daysDiff = (expiration.getTime() - effective.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < 30) {
        return {
            isValid: true,
            level: 'warning',
            message: 'Contract duration is less than 30 days. Please verify.',
        };
    }

    // Warning for very long contracts
    if (daysDiff > 3650) {
        return {
            isValid: true,
            level: 'warning',
            message: 'Contract duration exceeds 10 years. Please verify.',
        };
    }

    return { isValid: true, level: 'info', message: '' };
}

/**
 * Get validator function based on field type
 */
export function getValidator(fieldName: string): ((value: any) => ValidationResult) | null {
    if (fieldName.includes('percentage') || fieldName.includes('rebate_percentage')) {
        return validatePercentage;
    }
    if (fieldName.includes('date')) {
        return validateDate;
    }
    if (fieldName.includes('ndc')) {
        return validateNDC;
    }
    if (
        fieldName.includes('amount') ||
        fieldName.includes('threshold') ||
        fieldName.includes('cap') ||
        fieldName.includes('price')
    ) {
        return validateAmount;
    }
    return null;
}

/**
 * Validate an entire field object
 */
export function validateField(field: any): ValidationResult | null {
    const validator = getValidator(field.field_name);
    if (!validator) return null;

    const value = field.value_text || field.value_numeric || field.value_date || '';
    return validator(value);
}
