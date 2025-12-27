import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Sparkles,
    AlertTriangle,
    CheckCircle2,
    Lightbulb,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIValidation {
    isValid: boolean;
    severity: 'info' | 'warning' | 'error';
    message: string;
    suggestion?: string;
}

interface AIFieldValidatorProps {
    fieldValue: any;
    fieldName: string;
    fieldCategory: string;
    confidence: number;
    onApplySuggestion?: (suggestion: string) => void;
}

export function AIFieldValidator({
    fieldValue,
    fieldName,
    fieldCategory,
    confidence,
    onApplySuggestion,
}: AIFieldValidatorProps) {
    const [dismissed, setDismissed] = useState(false);

    // AI validation logic
    const validation = validateField(fieldValue, fieldName, fieldCategory, confidence);

    if (!validation || dismissed) return null;

    const icons = {
        info: Lightbulb,
        warning: AlertTriangle,
        error: AlertTriangle,
    };

    const Icon = icons[validation.severity];

    const colors = {
        info: 'text-blue-600 bg-blue-50 border-blue-200',
        warning: 'text-orange-600 bg-orange-50 border-orange-200',
        error: 'text-red-600 bg-red-50 border-red-200',
    };

    return (
        <Alert className={cn('relative', colors[validation.severity])}>
            <Icon className="h-4 w-4" />
            <AlertDescription className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        <span className="text-xs font-medium">AI Validation</span>
                    </div>
                    <p className="text-xs">{validation.message}</p>

                    {validation.suggestion && onApplySuggestion && (
                        <div className="flex items-center gap-2 mt-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onApplySuggestion(validation.suggestion!)}
                                className="h-7 text-xs"
                            >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Apply Suggestion
                            </Button>
                            <span className="text-xs text-muted-foreground italic">
                                "{validation.suggestion}"
                            </span>
                        </div>
                    )}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDismissed(true)}
                    className="h-6 w-6 p-0"
                >
                    <X className="h-3 w-3" />
                </Button>
            </AlertDescription>
        </Alert>
    );
}

// AI Validation Rules
function validateField(
    value: any,
    fieldName: string,
    category: string,
    confidence: number
): AIValidation | null {
    // Low confidence warning
    if (confidence < 0.7) {
        return {
            isValid: false,
            severity: 'warning',
            message: `Low confidence extraction (${Math.round(confidence * 100)}%). Please verify this value manually.`,
        };
    }

    // Financial field validations
    if (category === 'financial') {
        // Rebate percentage validation
        if (fieldName.includes('rebate') && fieldName.includes('percentage')) {
            const numValue = parseFloat(value);
            if (numValue > 100) {
                return {
                    isValid: false,
                    severity: 'error',
                    message: 'Rebate percentage exceeds 100%. This seems unusual and may be incorrect.',
                };
            }
            if (numValue < 0) {
                return {
                    isValid: false,
                    severity: 'error',
                    message: 'Negative rebate percentage detected. Please verify this value.',
                };
            }
        }

        // Minimum/maximum threshold validation
        if (fieldName.includes('threshold')) {
            const numValue = parseFloat(value);
            if (numValue < 0) {
                return {
                    isValid: false,
                    severity: 'error',
                    message: 'Negative threshold value detected. Please verify this is correct.',
                };
            }
        }
    }

    // Date field validations
    if (category === 'dates') {
        try {
            const date = new Date(value);
            const now = new Date();

            // Expiration date in the past
            if (fieldName.includes('expiration') && date < now) {
                return {
                    isValid: true,
                    severity: 'warning',
                    message: 'This expiration date is in the past. Contract may have expired.',
                };
            }

            // Effective date far in future
            if (fieldName.includes('effective') && date > new Date(now.getFullYear() + 5, now.getMonth())) {
                return {
                    isValid: true,
                    severity: 'info',
                    message: 'Effective date is more than 5 years in the future. Please verify this is correct.',
                };
            }
        } catch {
            // Invalid date format
            return {
                isValid: false,
                severity: 'error',
                message: 'Invalid date format detected. Expected format: YYYY-MM-DD',
                suggestion: new Date().toISOString().split('T')[0],
            };
        }
    }

    // Product field validations
    if (category === 'product') {
        // NDC format validation
        if (fieldName.includes('ndc')) {
            const ndcPattern = /^\d{5}-\d{4}-\d{2}$/;
            if (value && !ndcPattern.test(value)) {
                return {
                    isValid: false,
                    severity: 'warning',
                    message: 'NDC format may be incorrect. Expected format: XXXXX-XXXX-XX',
                };
            }
        }
    }

    // All validations passed
    return null;
}
