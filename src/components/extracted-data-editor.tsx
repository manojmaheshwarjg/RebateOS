'use client';

import { useState, useEffect } from 'react';
import {
    DollarSign,
    Package,
    FileText,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Info,
    AlertCircle,
    ExternalLink,
    Filter,
    Check,
    Flag,
    X,
    XCircle,
    GitMerge,
    ChevronDown,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ProductListEditor, RebateTierEditor } from './structured-field-editors';
import { validateField, ValidationResult } from '@/lib/field-validation';
import ConflictResolutionDialog from './conflict-resolution-dialog';
import {
    detectConflicts,
    markFieldsWithConflicts,
    getFieldValue,
    ConflictGroup,
} from '@/lib/conflict-detection';
import { getCurrentTimestamp, MOCK_USER_ID } from '@/lib/local-storage/db';

interface ExtractedDataEditorProps {
    fields: any[];
    onUpdate: (fields: any[]) => void;
    onJumpToPage?: (page: number) => void;
    files?: Array<{ id: string; file_name: string }>;
}

export default function ExtractedDataEditor({ fields, onUpdate, onJumpToPage, files = [] }: ExtractedDataEditorProps) {
    const { toast } = useToast();
    const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showBulkConfirmDialog, setShowBulkConfirmDialog] = useState(false);
    const [bulkAction, setBulkAction] = useState<{
        type: 'accept' | 'flag';
        count: number;
    } | null>(null);
    const [conflicts, setConflicts] = useState<ConflictGroup[]>([]);
    const [selectedConflict, setSelectedConflict] = useState<ConflictGroup | null>(null);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

    // Detect conflicts when fields change
    useEffect(() => {
        const detectedConflicts = detectConflicts(fields, files);
        setConflicts(detectedConflicts);

        // Mark fields with conflicts
        if (detectedConflicts.length > 0) {
            const markedFields = markFieldsWithConflicts(fields, detectedConflicts);
            const hasChanges = markedFields.some((f, i) => f.has_conflict !== fields[i]?.has_conflict);
            if (hasChanges) {
                onUpdate(markedFields);
            }
        }
    }, [fields.length]);

    // Filter and search fields
    const activeFields = fields.filter(f => f.is_active !== false);

    const filteredFields = activeFields.filter(field => {
        // Confidence filter
        if (confidenceFilter !== 'all') {
            const confidence = field.confidence_score || 0;
            if (confidenceFilter === 'high' && confidence < 0.9) return false;
            if (confidenceFilter === 'medium' && (confidence < 0.7 || confidence >= 0.9)) return false;
            if (confidenceFilter === 'low' && confidence >= 0.7) return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && field.field_category !== categoryFilter) return false;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const fieldName = (field.field_name || '').toLowerCase();
            const fieldLabel = (field.field_label || '').toLowerCase();
            const fieldValue = String(getFieldValue(field) || '').toLowerCase();
            return fieldName.includes(query) || fieldLabel.includes(query) || fieldValue.includes(query);
        }

        return true;
    });

    // Bulk operations
    const handleBulkAccept = () => {
        const highConfidenceFields = activeFields.filter(f => (f.confidence_score || 0) >= 0.9);
        setBulkAction({ type: 'accept', count: highConfidenceFields.length });
        setShowBulkConfirmDialog(true);
    };

    const handleBulkFlag = () => {
        const mediumConfidenceFields = activeFields.filter(
            f => (f.confidence_score || 0) >= 0.7 && (f.confidence_score || 0) < 0.9
        );
        setBulkAction({ type: 'flag', count: mediumConfidenceFields.length });
        setShowBulkConfirmDialog(true);
    };

    const confirmBulkAction = () => {
        if (!bulkAction) return;

        if (bulkAction.type === 'accept') {
            const updatedFields = fields.map(f => {
                if ((f.confidence_score || 0) >= 0.9 && f.review_status === 'pending') {
                    return { ...f, review_status: 'approved', reviewed_at: new Date().toISOString() };
                }
                return f;
            });
            onUpdate(updatedFields);
            toast({
                title: 'Fields accepted',
                description: `Accepted ${bulkAction.count} high-confidence fields`,
            });
        } else if (bulkAction.type === 'flag') {
            const updatedFields = fields.map(f => {
                if (
                    (f.confidence_score || 0) >= 0.7 &&
                    (f.confidence_score || 0) < 0.9 &&
                    f.review_status === 'pending'
                ) {
                    return { ...f, requires_review: true };
                }
                return f;
            });
            onUpdate(updatedFields);
            toast({
                title: 'Fields flagged',
                description: `Flagged ${bulkAction.count} medium-confidence fields for review`,
            });
        }

        setShowBulkConfirmDialog(false);
        setBulkAction(null);
    };

    // Handle conflict resolution
    const handleResolveConflict = (
        conflictGroup: ConflictGroup,
        selectedFieldId: string | null,
        manualValue?: string,
        resolutionNotes?: string
    ) => {
        const now = getCurrentTimestamp();

        if (selectedFieldId) {
            const selectedField = conflictGroup.conflictingFields.find(f => f.id === selectedFieldId);
            if (!selectedField) return;

            const otherFieldIds = conflictGroup.conflictingFields
                .filter(f => f.id !== selectedFieldId)
                .map(f => f.id);

            const updatedFields = fields.map(f => {
                if (f.id === selectedFieldId) {
                    return {
                        ...f,
                        has_conflict: false,
                        conflicting_field_ids: [],
                        conflict_resolution: 'selected',
                        conflict_resolved_by: MOCK_USER_ID,
                        conflict_resolved_at: now,
                        review_status: 'approved',
                        reviewed_at: now,
                        review_notes: resolutionNotes || 'Selected from conflicting values',
                    };
                } else if (otherFieldIds.includes(f.id)) {
                    return {
                        ...f,
                        has_conflict: false,
                        is_active: false,
                        review_status: 'rejected',
                        reviewed_at: now,
                        review_notes: `Rejected during conflict resolution - ${resolutionNotes || ''}`,
                    };
                }
                return f;
            });

            onUpdate(updatedFields);
        } else if (manualValue !== undefined) {
            const firstField = conflictGroup.conflictingFields[0];
            const otherFieldIds = conflictGroup.conflictingFields
                .filter(f => f.id !== firstField.id)
                .map(f => f.id);

            const updatedFields = fields.map(f => {
                if (f.id === firstField.id) {
                    return {
                        ...f,
                        value_text: manualValue,
                        has_conflict: false,
                        conflicting_field_ids: [],
                        conflict_resolution: 'manual',
                        conflict_resolved_by: MOCK_USER_ID,
                        conflict_resolved_at: now,
                        review_status: 'modified',
                        reviewed_by: MOCK_USER_ID,
                        reviewed_at: now,
                        original_value: getFieldValue(f),
                        review_notes: resolutionNotes || 'Manually entered value during conflict resolution',
                        extraction_method: 'manual',
                    };
                } else if (otherFieldIds.includes(f.id)) {
                    return {
                        ...f,
                        has_conflict: false,
                        is_active: false,
                        review_status: 'rejected',
                        reviewed_at: now,
                        review_notes: `Rejected during conflict resolution - ${resolutionNotes || ''}`,
                    };
                }
                return f;
            });

            onUpdate(updatedFields);
        }

        setShowConflictDialog(false);
        setSelectedConflict(null);

        toast({
            title: 'Conflict resolved',
            description: `Successfully resolved conflict for "${conflictGroup.fieldLabel}"`,
        });

        const updatedConflicts = detectConflicts(
            fields.filter(f => f.is_active !== false),
            files
        );
        setConflicts(updatedConflicts);
    };

    const handleOpenConflictDialog = (conflict: ConflictGroup) => {
        setSelectedConflict(conflict);
        setShowConflictDialog(true);
    };

    const getConfidenceBadge = (confidence: number) => {
        if (confidence >= 0.9) {
            return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] h-4 px-1.5 font-medium">High</Badge>;
        }
        if (confidence >= 0.7) {
            return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] h-4 px-1.5 font-medium">Med</Badge>;
        }
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] h-4 px-1.5 font-medium">Low</Badge>;
    };

    const formatFieldLabel = (field: any) => {
        if (field.field_label) return field.field_label;
        return field.field_name
            .replace(/_/g, ' ')
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatFieldValue = (field: any) => {
        if (field.value_json) {
            try {
                const json = typeof field.value_json === 'string'
                    ? JSON.parse(field.value_json)
                    : field.value_json;

                if (field.field_name.includes('tier')) {
                    return `${json.tierName}: ${json.rebatePercentage}% rebate`;
                }
                if (field.field_name.includes('product')) {
                    return `${json.productName} ${json.ndc ? `(NDC: ${json.ndc})` : ''}`;
                }
                return JSON.stringify(json, null, 2);
            } catch {
                return field.value_text || field.value_numeric || '';
            }
        }
        return field.value_text || field.value_numeric || field.value_date || '';
    };

    const toggleFieldExpanded = (fieldId: string) => {
        const newExpanded = new Set(expandedFields);
        if (newExpanded.has(fieldId)) {
            newExpanded.delete(fieldId);
        } else {
            newExpanded.add(fieldId);
        }
        setExpandedFields(newExpanded);
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'financial': return DollarSign;
            case 'product': return Package;
            case 'terms': return FileText;
            case 'dates': return Calendar;
            default: return FileText;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'financial': return 'text-green-600 bg-green-50';
            case 'product': return 'text-blue-600 bg-blue-50';
            case 'terms': return 'text-purple-600 bg-purple-50';
            case 'dates': return 'text-orange-600 bg-orange-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const renderFieldCard = (field: any) => {
        const Icon = getCategoryIcon(field.field_category);
        const validationResult = validateField(field);
        const isExpanded = expandedFields.has(field.id);

        return (
            <Card
                key={field.id}
                className={cn(
                    "p-2.5 transition-all hover:shadow-sm border-l-[3px] overflow-hidden",
                    validationResult?.level === 'error' && 'border-l-red-500',
                    field.has_conflict && 'border-l-orange-500',
                    !validationResult?.level && !field.has_conflict && 'border-l-transparent'
                )}
            >
                {/* Compact Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={cn("p-1 rounded", getCategoryColor(field.field_category))}>
                            <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium truncate">
                                    {formatFieldLabel(field)}
                                </Label>
                                {getConfidenceBadge(field.confidence_score || 0)}
                            </div>
                            {(field.source_file_id || field.source_page) && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {field.source_file_id && files.length > 1 && (
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <FileText className="h-2.5 w-2.5" />
                                            {files.find(f => f.id === field.source_file_id)?.file_name || 'Unknown'}
                                        </span>
                                    )}
                                    {field.source_page && (
                                        <>
                                            {field.source_file_id && files.length > 1 && <span className="text-[10px] text-slate-400">•</span>}
                                            <button
                                                onClick={() => onJumpToPage?.(field.source_page)}
                                                className="text-[10px] text-slate-500 hover:text-blue-600 flex items-center gap-0.5"
                                            >
                                                Page {field.source_page}
                                                <ExternalLink className="h-2.5 w-2.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {(field.source_quote || field.has_conflict || validationResult?.message) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 flex-shrink-0"
                            onClick={() => toggleFieldExpanded(field.id)}
                        >
                            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform text-slate-400", isExpanded && "rotate-180")} />
                        </Button>
                    )}
                </div>

                {/* Value Input - Compact */}
                <div className="mb-1.5 overflow-hidden">
                    {field.field_name === 'rebateTiers' && field.value_json ? (
                        <div className="overflow-x-auto">
                            <RebateTierEditor
                                tiers={Array.isArray(field.value_json) ? field.value_json : JSON.parse(field.value_json as string)}
                                onChange={(newTiers) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, value_json: newTiers } : f
                                    );
                                    onUpdate(updatedFields);
                                }}
                            />
                        </div>
                    ) : field.field_name === 'products' && field.value_json ? (
                        <div className="overflow-x-auto">
                            <ProductListEditor
                                products={Array.isArray(field.value_json) ? field.value_json : JSON.parse(field.value_json as string)}
                                onChange={(newProducts) => {
                                    const updatedFields = fields.map(f =>
                                        f.id === field.id ? { ...f, value_json: newProducts } : f
                                    );
                                    onUpdate(updatedFields);
                                }}
                            />
                        </div>
                    ) : field.value_json && typeof field.value_json === 'object' ? (
                        <Textarea
                            value={formatFieldValue(field)}
                            className="font-mono text-xs h-20 break-all"
                            disabled={true}
                        />
                    ) : (
                        <Input
                            value={formatFieldValue(field)}
                            onChange={(e) => {
                                const updatedFields = fields.map(f =>
                                    f.id === field.id ? { ...f, value_text: e.target.value } : f
                                );
                                onUpdate(updatedFields);
                            }}
                            className="text-sm h-8 overflow-hidden"
                        />
                    )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="space-y-2 pt-2 border-t">
                        {/* Validation */}
                        {validationResult?.message && (
                            <div
                                className={cn(
                                    'flex items-start gap-2 p-2 rounded text-xs',
                                    validationResult.level === 'error' && 'bg-red-50 text-red-700 border border-red-200',
                                    validationResult.level === 'warning' && 'bg-yellow-50 text-yellow-700 border border-yellow-200',
                                    validationResult.level === 'info' && 'bg-blue-50 text-blue-700 border border-blue-200'
                                )}
                            >
                                {validationResult.level === 'error' && <XCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                                {validationResult.level === 'warning' && <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                                {validationResult.level === 'info' && <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                                <span>{validationResult.message}</span>
                            </div>
                        )}

                        {/* Source Quote */}
                        {field.source_quote && (
                            <div className="overflow-hidden">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Source:</p>
                                <p className="text-xs italic text-muted-foreground bg-muted/30 p-2 rounded break-words">
                                    "{field.source_quote}"
                                </p>
                            </div>
                        )}

                        {/* Conflict */}
                        {field.has_conflict && (
                            <div className="flex items-center justify-between gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                                    <p className="text-xs font-semibold text-orange-700">
                                        Conflicting values
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                                    onClick={() => {
                                        const conflict = conflicts.find(c =>
                                            c.conflictingFields.some(f => f.id === field.id)
                                        );
                                        if (conflict) {
                                            handleOpenConflictDialog(conflict);
                                        }
                                    }}
                                >
                                    <GitMerge className="h-3 w-3 mr-1" />
                                    Resolve
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        );
    };

    const totalFields = activeFields.length;
    const highConfidenceCount = activeFields.filter(f => (f.confidence_score || 0) >= 0.9).length;
    const mediumConfidenceCount = activeFields.filter(
        f => (f.confidence_score || 0) >= 0.7 && (f.confidence_score || 0) < 0.9
    ).length;
    const lowConfidenceCount = activeFields.filter(f => (f.confidence_score || 0) < 0.7).length;
    const conflictsCount = conflicts.length;

    return (
        <div className="h-full flex flex-col bg-background overflow-hidden">
            {/* Compact Header */}
            <div className="px-4 py-3 border-b flex-shrink-0 space-y-2.5">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-semibold text-slate-900">Review Data</h2>
                        <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="text-xs font-medium h-5">
                                {totalFields} fields
                            </Badge>
                            {conflictsCount > 0 && (
                                <Badge variant="outline" className="text-xs font-medium h-5 border-orange-300 bg-orange-50 text-orange-700">
                                    {conflictsCount} conflicts
                                </Badge>
                            )}
                        </div>
                    </div>
                    {conflictsCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => conflicts[0] && handleOpenConflictDialog(conflicts[0])}
                            className="h-7 gap-1.5 border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs"
                        >
                            <GitMerge className="h-3.5 w-3.5" />
                            View Conflicts
                        </Button>
                    )}
                </div>

                {/* Search & Filters Row */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search fields..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="financial">Financial</SelectItem>
                            <SelectItem value="product">Products</SelectItem>
                            <SelectItem value="terms">Terms</SelectItem>
                            <SelectItem value="dates">Dates</SelectItem>
                        </SelectContent>
                    </Select>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs">
                                Bulk Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={handleBulkAccept}
                                disabled={highConfidenceCount === 0}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                Accept High ({highConfidenceCount})
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleBulkFlag}
                                disabled={mediumConfidenceCount === 0}
                            >
                                <Flag className="h-4 w-4 mr-2" />
                                Flag Medium ({mediumConfidenceCount})
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Fields List */}
            <ScrollArea className="flex-1 overflow-hidden">
                <div className="p-2.5 space-y-1.5 max-w-full">
                    {filteredFields.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No fields found</p>
                            <p className="text-xs">Try adjusting your filters</p>
                        </div>
                    ) : (
                        filteredFields.map(field => renderFieldCard(field))
                    )}
                </div>
            </ScrollArea>

            {/* Bulk Action Confirmation Dialog */}
            {bulkAction && (
                <AlertDialog open={showBulkConfirmDialog} onOpenChange={setShowBulkConfirmDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {bulkAction.type === 'accept' ? 'Accept All High Confidence Fields?' : 'Flag All Medium Confidence Fields?'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {bulkAction.type === 'accept'
                                    ? `This will mark ${bulkAction.count} high-confidence fields as approved. You can still edit them later if needed.`
                                    : `This will flag ${bulkAction.count} medium-confidence fields for additional review.`}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmBulkAction}>
                                {bulkAction.type === 'accept' ? 'Accept All' : 'Flag All'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Conflict Resolution Dialog */}
            <ConflictResolutionDialog
                open={showConflictDialog}
                onOpenChange={setShowConflictDialog}
                conflict={selectedConflict}
                files={files}
                onResolve={handleResolveConflict}
            />
        </div>
    );
}
