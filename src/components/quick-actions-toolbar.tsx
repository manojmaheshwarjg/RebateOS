import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Save,
    CheckCircle,
    SkipForward,
    Search,
    Keyboard,
    Sparkles
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatShortcut } from '@/hooks/use-keyboard-shortcuts';

interface QuickActionsToolbarProps {
    onSave?: () => void;
    onComplete?: () => void;
    onNextField?: () => void;
    onToggleSearch?: () => void;
    onShowShortcuts?: () => void;
    hasUnsavedChanges?: boolean;
    canComplete?: boolean;
}

export function QuickActionsToolbar({
    onSave,
    onComplete,
    onNextField,
    onToggleSearch,
    onShowShortcuts,
    hasUnsavedChanges = false,
    canComplete = true,
}: QuickActionsToolbarProps) {
    return (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
            <div className="px-4 py-2 flex items-center justify-between">
                {/* Left Actions */}
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={hasUnsavedChanges ? "default" : "outline"}
                                    size="sm"
                                    onClick={onSave}
                                    className="gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {hasUnsavedChanges && <span>Save Changes</span>}
                                    {!hasUnsavedChanges && <span>Saved</span>}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Save draft ({formatShortcut({ key: 'S', ctrl: true })})</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Separator orientation="vertical" className="h-6" />

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onNextField}
                                    className="gap-2"
                                >
                                    <SkipForward className="h-4 w-4" />
                                    Next Field
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Jump to next unreviewed field (Tab)</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onToggleSearch}
                                    className="gap-2"
                                >
                                    <Search className="h-4 w-4" />
                                    Search
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Search fields ({formatShortcut({ key: '/', ctrl: false })})</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onShowShortcuts}
                                    className="gap-2"
                                >
                                    <Keyboard className="h-4 w-4" />
                                    <span className="hidden sm:inline">Shortcuts</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>View keyboard shortcuts</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Separator orientation="vertical" className="h-6" />

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={onComplete}
                                    disabled={!canComplete}
                                    className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Complete Review
                                    {hasUnsavedChanges && (
                                        <Badge variant="secondary" className="ml-2">
                                            Unsaved
                                        </Badge>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Complete and approve contract ({formatShortcut({ key: 'Enter', ctrl: true })})</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </div>
    );
}
