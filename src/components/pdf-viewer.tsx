// src/components/pdf-viewer.tsx
'use client';

import React from 'react';

interface PdfViewerProps {
    url: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url }) => {
    return (
        <div className="w-full h-full min-h-[80vh] flex flex-col bg-muted">
            <iframe
                src={url}
                title="Visor de PDF"
                className="w-full h-full border-0 flex-grow"
            />
        </div>
    );
};
