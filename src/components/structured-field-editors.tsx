'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

// --- Types ---

export interface RebateTier {
    tierName: string;
    minThreshold: number;
    maxThreshold: number | null;
    rebatePercentage: number;
    rebateType: 'percentage' | 'fixed' | 'per_unit';
    applicableProducts?: string[];
}

export interface Product {
    productName: string;
    ndc: string | null;
    sku: string | null;
    category: string;
    unitPrice: number | null;
    unitOfMeasure: string | null;
}

// --- Rebate Tier Editor ---

interface RebateTierEditorProps {
    tiers: RebateTier[];
    onChange: (tiers: RebateTier[]) => void;
}

export function RebateTierEditor({ tiers, onChange }: RebateTierEditorProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<RebateTier | null>(null);

    const handleAdd = () => {
        const newTier: RebateTier = {
            tierName: `Tier ${tiers.length + 1}`,
            minThreshold: 0,
            maxThreshold: null,
            rebatePercentage: 0,
            rebateType: 'percentage',
            applicableProducts: []
        };
        onChange([...tiers, newTier]);
        setEditingIndex(tiers.length); // Start editing the new item immediately
        setEditValues(newTier);
    };

    const handleRemove = (index: number) => {
        const newTiers = [...tiers];
        newTiers.splice(index, 1);
        onChange(newTiers);
        if (editingIndex === index) cancelEdit();
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditValues({ ...tiers[index] });
    };

    const saveEdit = () => {
        if (editingIndex !== null && editValues) {
            const newTiers = [...tiers];
            newTiers[editingIndex] = editValues;
            onChange(newTiers);
            cancelEdit();
        }
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditValues(null);
    };

    const updateEditValue = (field: keyof RebateTier, value: any) => {
        if (editValues) {
            setEditValues({ ...editValues, [field]: value });
        }
    };

    return (
        <div className="space-y-4 overflow-hidden">
            <div className="rounded-md border overflow-x-auto max-w-full">
                <Table className="min-w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tier Name</TableHead>
                            <TableHead>Min Threshold</TableHead>
                            <TableHead>Max Threshold</TableHead>
                            <TableHead>Rebate %</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tiers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No rebate tiers defined.
                                </TableCell>
                            </TableRow>
                        )}
                        {tiers.map((tier, index) => (
                            <TableRow key={index}>
                                {editingIndex === index && editValues ? (
                                    <>
                                        <TableCell>
                                            <Input
                                                value={editValues.tierName}
                                                onChange={(e) => updateEditValue('tierName', e.target.value)}
                                                className="h-8 w-full"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={editValues.minThreshold}
                                                onChange={(e) => updateEditValue('minThreshold', parseFloat(e.target.value) || 0)}
                                                className="h-8 w-24"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                placeholder="Unlimited"
                                                value={editValues.maxThreshold ?? ''}
                                                onChange={(e) => updateEditValue('maxThreshold', e.target.value ? parseFloat(e.target.value) : null)}
                                                className="h-8 w-24"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={editValues.rebatePercentage}
                                                onChange={(e) => updateEditValue('rebatePercentage', parseFloat(e.target.value) || 0)}
                                                className="h-8 w-20"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={editValues.rebateType}
                                                onValueChange={(val: any) => updateEditValue('rebateType', val)}
                                            >
                                                <SelectTrigger className="h-8 w-28">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Percentage</SelectItem>
                                                    <SelectItem value="fixed">Fixed Amt</SelectItem>
                                                    <SelectItem value="per_unit">Per Unit</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={saveEdit}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={cancelEdit}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell className="font-medium">{tier.tierName || 'N/A'}</TableCell>
                                        <TableCell>{tier.minThreshold ?? 'N/A'}</TableCell>
                                        <TableCell>{tier.maxThreshold ?? '∞'}</TableCell>
                                        <TableCell>
                                            {tier.rebatePercentage ?? 'N/A'}
                                            {tier.rebateType === 'percentage' ? '%' : (tier.rebateType === 'fixed' ? '$' : '/unit')}
                                        </TableCell>
                                        <TableCell className="capitalize">{tier.rebateType?.replace('_', ' ') || 'N/A'}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(index)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemove(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <Button size="sm" variant="outline" onClick={handleAdd} className="w-full border-dashed border-2">
                <Plus className="mr-2 h-4 w-4" /> Add Tier
            </Button>
        </div>
    );
}

// --- Product Editor ---

interface ProductListEditorProps {
    products: Product[];
    onChange: (products: Product[]) => void;
}

export function ProductListEditor({ products, onChange }: ProductListEditorProps) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<Product | null>(null);

    const handleAdd = () => {
        const newProduct: Product = {
            productName: '',
            ndc: '',
            sku: null,
            category: 'Uncategorized',
            unitPrice: null,
            unitOfMeasure: null
        };
        onChange([...products, newProduct]);
        setEditingIndex(products.length);
        setEditValues(newProduct);
    };

    const handleRemove = (index: number) => {
        const newProducts = [...products];
        newProducts.splice(index, 1);
        onChange(newProducts);
        if (editingIndex === index) cancelEdit();
    };

    const startEdit = (index: number) => {
        setEditingIndex(index);
        setEditValues({ ...products[index] });
    };

    const saveEdit = () => {
        if (editingIndex !== null && editValues) {
            const newProducts = [...products];
            newProducts[editingIndex] = editValues;
            onChange(newProducts);
            cancelEdit();
        }
    };

    const cancelEdit = () => {
        setEditingIndex(null);
        setEditValues(null);
    };

    const updateEditValue = (field: keyof Product, value: any) => {
        if (editValues) {
            setEditValues({ ...editValues, [field]: value });
        }
    };

    return (
        <div className="space-y-4 overflow-hidden">
            <div className="rounded-md border overflow-x-auto max-w-full">
                <Table className="min-w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">Product Name</TableHead>
                            <TableHead>NDC</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                    No products listed.
                                </TableCell>
                            </TableRow>
                        )}
                        {products.map((product, index) => (
                            <TableRow key={index}>
                                {editingIndex === index && editValues ? (
                                    <>
                                        <TableCell>
                                            <Input
                                                value={editValues.productName}
                                                onChange={(e) => updateEditValue('productName', e.target.value)}
                                                placeholder="Product Name"
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={editValues.ndc || ''}
                                                onChange={(e) => updateEditValue('ndc', e.target.value)}
                                                placeholder="00000-0000-00"
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={editValues.category}
                                                onChange={(e) => updateEditValue('category', e.target.value)}
                                                className="h-8"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={saveEdit}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600" onClick={cancelEdit}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell className="font-medium">{product.productName}</TableCell>
                                        <TableCell>{product.ndc || '-'}</TableCell>
                                        <TableCell>{product.category}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(index)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemove(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <Button size="sm" variant="outline" onClick={handleAdd} className="w-full border-dashed border-2">
                <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
        </div>
    );
}
