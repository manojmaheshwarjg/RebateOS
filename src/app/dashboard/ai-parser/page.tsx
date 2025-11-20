import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AIParserForm from '@/components/ai-parser-form';

export default function AIParserPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Document Parser</CardTitle>
                <CardDescription>Automatically extract key information from rebate contracts. Upload a contract document to begin.</CardDescription>
            </CardHeader>
            <CardContent>
                <AIParserForm />
            </CardContent>
        </Card>
    );
}
