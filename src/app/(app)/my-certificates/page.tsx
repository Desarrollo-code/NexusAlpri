
"use client";

import React, { useEffect, useState } from "react";
import { Certificate, CertificateCard } from "@/components/certificates/certificate-card";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use"; // Assuming react-use is installed or I can mock the hook hook, let's implement a simple hook locally if needed or just use window.
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

// Simple hook if react-use isn't available
function useWindowSizeInfo() {
    const [size, setSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        if (typeof window !== "undefined") {
            setSize({ width: window.innerWidth, height: window.innerHeight });
            const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
        }
    }, []);
    return size;
}

const MOCK_CERTIFICATES: Certificate[] = [
    {
        id: "1",
        courseName: "Dominando React & Next.js",
        studentName: "Jhon Doe",
        date: "15 de Octubre, 2024",
        verificationId: "CRT-REACT-2024-883",
    },
    {
        id: "2",
        courseName: "Seguridad Industrial Básica",
        studentName: "Jhon Doe",
        date: "20 de Septiembre, 2024",
        verificationId: "CRT-SEC-2024-102",
    },
    {
        id: "3",
        courseName: "Liderazgo Efectivo",
        studentName: "Jhon Doe",
        date: "10 de Agosto, 2024",
        verificationId: "CRT-LEAD-2024-554",
    },
    {
        id: "4",
        courseName: "TypeScript Avanzado",
        studentName: "Jhon Doe",
        date: "05 de Enero, 2025", // Recent date to trigger confetti
        verificationId: "CRT-TS-2025-001",
    },
];

export default function MyCertificatesPage() {
    const { width, height } = useWindowSizeInfo();
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        // Check if there is a recent certificate (simulated logic)
        // In a real app, this would come from a query param or checking the 'createdAt' date compared to last visit
        const hasRecent = MOCK_CERTIFICATES.some(c => c.date.includes("Enero, 2025"));
        if (hasRecent) {
            setShowConfetti(true);
            // Stop confetti after 5 seconds
            const timer = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <div className="container mx-auto py-8 space-y-8 relative min-h-screen">
            {showConfetti && <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />}

            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Mis Certificados
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Explora y comparte tus logros académicos.
                    </p>
                </div>

                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtrar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {MOCK_CERTIFICATES.map((cert) => (
                    <CertificateCard key={cert.id} certificate={cert} />
                ))}
            </div>
        </div>
    );
}
