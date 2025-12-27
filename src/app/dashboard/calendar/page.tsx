'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useLocalStorage } from '@/components/local-storage-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, eachDayOfInterval, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Contract {
    id: string;
    name: string;
    end_date: string; // ISO string
}

export default function CalendarPage() {
    const { db, userId } = useLocalStorage();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchContracts = async () => {
            setIsLoading(true);
            try {
                const data = await db.contracts
                    .where('vendor_id')
                    .equals(userId)
                    .toArray();
                setContracts(data as Contract[]);
            } catch (error) {
                console.error('Error fetching contracts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchContracts();
    }, [db, userId]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, Contract[]>();
        if (contracts) {
            contracts.forEach(contract => {
                if (contract.end_date) {
                    const dateKey = format(new Date(contract.end_date), 'yyyy-MM-dd');
                    if (!map.has(dateKey)) {
                        map.set(dateKey, []);
                    }
                    map.get(dateKey)!.push(contract);
                }
            });
        }
        return map;
    }, [contracts]);

    const deadlines = useMemo(() => Array.from(eventsByDate.keys()).map(dateStr => new Date(dateStr)), [eventsByDate]);

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
            setCurrentDate(date);
        }
    };

    const changeDate = (amount: number, unit: 'day' | 'week' | 'month') => {
        let newDate: Date;
        if (unit === 'day') newDate = addDays(currentDate, amount);
        else if (unit === 'week') newDate = addWeeks(currentDate, amount);
        else newDate = addMonths(currentDate, amount);
        setCurrentDate(newDate);
        setSelectedDate(newDate);
    };

    const renderEventsForDate = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayEvents = eventsByDate.get(dateKey) || [];
        if (dayEvents.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Clock className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No activity scheduled.</p>
                </div>
            );
        }
        return (
            <ul className="space-y-2 mt-4">
                {dayEvents.map(event => (
                    <li key={event.id} className="text-sm p-3 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-900">
                        <div className="font-semibold mb-1">Contract Expiration</div>
                        {event.name}
                    </li>
                ))}
            </ul>
        );
    };

    const weekDays = eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    });

    if (isLoading) {
        return <div className="p-8"><Skeleton className="h-[600px] w-full" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-body text-slate-900 pb-20">
            <header className="bg-white border-b border-slate-200 sticky top-16 z-30">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-none mb-1">Schedule</h1>
                        <p className="text-sm text-slate-500">Track contract milestones and key dates.</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <Tabs defaultValue="month" className="w-full space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-md p-1 shadow-sm">
                            <Button variant="ghost" size="icon" onClick={() => changeDate(-1, 'month')} className="h-8 w-8 hover:bg-slate-100"><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-sm font-semibold w-32 text-center text-slate-700 select-none">{format(currentDate, 'MMMM yyyy')}</span>
                            <Button variant="ghost" size="icon" onClick={() => changeDate(1, 'month')} className="h-8 w-8 hover:bg-slate-100"><ChevronRight className="h-4 w-4" /></Button>
                            <div className="w-px h-4 bg-slate-200 mx-1"></div>
                            <Button variant="ghost" size="sm" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }} className="h-8 text-xs font-medium">Today</Button>
                        </div>
                        <TabsList className="bg-slate-100 p-1 border border-slate-200">
                            <TabsTrigger value="month" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Month</TabsTrigger>
                            <TabsTrigger value="week" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Week</TabsTrigger>
                            <TabsTrigger value="day" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Day</TabsTrigger>
                            <TabsTrigger value="agenda" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Agenda</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="month">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={handleDateSelect}
                                    modifiers={{ deadlines }}
                                    modifiersClassNames={{ deadlines: 'bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-sm' }}
                                    className="w-full flex justify-center"
                                    month={currentDate}
                                    onMonthChange={setCurrentDate}
                                    classNames={{
                                        head_cell: "text-slate-500 font-medium text-sm w-12",
                                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-slate-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                        day: "h-12 w-12 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md transition-colors",
                                        day_selected: "bg-slate-900 text-white hover:bg-slate-900 hover:text-white focus:bg-slate-900 focus:text-white",
                                        day_today: "bg-slate-100 text-slate-900 font-bold",
                                    }}
                                />
                            </div>
                            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-slate-900">{format(selectedDate, 'EEEE, MMMM d')}</h3>
                                    <p className="text-xs text-slate-500 mt-1">Daily Summary</p>
                                </div>
                                <div className="p-4">
                                    {renderEventsForDate(selectedDate)}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="week">
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                            <div className="grid grid-cols-7 divide-x divide-slate-100">
                                {weekDays.map(day => (
                                    <div key={day.toString()} className={`min-h-[200px] p-3 ${isSameDay(day, new Date()) ? 'bg-slate-50' : ''}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-semibold text-slate-500 uppercase">{format(day, 'EEE')}</span>
                                            <span className={`text-sm font-bold ${isSameDay(day, new Date()) ? 'text-indigo-600' : 'text-slate-700'}`}>{format(day, 'd')}</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {(eventsByDate.get(format(day, 'yyyy-MM-dd')) || []).map(event => (
                                                <div key={event.id} className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-sm px-2 py-1.5 truncate shadow-sm">
                                                    {event.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="day">
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <CalendarIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{format(currentDate, 'EEEE, MMMM d, yyyy')}</h2>
                                    <p className="text-slate-500 text-sm">Detailed view</p>
                                </div>
                            </div>
                            {renderEventsForDate(currentDate)}
                        </div>
                    </TabsContent>

                    <TabsContent value="agenda">
                        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden max-w-3xl mx-auto">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900">Upcoming Agenda</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {deadlines.length === 0 ? (
                                    <p className="p-8 text-center text-slate-500">No upcoming deadlines found.</p>
                                ) : (
                                    <ul className="divide-y divide-slate-100">
                                        {deadlines.sort((a, b) => a.getTime() - b.getTime())
                                            .filter(d => d >= startOfDay(new Date()))
                                            .map(date => (
                                                <li key={date.toString()} className="p-6 hover:bg-slate-50 transition-colors">
                                                    <div className="flex gap-6">
                                                        <div className="w-32 flex-shrink-0 text-right">
                                                            <div className="text-sm font-bold text-slate-900 uppercase">{format(date, 'MMM d')}</div>
                                                            <div className="text-xs text-slate-500">{format(date, 'EEEE')}</div>
                                                        </div>
                                                        <div className="flex-1">
                                                            {renderEventsForDate(date)}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
