'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfWeek, endOfWeek, startOfDay, endOfDay, eachDayOfInterval, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Contract {
    id: string;
    name: string;
    endDate: string; // ISO string
}

export default function CalendarPage() {
    const { firestore, user } = useFirebase();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentDate, setCurrentDate] = useState(new Date());

    const contractsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'contracts'), where('vendorId', '==', user.uid));
    }, [firestore, user]);

    const { data: contracts, isLoading } = useCollection<Contract>(contractsQuery);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, Contract[]>();
        if (contracts) {
            contracts.forEach(contract => {
                const dateKey = format(new Date(contract.endDate), 'yyyy-MM-dd');
                if (!map.has(dateKey)) {
                    map.set(dateKey, []);
                }
                map.get(dateKey)!.push(contract);
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
            return <p className="text-muted-foreground text-sm">No deadlines for this day.</p>;
        }
        return (
            <ul className="space-y-2">
                {dayEvents.map(event => (
                    <li key={event.id} className="text-sm p-2 bg-secondary rounded-md">
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
        return <Skeleton className="h-[600px] w-full" />;
    }

    return (
        <Tabs defaultValue="month" className="w-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => changeDate(-1, 'month')}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-lg font-semibold w-32 text-center">{format(currentDate, 'MMMM yyyy')}</span>
                        <Button variant="outline" size="icon" onClick={() => changeDate(1, 'month')}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                     <Button variant="outline" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}>Today</Button>
                </div>
                <TabsList>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="day">Day</TabsTrigger>
                    <TabsTrigger value="agenda">Agenda</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="month">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="md:col-span-2">
                        <CardContent className="p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                modifiers={{ deadlines }}
                                modifiersClassNames={{ deadlines: 'bg-primary text-primary-foreground' }}
                                className="w-full"
                                month={currentDate}
                                onMonthChange={setCurrentDate}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>{format(selectedDate, 'MMMM d, yyyy')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {renderEventsForDate(selectedDate)}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            
            <TabsContent value="week">
                <Card>
                    <CardHeader>
                        <CardTitle>Week of {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-7 gap-px bg-border border rounded-lg overflow-hidden">
                        {weekDays.map(day => (
                            <div key={day.toString()} className="bg-card p-2 min-h-[120px]">
                                <h3 className={`font-semibold text-sm ${isSameDay(day, new Date()) ? 'text-primary' : ''}`}>{format(day, 'EEE d')}</h3>
                                <div className="mt-2 space-y-1">
                                    {(eventsByDate.get(format(day, 'yyyy-MM-dd')) || []).map(event => (
                                        <div key={event.id} className="text-xs bg-primary text-primary-foreground rounded-md px-1.5 py-0.5 truncate">{event.name}</div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="day">
                <Card>
                    <CardHeader>
                        <CardTitle>{format(currentDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {renderEventsForDate(currentDate)}
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="agenda">
                <Card>
                    <CardHeader>
                        <CardTitle>Agenda</CardTitle>
                        <CardDescription>Upcoming deadlines</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {deadlines.sort((a,b) => a.getTime() - b.getTime())
                                .filter(d => d >= startOfDay(new Date()))
                                .map(date => (
                                <li key={date.toString()}>
                                    <h3 className="font-semibold text-lg mb-2">{format(date, 'EEEE, MMMM d, yyyy')}</h3>
                                    {renderEventsForDate(date)}
                                </li>
                            ))}
                        </ul>
                         {deadlines.length === 0 && <p className="text-muted-foreground">No upcoming deadlines.</p>}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
