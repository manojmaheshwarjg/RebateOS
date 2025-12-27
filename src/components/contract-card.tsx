'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, MoreVertical, Eye, Edit, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { PulsingDot } from '@/components/ui/animations';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

interface ContractCardProps {
    contract: {
        id: string;
        name: string;
        vendor_id: string;
        total_files: number;
        parsing_status: 'pending' | 'processing' | 'completed' | 'failed';
        review_status: 'not_started' | 'in_progress' | 'completed';
        created_at: string;
        updated_at: string;
    };
}

export function ContractCard({ contract }: ContractCardProps) {
    const router = useRouter();

    const getStatusBadge = () => {
        if (contract.parsing_status === 'processing') {
            return (
                <Badge variant="default" className="gap-1.5">
                    <PulsingDot size="sm" />
                    <span>Processing</span>
                </Badge>
            );
        }
        if (contract.parsing_status === 'completed') {
            return (
                <Badge variant="default" className="gap-1.5 bg-green-500">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Ready</span>
                </Badge>
            );
        }
        if (contract.parsing_status === 'failed') {
            return (
                <Badge variant="destructive" className="gap-1.5">
                    <AlertCircle className="h-3 w-3" />
                    <span>Failed</span>
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="gap-1.5">
                <Clock className="h-3 w-3" />
                <span>Pending</span>
            </Badge>
        );
    };

    const getReviewStatusBadge = () => {
        if (contract.review_status === 'completed') {
            return (
                <Badge variant="outline" className="gap-1.5 border-green-500 text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Reviewed</span>
                </Badge>
            );
        }
        if (contract.review_status === 'in_progress') {
            return (
                <Badge variant="outline" className="gap-1.5 border-blue-500 text-blue-600">
                    <span>In Review</span>
                </Badge>
            );
        }
        return null;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
        >
            <Card className="group relative overflow-hidden border-2 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
                {/* Glassmorphic background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                <CardContent className="p-6 relative">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                            {/* Icon */}
                            <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                <FileText className="h-6 w-6" />
                            </div>

                            {/* Contract Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-primary transition-colors">
                                    {contract.name || `Contract ${contract.id.slice(0, 8)}`}
                                </h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {getStatusBadge()}
                                    {getReviewStatusBadge()}
                                    <Badge variant="secondary" className="gap-1.5">
                                        <FileText className="h-3 w-3" />
                                        <span>{contract.total_files} file{contract.total_files !== 1 ? 's' : ''}</span>
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/contracts/${contract.id}/review`)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                        <span>Updated {formatDate(contract.updated_at)}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/contracts/${contract.id}/review`)}
                            className="gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        >
                            <Eye className="h-3 w-3" />
                            Review Data
                        </Button>
                    </div>
                </CardContent>

                {/* Processing indicator overlay */}
                {contract.parsing_status === 'processing' && (
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary"
                        animate={{
                            x: ['-100%', '100%'],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                )}
            </Card>
        </motion.div>
    );
}
