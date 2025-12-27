import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SubstitutionAdvisorForm from '@/components/substitution-advisor-form';

export default function SubstitutionsPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-16 z-30">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Substitution Advisor</h1>
                        <p className="text-sm text-slate-500">Discover clinical equivalents with better yield.</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                    <SubstitutionAdvisorForm />
                </div>
            </main>
        </div>
    );
}
