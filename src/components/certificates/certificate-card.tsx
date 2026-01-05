
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, Share2, ExternalLink, Award, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";

export interface Certificate {
    id: string;
    courseName: string;
    studentName: string;
    date: string;
    score?: number;
    verificationId: string;
    imageUrl?: string;
}

interface CertificateCardProps {
    certificate: Certificate;
}

export function CertificateCard({ certificate }: CertificateCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const verificationUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/verify/${certificate.verificationId}`;

    return (
        <div
            className="relative h-[300px] w-full perspective-1000 cursor-pointer group"
            onClick={handleFlip}
        >
            <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-500"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* FRONT */}
                <div className="absolute inset-0 backface-hidden">
                    <Card className="h-full w-full overflow-hidden shadow-lg border-2 border-transparent group-hover:border-primary/50 transition-colors bg-white">
                        {/* Decorative Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 z-0" />
                        <div className="absolute inset-0 opacity-10 bg-[url('/patterns/circuit-board.svg')] z-0" />

                        {/* Content */}
                        <div className="relative z-10 flex flex-col h-full p-6 items-center justify-center text-center space-y-4">
                            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                                <Award className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-serif text-xl font-bold text-slate-800 leading-tight mb-1">
                                    {certificate.courseName}
                                </h3>
                                <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">
                                    Certificado de Finalización
                                </p>
                            </div>
                            <div className="w-16 h-1 bg-primary/20 rounded-full" />
                            <p className="text-sm font-medium text-slate-600">
                                Otorgado a <span className="text-primary font-bold">{certificate.studentName}</span>
                            </p>
                        </div>

                        {/* Bottom Strip */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-indigo-600" />
                    </Card>
                </div>

                {/* BACK */}
                <div
                    className="absolute inset-0 backface-hidden rotate-y-180"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <Card className="h-full w-full overflow-hidden shadow-xl bg-slate-900 text-white p-6 flex flex-col justify-between border-slate-700">
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-400">ID de Verificación</h4>
                                    <p className="font-mono text-xs text-primary">{certificate.verificationId}</p>
                                </div>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>

                            <div className="flex gap-4 items-center">
                                <div className="bg-white p-2 rounded-lg w-fit">
                                    <QRCodeSVG value={verificationUrl} size={64} />
                                </div>
                                <div className="text-xs text-slate-300">
                                    <p>Escanea para verificar la autenticidad de este certificado.</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-slate-400">Fecha de Emisión</h4>
                                <p className="text-sm">{certificate.date}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="secondary" className="w-full text-xs h-8">
                                <Download className="h-3 w-3 mr-2" />
                                PDF
                            </Button>
                            <Button size="sm" variant="outline" className="w-full text-xs h-8 border-slate-600 hover:bg-slate-800 text-none">
                                <Share2 className="h-3 w-3 mr-2" />
                                Compartir
                            </Button>
                        </div>
                    </Card>
                </div>
            </motion.div>
        </div>
    );
}
