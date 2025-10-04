// src/app/certificates/[enrollmentId]/view/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { CertificateDisplay } from '@/components/certificates/certificate-display';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { PrintButton } from '@/components/certificates/print-button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

async function getCertificateData(enrollmentId: string) {
    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: {
                user: true,
                course: {
                    include: {
                        certificateTemplate: true,
                    },
                },
                progress: true,
            },
        });

        if (!enrollment || !enrollment.progress?.completedAt || !enrollment.course.certificateTemplateId) {
            return null;
        }

        return {
            studentName: enrollment.user.name,
            courseName: enrollment.course.title,
            completionDate: enrollment.progress.completedAt,
            score: enrollment.progress.progressPercentage,
            template: enrollment.course.certificateTemplate,
        };
    } catch (error) {
        console.error("Error fetching certificate data:", error);
        return null;
    }
}

export default async function CertificatePage({ params }: { params: { enrollmentId: string } }) {
    const data = await getCertificateData(params.enrollmentId);

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Certificado no disponible</CardTitle>
                        <CardDescription>
                            No se pudo generar el certificado. Es posible que el curso no esté completado o que no tenga una plantilla de certificado asignada.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="bg-muted min-h-screen p-4 sm:p-8 flex flex-col items-center justify-center">
            <div className="w-full max-w-4xl space-y-4">
                <div className="p-4 bg-background rounded-lg shadow-lg print:hidden">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-center sm:text-left">
                           <h1 className="text-xl font-bold">¡Felicidades, {data.studentName}!</h1>
                           <p className="text-muted-foreground">Has completado el curso. Puedes guardar tu certificado como PDF.</p>
                        </div>
                        <PrintButton />
                    </div>
                </div>
                <div className="bg-background p-2 rounded-lg shadow-2xl">
                    <CertificateDisplay
                        template={data.template!}
                        studentName={data.studentName!}
                        courseName={data.courseName}
                        completionDate={data.completionDate}
                        score={data.score}
                    />
                </div>
            </div>
        </div>
    );
}
