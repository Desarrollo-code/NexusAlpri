// src/app/(app)/dashboard/page.tsx
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import type { UserRole } from '@/types';
import { useTitle } from '@/contexts/title-context';
import { adminDashboardTour, studentDashboardTour, instructorDashboardTour } from '@/lib/tour-steps';
import { useTour } from '@/contexts/tour-context';
import { useToast } from '@/hooks/use-toast';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { InstructorDashboard } from '@/components/dashboard/instructor-dashboard';
import { StudentDashboard } from '@/components/dashboard/student-dashboard';

// --- MAIN PAGE COMPONENT ---
export default function DashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { setPageTitle } = useTitle();
  const { startTour } = useTour();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchDashboardData = useCallback(async () => {
    if (!user) return; // No hacer fetch si no hay usuario
    setIsLoading(true); setError(null);
    try {
        const res = await fetch(`/api/dashboard/data`, { cache: 'no-store' });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Error al obtener datos`);
        const fetchedData = await res.json();
        setData(fetchedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Solo llamar a fetch si el usuario está definido
    if (user) {
      fetchDashboardData();
    } else if (!isAuthLoading) {
      // Si la autenticación ha terminado y no hay usuario, dejar de cargar.
      setIsLoading(false);
    }
  }, [user, isAuthLoading, fetchDashboardData]);

  useEffect(() => {
    setPageTitle('Panel Principal');
    if (!user) return;
    const tourKeyMap: Record<UserRole, string> = { ADMINISTRATOR: 'adminDashboard', INSTRUCTOR: 'instructorDashboard', STUDENT: 'studentDashboard' };
    const tourStepsMap: Record<UserRole, any> = { ADMINISTRATOR: adminDashboardTour, INSTRUCTOR: instructorDashboardTour, STUDENT: studentDashboardTour };
    startTour(tourKeyMap[user.role], tourStepsMap[user.role]);
  }, [setPageTitle, startTour, user]);

  const handleEnrollmentChange = useCallback(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleParticipate = async (eventId: string, occurrenceDate: Date) => {
    try {
        const res = await fetch('/api/events/participate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId, occurrenceDate: occurrenceDate.toISOString() }),
        });
        if (!res.ok) throw new Error('No se pudo confirmar la participación.');
        toast({ title: '¡Participación Confirmada!', description: 'Has ganado puntos de experiencia por tu participación.' });
        fetchDashboardData();
    } catch(err) {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive'});
    }
  };
  
  const renderContentForRole = () => {
    if (!user || !data) return null;
    switch (user.role) {
      case 'ADMINISTRATOR':
        return <AdminDashboard adminStats={data.adminStats} securityLogs={data.securityLogs} />;
      case 'INSTRUCTOR':
        return <InstructorDashboard instructorStats={data.instructorStats} recentAnnouncements={data.recentAnnouncements} taughtCourses={data.taughtCourses} upcomingEvents={data.upcomingEvents} />;
      case 'STUDENT':
        return <StudentDashboard studentStats={data.studentStats} myDashboardCourses={data.myDashboardCourses} assignedCourses={data.assignedCourses} recentAnnouncements={data.recentAnnouncements} upcomingEvents={data.upcomingEvents} onEnrollmentChange={handleEnrollmentChange} onParticipate={handleParticipate} />;
      default:
        return <p>Rol de usuario no reconocido.</p>;
    }
  };
  
  if (isAuthLoading || isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error ? (
        <Card className="text-center p-8"><p className="text-destructive">{error}</p></Card>
      ) : renderContentForRole()}
    </div>
  );
}
