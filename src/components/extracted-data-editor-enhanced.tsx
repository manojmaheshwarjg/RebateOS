'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    DollarSign,
    Package,
    FileText,
    Calendar,
    AlertTriangle,
    CheckCircle2,
    Info,
    Search,
    X,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIFieldValidator } from '@/components/ai-field-validator';
import { motion, AnimatePresence } from 'framer-motion';

interface ExtractedDataEditorEnhancedProps {
    fields: any[];
    onUpdate: (fields: any[]) => void;
}

export default function ExtractedDataEditorEnhanced({ fields, onUpdate }: ExtractedDataEditorEnhancedProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [activeTab, setActiveTab] = useState('financial');

    const groupedFields = useMemo(() => ({
        financial: fields.filter(f => f.field_category === 'financial'),
        product: fields.filter(f => f.field_category === 'product'),
        terms: fields.filter(f => f.field_category === 'terms'),
        dates: fields.filter(f => f.field_category === 'dates'),
    }), [fields]);

    const tabConfig = {
        financial: {
            icon: DollarSign,
            label: 'Financial Terms',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            gradientFrom: 'from-green-500',
            gradientTo: 'to-emerald-500',
        },
        product: {
            icon: Package,
            label: 'Products',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            gradientFrom: 'from-blue-500',
            gradientTo: 'to-cyan-500',
        },
        terms: {
            icon: FileText,
            label: 'Terms & Conditions',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            gradientFrom: 'from-purple-500',
            gradientTo: 'to-pink-500',
        },
        dates: {
            icon: Calendar,
            label: 'Important Dates',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            gradientFrom: 'from-orange-500',
            gradientTo: 'to-amber-500',
        },
    };

    // Filter fields based on search query
    const filteredFields = useMemo(() => {
        if (!searchQuery) return groupedFields;

        const query = searchQuery.toLowerCase();
        return {
            financial: groupedFields.financial.filter(f =>
                f.field_name.toLowerCase().includes(query) ||
                f.field_label?.toLowerCase().includes(query) ||
                String(f.value_text || f.value_numeric || '').toLowerCase().includes(query)
            ),
            product: groupedFields.product.filter(f =>
                f.field_name.toLowerCase().includes(query) ||
                f.field_label?.toLowerCase().includes(query) ||
                String(f.value_text || f.value_numeric || '').toLowerCase().includes(query)
            ),
            terms: groupedFields.terms.filter(f =>
                f.field_name.toLowerCase().includes(query) ||
                f.field_label?.toLowerCase().includes(query) ||
                String(f.value_text || f.value_numeric || '').toLowerCase().includes(query)
            ),
            dates: groupedFields.dates.filter(f =>
                f.field_name.toLowerCase().includes(query) ||
                f.field_label?.toLowerCase().includes(query) ||
                String(f.value_text || f.value_numeric || '').toLowerCase().includes(query)
            ),
        };
    }, [groupedFields, searchQuery]);

    const getConfidenceBadge = (confidence: number) => {
        if (confidence >= 0.9) {
            return (
                <Badge className="bg-green-100 text-green-700 border-green-300 shadow-sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    High Confidence
                </Badge>
            );
        }
        if (confidence >= 0.7) {
            return (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 shadow-sm">
                    <Info className="w-3 h-3 mr-1" />
                    Medium
                </Badge>
            );
        }
        return (
            <Badge className="bg-red-100 text-red-700 border-red-300 shadow-sm">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Low
            </Badge>
        );
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
                    return `${json.tierName}: ${json.rebatePercentage}% rebate ($${json.minThreshold?.toLocaleString()} - $${json.maxThreshold?.toLocaleString()})`;
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

    const handleFieldUpdate = (fieldId: string, value: string) => {
        const updatedFields = fields.map(f =>
            f.id === fieldId ? { ...f, value_text: value, review_status: 'reviewed' } : f
        );
        onUpdate(updatedFields);
    };

    const handleApplySuggestion = (fieldId: string, suggestion: string) => {
        const updatedFields = fields.map(f =>
            f.id === fieldId ? { ...f, value_text: suggestion, review_status: 'reviewed' } : f
        );
        onUpdate(updatedFields);
    };

    const renderFieldCard = (field: any, category: string) => {
        const config = tabConfig[category as keyof typeof tabConfig];
        const Icon = config.icon;

        return (
            <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
            >
                <Card
                    className={cn(
                        "p-4 transition-all hover:shadow-lg hover:scale-[1.01] border-l-4 group",
                        config.borderColor
                    )}
                >
                    <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2.5 rounded-lg transition-all group-hover:scale-110",
                                    config.bgColor
                                )}>
                                    <Icon className={cn("h-4 w-4", config.color)} />
                                </div>
                                <div>
                                    <Label className="text-sm font-semibold">
                                        {formatFieldLabel(field)}
                                    </Label>
                                    {field.source_page && (
                                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                            <FileText className="h-3 w-3" />
                                            Page {field.source_page}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {getConfidenceBadge(field.confidence_score || 0)}
                        </div>

                        {/* AI Validation */}
                        <AIFieldValidator
                            fieldValue={formatFieldValue(field)}
                            fieldName={field.field_name}
                            fieldCategory={field.field_category}
                            confidence={field.confidence_score || 0}
                            onApplySuggestion={(suggestion) => handleApplySuggestion(field.id, suggestion)}
                        />

                        {/* Value Input */}
                        <div>
                            {field.value_json && typeof field.value_json === 'object' ? (
                                <Textarea
                                    value={formatFieldValue(field)}
                                    onChange={(e) => handleFieldUpdate(field.id, e.target.value)}
                                    className="font-mono text-xs bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                                    rows={4}
                                />
                            ) : (
                                <Input
                                    value={formatFieldValue(field)}
                                    onChange={(e) => handleFieldUpdate(field.id, e.target.value)}
                                    className="bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            )}
                        </div>

                        {/* Source Quote */}
                        {field.source_quote && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="pt-2 border-t"
                            >
                                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    Source from contract:
                                </p>
                                <p className="text-xs italic text-muted-foreground bg-muted/30 p-2 rounded">
                                    "{field.source_quote}"
                                </p>
                            </motion.div>
                        )}

                        {/* Conflict Warning */}
                        {field.has_conflict && (
                            <div className="pt-2 border-t border-red-200 bg-red-50/50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    <p className="text-xs font-semibold text-red-700">
                                        Conflicting values detected
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Multiple documents contain different values for this field.
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            </motion.div>
        );
    };

    const renderCategoryContent = (category: keyof typeof filteredFields) => {
        const categoryFields = filteredFields[category];
        const config = tabConfig[category];
        const Icon = config.icon;

        if (categoryFields.length === 0) {
            return (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-muted-foreground"
                >
                    <Icon className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">
                        {searchQuery ? 'No matching fields found' : `No ${config.label.toLowerCase()} found`}
                    </p>
                    <p className="text-sm">
                        {searchQuery ? 'Try a different search term' : 'No data was extracted for this category.'}
                    </p>
                </motion.div>
            );
        }

        return (
            <AnimatePresence mode="popLayout">
                <div className="space-y-4">
                    {categoryFields.map(field => renderFieldCard(field, category))}
                </div>
            </AnimatePresence>
        );
    };

    const totalFields = fields.length;
    const highConfidenceCount = fields.filter(f => (f.confidence_score || 0) >= 0.9).length;
    const reviewedCount = fields.filter(f => f.review_status === 'reviewed').length;
    const conflictsCount = fields.filter(f => f.has_conflict).length;

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
            {/* Enhanced Header */}
            <div className="p-6 border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Contract Data Review
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Review and verify AI-extracted contract information
                        </p>
                    </div>

                    <Button
                        variant={showSearch ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowSearch(!showSearch)}
                        className="gap-2"
                    >
                        <Search className="h-4 w-4" />
                        Search
                    </Button>
                </div>

                {/* Search Bar */}
                <AnimatePresence>
                    {showSearch && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4"
                        >
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search fields by name or value..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-10"
                                    autoFocus
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg border border-blue-200 shadow-sm"
                    >
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                            <p className="text-xs text-blue-600 font-medium">Total Fields</p>
                            <p className="text-lg font-bold text-blue-700">{totalFields}</p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 p-3 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg border border-green-200 shadow-sm"
                    >
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                            <p className="text-xs text-green-600 font-medium">High Confidence</p>
                            <p className="text-lg font-bold text-green-700">{highConfidenceCount}</p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg border border-purple-200 shadow-sm"
                    >
                        <CheckCircle2 className="h-5 w-5 text-purple-600" />
                        <div>
                            <p className="text-xs text-purple-600 font-medium">Reviewed</p>
                            <p className="text-lg font-bold text-purple-700">{reviewedCount}</p>
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-3 p-3 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg border border-orange-200 shadow-sm"
                    >
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div>
                            <p className="text-xs text-orange-600 font-medium">Needs Review</p>
                            <p className="text-lg font-bold text-orange-700">{conflictsCount}</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <div className="px-6 pt-4">
                        <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted/50">
                            {(Object.keys(tabConfig) as Array<keyof typeof tabConfig>).map(key => {
                                const config = tabConfig[key];
                                const Icon = config.icon;
                                const count = filteredFields[key].length;

                                return (
                                    <TabsTrigger
                                        key={key}
                                        value={key}
                                        className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-background data-[state=active]:to-background/80"
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="text-xs font-medium">{config.label}</span>
                                        <Badge
                                            variant={activeTab === key ? "default" : "secondary"}
                                            className="text-[10px] mt-1"
                                        >
                                            {count}
                                        </Badge>
                                    </TabsTrigger>
                                );
                            })}
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden px-6 pb-6">
                        {(Object.keys(tabConfig) as Array<keyof typeof tabConfig>).map(key => (
                            <TabsContent key={key} value={key} className="h-full mt-4">
                                <ScrollArea className="h-full pr-4">
                                    {renderCategoryContent(key)}
                                </ScrollArea>
                            </TabsContent>
                        ))}
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
