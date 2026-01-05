
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch UserProgress that has completed courses
        const completedCourses = await prisma.courseProgress.findMany({
            where: {
                userId: user.id,
                progressPercentage: 100,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        instructor: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        // Transform to Certificate type
        const certificates = completedCourses.map((progress: any) => ({
            id: progress.id, // Using progress ID as certificate ID for now
            courseName: progress.course.title,
            studentName: user.name || "Estudiante",
            date: progress.completedAt ? new Date(progress.completedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
            verificationId: `CRT-${progress.courseId.substring(0, 4).toUpperCase()}-${progress.userId.substring(0, 4).toUpperCase()}`, // Mock verification ID generation
            imageUrl: undefined, // Add logic if certificate generic image exists
        }));

        return NextResponse.json(certificates);

    } catch (error) {
        console.error("[CERTIFICATES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
