import React from 'react';
import {
    Download,
    Share2,
    FileText,
    Wand2,
    TableProperties,
    MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function QuickActionToolbar({ className, onReviewClick, onAnalyzeClick }: { className?: string; onReviewClick?: () => void; onAnalyzeClick?: () => void }) {
    return (
        <div className={className}>
            <TooltipProvider>
                <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                    {/* File Actions Group */}
                    <div className="flex items-center px-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50">
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Share Contract</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Export Summary</TooltipContent>
                        </Tooltip>
                    </div>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    {/* Workflow Actions */}
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 gap-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium"
                                    onClick={onAnalyzeClick}
                                >
                                    <Wand2 className="h-4 w-4" />
                                    <span className="hidden lg:inline">Smart Extract</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Re-run AI Analysis</TooltipContent>
                        </Tooltip>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-medium"
                            onClick={onReviewClick}
                        >
                            <FileText className="h-4 w-4" />
                            <span>Review Data</span>
                        </Button>
                    </div>

                    <div className="h-4 w-px bg-slate-200 mx-2" />

                    {/* Primary Action */}
                    <Button size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2">
                        <TableProperties className="h-4 w-4" />
                        <span>View Line Items</span>
                    </Button>
                </div>
            </TooltipProvider>
        </div>
    );
}
