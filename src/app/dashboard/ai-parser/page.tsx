import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AIParserForm from '@/components/ai-parser-form';

export default function AIParserPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">AI Document Parser</h1>
                        <p className="text-sm text-slate-500">Extract contract data automatically.</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="rounded-md border border-slate-200 bg-white shadow-none p-6">
                    <AIParserForm />
                </div>
            </main>
        </div>
    );
}
