/**
 * Conflict Detection for Extracted Fields
 *
 * Detects when multiple files extract different values for the same field
 */

import { ExtractedField } from './local-storage/db';

export interface ConflictGroup {
  fieldName: string;
  fieldCategory: string;
  fieldLabel: string;
  conflictingFields: ExtractedField[];
  recommendedFieldId?: string; // The field with highest confidence
}

export interface ConflictValue {
  field: ExtractedField;
  sourceFileName?: string;
  displayValue: string;
}

/**
 * Detect conflicts across extracted fields
 * Returns groups of fields that have conflicting values
 */
export function detectConflicts(
  fields: ExtractedField[],
  files?: Array<{ id: string; file_name: string }>
): ConflictGroup[] {
  const conflicts: ConflictGroup[] = [];

  // Group fields by field_name and field_category
  const fieldGroups = new Map<string, ExtractedField[]>();

  fields.forEach(field => {
    const key = `${field.field_category || 'unknown'}:${field.field_name}`;
    if (!fieldGroups.has(key)) {
      fieldGroups.set(key, []);
    }
    fieldGroups.get(key)!.push(field);
  });

  // Check each group for conflicts
  fieldGroups.forEach((groupFields, key) => {
    // Only consider groups with multiple fields
    if (groupFields.length < 2) return;

    // Check if values are different
    const values = new Set<string>();
    groupFields.forEach(field => {
      const value = getFieldValue(field);
      if (value !== null && value !== '') {
        values.add(JSON.stringify(value));
      }
    });

    // If we have multiple distinct values, it's a conflict
    if (values.size > 1) {
      // Find the field with highest confidence as recommended
      const sortedByConfidence = [...groupFields].sort(
        (a, b) => (b.confidence_score || 0) - (a.confidence_score || 0)
      );

      conflicts.push({
        fieldName: groupFields[0].field_name,
        fieldCategory: groupFields[0].field_category || 'unknown',
        fieldLabel: groupFields[0].field_label || formatFieldName(groupFields[0].field_name),
        conflictingFields: groupFields,
        recommendedFieldId: sortedByConfidence[0]?.id,
      });
    }
  });

  return conflicts;
}

/**
 * Get the value from a field in a normalized format
 */
export function getFieldValue(field: ExtractedField): any {
  if (field.value_json !== undefined && field.value_json !== null) {
    return field.value_json;
  }
  if (field.value_text !== undefined && field.value_text !== null) {
    return field.value_text;
  }
  if (field.value_numeric !== undefined && field.value_numeric !== null) {
    return field.value_numeric;
  }
  if (field.value_date !== undefined && field.value_date !== null) {
    return field.value_date;
  }
  if (field.value_boolean !== undefined && field.value_boolean !== null) {
    return field.value_boolean;
  }
  return null;
}

/**
 * Format field name for display
 */
export function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format field value for display
 */
export function formatFieldValueForDisplay(field: ExtractedField): string {
  const value = getFieldValue(field);

  if (value === null || value === undefined) {
    return '(empty)';
  }

  // Handle JSON objects
  if (typeof value === 'object' && !Array.isArray(value)) {
    // Special formatting for common field types
    if (field.field_name.includes('tier')) {
      return `${value.tierName || 'Tier'}: ${value.rebatePercentage || 0}% rebate`;
    }
    if (field.field_name.includes('product')) {
      return `${value.productName || ''} ${value.ndc ? `(NDC: ${value.ndc})` : ''}`.trim();
    }
    // Generic JSON display
    return JSON.stringify(value, null, 2);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return `${value.length} item(s)`;
  }

  // Handle primitives
  return String(value);
}

/**
 * Mark fields with conflicts by updating their conflict status
 */
export function markFieldsWithConflicts(
  fields: ExtractedField[],
  conflicts: ConflictGroup[]
): ExtractedField[] {
  const conflictFieldIds = new Set<string>();
  const conflictMap = new Map<string, string[]>();

  // Build map of field ID to all conflicting IDs
  conflicts.forEach(conflict => {
    const ids = conflict.conflictingFields.map(f => f.id);
    ids.forEach(id => {
      conflictFieldIds.add(id);
      conflictMap.set(id, ids.filter(otherId => otherId !== id));
    });
  });

  // Update fields with conflict information
  return fields.map(field => {
    if (conflictFieldIds.has(field.id)) {
      return {
        ...field,
        has_conflict: true,
        conflicting_field_ids: conflictMap.get(field.id) || [],
      };
    }
    return field;
  });
}

/**
 * Calculate similarity score between two values (0-1)
 * Used to detect potential conflicts that might be OCR errors
 */
export function calculateSimilarity(value1: any, value2: any): number {
  const str1 = String(value1).toLowerCase().trim();
  const str2 = String(value2).toLowerCase().trim();

  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  // Use Levenshtein distance
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  const maxLength = Math.max(str1.length, str2.length);
  const distance = matrix[str2.length][str1.length];
  return 1 - distance / maxLength;
}
