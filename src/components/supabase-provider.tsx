'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

interface SupabaseContextState {
    supabase: SupabaseClient;
    user: User | null;
    session: Session | null;
    isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextState | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(false); // Set to false immediately (auth disabled)

    useEffect(() => {
        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (error) {
                // Suppress authentication errors when credentials are invalid
                console.warn('Supabase auth disabled or credentials invalid:', error);
                setSession(null);
                setUser(null);
            }
            setIsLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        supabase,
        user,
        session,
        isLoading,
    };

    return (
        <SupabaseContext.Provider value={value}>
            {children}
        </SupabaseContext.Provider>
    );
};

export const useSupabase = () => {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
};

export const useUser = () => {
    const { user, isLoading } = useSupabase();
    return { user, isLoading };
};
