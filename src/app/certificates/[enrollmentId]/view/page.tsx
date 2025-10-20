// src/app/certificates/[enrollmentId]/view/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { CertificateDisplay } from '@/components/certificates/certificate-display';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { PrintButton } from '@/components/certificates/print-button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Confetti } from '@/components/ui/confetti';
import { SocialShareButtons } from '@/components/certificates/social-share-buttons';


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
                     <CardContent>
                        <Button asChild>
                           <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4"/>Volver al Panel</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // Construir la URL pública del certificado para compartir
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/certificates/${params.enrollmentId}/view`;
    
    return (
        <div className="bg-muted min-h-screen p-4 sm:p-8 flex flex-col items-center justify-start relative overflow-hidden">
            <Confetti />
            <div className="w-full max-w-5xl space-y-6 z-10">
                <div className="p-4 bg-background/80 backdrop-blur-sm rounded-xl shadow-lg print:hidden border">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-center sm:text-left">
                           <h1 className="text-2xl font-bold font-headline">¡Felicidades, {data.studentName}!</h1>
                           <p className="text-muted-foreground">Has completado el curso y obtenido tu certificado.</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                           <SocialShareButtons url={shareUrl} title={`He completado el curso "${data.courseName}"`} />
                           <PrintButton />
                        </div>
                    </div>
                </div>
                <div className="bg-background p-2 rounded-xl shadow-2xl border">
                    <CertificateDisplay
                        template={data.template!}
                        studentName={data.studentName!}
                        courseName={data.courseName}
                        completionDate={data.completionDate}
                        score={data.score}
                    />
                </div>
                <div className="text-center print:hidden">
                   <Button asChild variant="outline">
                       <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4"/>Volver al Panel Principal</Link>
                   </Button>
                </div>
            </div>
        </div>
    );
}
