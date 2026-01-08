
"use client";

import React from "react";
import { CheckCircle, AlertCircle, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function VerifyCertificatePage() {
    const params = useParams();
    const id = params?.id as string;

    // Mock validation logic
    const isValid = id && id.startsWith("CRT-");

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 text-center">
                <div className="h-12 w-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Award className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">NexusAlpri Verification</h1>
            </div>

            <Card className="w-full max-w-md p-8 shadow-xl border-t-4 border-t-primary">
                {isValid ? (
                    <div className="text-center space-y-6">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-green-700">Certificado Válido</h2>
                            <p className="text-slate-500">El certificado con ID <span className="font-mono text-slate-700 font-bold">{id}</span> es auténtico.</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg text-left space-y-3 border">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Estudiante</p>
                                <p className="font-medium text-slate-900">Jhon Doe</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Curso</p>
                                <p className="font-medium text-slate-900">TypeScript Avanzado</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">Fecha de Emisión</p>
                                <p className="font-medium text-slate-900">05 de Enero, 2025</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-6">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-10 w-10 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-red-700">Certificado Inválido</h2>
                            <p className="text-slate-500">No pudimos encontrar un certificado con el ID <span className="font-mono text-slate-700 font-bold">{id}</span>.</p>
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <Button asChild className="w-full" variant="outline">
                        <Link href="/">Volver al Inicio</Link>
                    </Button>
                </div>
            </Card>

            <p className="mt-8 text-sm text-slate-400">
                &copy; {new Date().getFullYear()} NexusAlpri.
            </p>
        </div>
    );
}
