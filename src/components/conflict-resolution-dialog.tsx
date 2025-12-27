'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Check,
  FileText,
  Info,
  X,
  Edit3,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { ExtractedField } from '@/lib/local-storage/db';
import {
  ConflictGroup,
  formatFieldValueForDisplay,
  getFieldValue,
  calculateSimilarity,
} from '@/lib/conflict-detection';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflict: ConflictGroup | null;
  files: Array<{ id: string; file_name: string }>;
  onResolve: (
    conflictGroup: ConflictGroup,
    selectedFieldId: string | null,
    manualValue?: string,
    resolutionNotes?: string
  ) => void;
}

export default function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflict,
  files,
  onResolve,
}: ConflictResolutionDialogProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [manualValue, setManualValue] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  if (!conflict) return null;

  const handleResolve = () => {
    if (selectedOption === 'manual') {
      onResolve(conflict, null, manualValue, resolutionNotes);
    } else {
      onResolve(conflict, selectedOption, undefined, resolutionNotes);
    }
    // Reset state
    setSelectedOption('');
    setManualValue('');
    setResolutionNotes('');
  };

  const getFileName = (sourceFileId?: string) => {
    if (!sourceFileId) return 'Unknown Source';
    const file = files.find(f => f.id === sourceFileId);
    return file?.file_name || sourceFileId;
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {(confidence * 100).toFixed(0)}%
        </Badge>
      );
    }
    if (confidence >= 0.7) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Info className="w-3 h-3 mr-1" />
          {(confidence * 100).toFixed(0)}%
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {(confidence * 100).toFixed(0)}%
      </Badge>
    );
  };

  // Calculate similarities between values
  const values = conflict.conflictingFields.map(f => getFieldValue(f));
  const similarities: number[][] = [];
  for (let i = 0; i < values.length; i++) {
    similarities[i] = [];
    for (let j = 0; j < values.length; j++) {
      if (i !== j) {
        similarities[i][j] = calculateSimilarity(values[i], values[j]);
      }
    }
  }

  const isRecommended = (fieldId: string) => fieldId === conflict.recommendedFieldId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">
                Resolve Conflict: {conflict.fieldLabel}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Multiple sources contain different values for this field. Review the options below and
                select the correct value, or enter a new one manually.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Field Information */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Field Name</p>
                <p className="text-sm font-semibold">{conflict.fieldLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Category</p>
                <Badge variant="secondary">{conflict.fieldCategory}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Conflicting Values</p>
                <p className="text-sm font-semibold">{conflict.conflictingFields.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Needs Resolution
                </Badge>
              </div>
            </div>

            {/* Conflicting Values */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Select the correct value:</Label>

              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                <div className="space-y-3">
                  {conflict.conflictingFields.map((field, index) => {
                    const recommended = isRecommended(field.id);
                    const value = getFieldValue(field);
                    const displayValue = formatFieldValueForDisplay(field);

                    return (
                      <div
                        key={field.id}
                        className={cn(
                          'relative flex gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer',
                          selectedOption === field.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50',
                          recommended && 'border-green-300 bg-green-50/50'
                        )}
                        onClick={() => setSelectedOption(field.id)}
                      >
                        {/* Radio button */}
                        <div className="pt-1">
                          <RadioGroupItem value={field.id} id={field.id} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {getFileName(field.source_file_id)}
                              </span>
                              {field.source_page && (
                                <Badge variant="outline" className="text-xs">
                                  Page {field.source_page}
                                </Badge>
                              )}
                              {getConfidenceBadge(field.confidence_score || 0)}
                              {recommended && (
                                <Badge className="bg-green-100 text-green-700 border-green-300">
                                  <Check className="w-3 h-3 mr-1" />
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            {field.created_at && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {new Date(field.created_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {/* Value */}
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Extracted Value:</p>
                            {typeof value === 'object' && !Array.isArray(value) ? (
                              <pre className="text-sm bg-background p-3 rounded border font-mono overflow-x-auto">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              <p className="text-sm font-semibold bg-background p-3 rounded border break-words overflow-hidden">
                                {displayValue}
                              </p>
                            )}
                          </div>

                          {/* Source Quote */}
                          {field.source_quote && (
                            <div className="space-y-1 overflow-hidden">
                              <p className="text-xs text-muted-foreground">Source Text:</p>
                              <p className="text-xs italic text-muted-foreground bg-muted/30 p-2 rounded border break-words">
                                "{field.source_quote}"
                              </p>
                            </div>
                          )}

                          {/* AI Reasoning */}
                          {field.ai_reasoning && (
                            <div className="space-y-1 overflow-hidden">
                              <p className="text-xs text-muted-foreground">AI Analysis:</p>
                              <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200 break-words">
                                {field.ai_reasoning}
                              </p>
                            </div>
                          )}

                          {/* Similarity indicators */}
                          {similarities[index] && similarities[index].some(s => s > 0.7) && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground mb-2">
                                Similarity to other values:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {similarities[index].map((sim, otherIndex) => {
                                  if (sim < 0.7) return null;
                                  return (
                                    <Badge
                                      key={otherIndex}
                                      variant="outline"
                                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                      {(sim * 100).toFixed(0)}% similar to Option {otherIndex + 1}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Manual Entry Option */}
                  <div
                    className={cn(
                      'relative flex gap-4 p-4 rounded-lg border-2 transition-all cursor-pointer',
                      selectedOption === 'manual'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                    onClick={() => setSelectedOption('manual')}
                  >
                    <div className="pt-1">
                      <RadioGroupItem value="manual" id="manual" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Edit3 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Enter Manual Value</span>
                        <Badge variant="outline">Custom</Badge>
                      </div>

                      {selectedOption === 'manual' && (
                        <div className="space-y-2">
                          <Label htmlFor="manual-value" className="text-xs">
                            Enter the correct value:
                          </Label>
                          <Textarea
                            id="manual-value"
                            value={manualValue}
                            onChange={e => setManualValue(e.target.value)}
                            placeholder="Type the correct value here..."
                            className="min-h-[80px]"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Resolution Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm">
                Resolution Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                placeholder="Add any notes about why you chose this value..."
                className="min-h-[60px] text-sm"
              />
            </div>
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            disabled={
              !selectedOption || (selectedOption === 'manual' && !manualValue.trim())
            }
          >
            <Check className="h-4 w-4 mr-2" />
            Resolve Conflict
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
