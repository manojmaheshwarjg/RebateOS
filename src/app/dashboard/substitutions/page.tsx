import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SubstitutionAdvisorForm from '@/components/substitution-advisor-form';

export default function SubstitutionsPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Substitution Advisor</CardTitle>
                <CardDescription>Identify substitution opportunities for clinically equivalent items with better rebate terms.</CardDescription>
            </CardHeader>
            <CardContent>
                 <SubstitutionAdvisorForm />
            </CardContent>
        </Card>
    );
}
