"use client"
import React, { ReactNode, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SessionContext, SessionData } from '@/lib/supabase/usercontext';

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [sessionData, setSessionData] = useState<SessionData>({
    session: null,
    profile: null,
    medicines: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (event === 'SIGNED_OUT' || !newSession) {
          setSessionData({ session: null, profile: null, medicines: [] });
        } else {
          setSessionData(prev => ({
            ...prev,
            session: newSession,
          }));
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (sessionData.session) {
      const userId = sessionData.session.user.id;
      setIsLoading(true);

      const fetchData = async () => {
        try {
          const [profileResponse, medicinesResponse] = await Promise.all([
            supabase.from('profiles').select('*').eq('user_id', userId).single(),
            supabase.from('medicines').select('*').eq('user_id', userId)
          ]);

          // For new users, profile will be null - this is expected and not an error
          if (profileResponse.error && profileResponse.error.code !== 'PGRST116') {
            // PGRST116 is the error code for "no rows returned" in PostgREST
            console.error('Error fetching profile:', profileResponse.error);
          } else {
            setSessionData(prev => ({
              ...prev,
              profile: profileResponse.data || null, // Ensure null if no data
            }));
          }

          if (medicinesResponse.error) {
            console.error('Error fetching medicines:', medicinesResponse.error);
          } else {
            setSessionData(prev => ({
              ...prev,
              medicines: medicinesResponse.data || [],
            }));
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [sessionData.session, supabase]);

  return (
    <SessionContext.Provider value={{ sessionData, setSessionData, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};
