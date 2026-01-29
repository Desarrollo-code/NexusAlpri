'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowLeft, Search, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function EnrollmentsPage() {
    const params = useParams();
    const courseId = params.courseId as string;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/manage-courses">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Estudiantes Inscritos</h1>
                    <p className="text-muted-foreground">Gestiona los alumnos inscritos en este curso.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <CardTitle>Lista de Estudiantes</CardTitle>
                            <CardDescription>Visualiza y gestiona el progreso de tus alumnos.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar estudiante..."
                                    className="pl-8 w-[200px] lg:w-[300px]"
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Mail className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 text-muted-foreground">
                        <div className="p-4 bg-muted/50 rounded-full">
                            <Users className="h-8 w-8" />
                        </div>
                        <div className="space-y-2">
                            <p className="font-medium text-foreground">Próximamente</p>
                            <p>Esta funcionalidad estará disponible en la próxima actualización.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
