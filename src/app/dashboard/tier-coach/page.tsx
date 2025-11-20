import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TierCoachForm from '@/components/tier-coach-form';

export default function TierCoachPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tier Coach</CardTitle>
                <CardDescription>Get AI-powered recommendations for tier optimization based on your data.</CardDescription>
            </CardHeader>
            <CardContent>
                <TierCoachForm />
            </CardContent>
        </Card>
    );
}
