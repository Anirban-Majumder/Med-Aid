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

      const fetchData = async () => {
        try {
          const [profileResponse, medicinesResponse] = await Promise.all([
            supabase.from('profiles').select('*').eq('user_id', userId).single(),
            supabase.from('medicines').select('*').eq('user_id', userId)
          ]);

          if (profileResponse.error) {
            console.error('Error fetching profile:', profileResponse.error);
          } else {
            setSessionData(prev => ({
              ...prev,
              profile: profileResponse.data,
            }));
          }

          if (medicinesResponse.error) {
            console.error('Error fetching medicines:', medicinesResponse.error);
          } else {
            setSessionData(prev => ({
              ...prev,
              medicines: medicinesResponse.data,
            }));
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchData();
    }
  }, [sessionData.session, supabase]);

  return (
    <SessionContext.Provider value={{ sessionData, setSessionData }}>
      {children}
    </SessionContext.Provider>
  );
};