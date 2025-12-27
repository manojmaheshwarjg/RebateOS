import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface ReviewProgressTrackerProps {
    totalFields: number;
    reviewedFields: number;
    highConfidenceFields: number;
    lowConfidenceFields: number;
}

export function ReviewProgressTracker({
    totalFields,
    reviewedFields,
    highConfidenceFields,
    lowConfidenceFields,
}: ReviewProgressTrackerProps) {
    const progressPercentage = totalFields > 0 ? (reviewedFields / totalFields) * 100 : 0;
    const remaining = totalFields - reviewedFields;

    return (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-sm">Review Progress</h3>
                        <p className="text-xs text-muted-foreground">
                            {reviewedFields} of {totalFields} fields reviewed
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                            {Math.round(progressPercentage)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Complete</p>
                    </div>
                </div>

                <Progress value={progressPercentage} className="h-2" />

                <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div>
                            <div className="font-semibold text-green-700">{highConfidenceFields}</div>
                            <div className="text-muted-foreground">High Conf.</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <div>
                            <div className="font-semibold text-orange-700">{lowConfidenceFields}</div>
                            <div className="text-muted-foreground">Needs Review</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div>
                            <div className="font-semibold text-blue-700">{remaining}</div>
                            <div className="text-muted-foreground">Remaining</div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
