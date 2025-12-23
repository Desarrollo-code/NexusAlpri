'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { EnrollmentReportPDF } from './enrollment-report-pdf';

interface EnrollmentPDFButtonProps {
    course: any;
    platformLogo?: string | null;
}

export const EnrollmentPDFButton = ({ course, platformLogo }: EnrollmentPDFButtonProps) => {
    return (
        <PDFDownloadLink
            document={<EnrollmentReportPDF course={course} platformLogo={platformLogo} />}
            fileName={`Reporte_Inscripciones_${course.title.replace(/\s+/g, '_')}.pdf`}
        >
            {/* @ts-ignore: Library type mismatch for render prop */}
            {({ blob, url, loading, error }: any) => (
                <Button variant="outline" size="sm" disabled={loading}>
                    <Download className="mr-2 h-4 w-4" />
                    {loading ? 'Generando PDF...' : 'Exportar PDF'}
                </Button>
            )}
        </PDFDownloadLink>
    );
};
