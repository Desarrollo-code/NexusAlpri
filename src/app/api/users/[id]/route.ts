import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// UPDATE user (ADMIN only)
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { id } = params;

    try {
        const body = await req.json();
        const {
            name,
            email,
            password,
            role,
            processId,
            isActive,
            avatar,
            customPermissions
        } = body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
        }

        /*
         - [x] Colorize KPI Metrics with dynamic colors & gradients
         - [x] Translate all Table/UI elements to Spanish
         - [x] Implement View Toggle (Grid / Table)
         - [x] Integrate "Estructura Organizacional" (Process Tree) Sidebar
         - [x] Implement Premium "Editar Colaborador" Modal
             - [x] Basic Info Section (Profile Image Upload, Name, Email, Role, Process)
             - [x] Categorized Granular Permissions (Dashboard, Competencia, etc.)
         - [x] Implement backend endpoints for user updates & permissions
         - [x] Verify functionality and responsiveness
        */

        // Prepare data for update
        const updateData: any = {
            name,
            email: email?.toLowerCase(),
            role,
            processId: processId === 'unassigned' ? null : processId,
            isActive,
            avatar,
            customPermissions: customPermissions || existingUser.customPermissions
        };

        // Hash password if provided
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                isActive: true,
                processId: true,
                customPermissions: true,
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('[USER_PUT_ERROR]', error);
        return NextResponse.json({ message: 'Error al actualizar el usuario' }, { status: 500 });
    }
}

// DELETE user (ADMIN only) - Moving it here from the main route if needed or keeping it separate
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    const { id } = params;

    try {
        // Soft delete: keep history but prevent access
        await prisma.user.update({
            where: { id },
            data: {
                isActive: false,
                // Optional: you could also clear processId or roles if needed, 
                // but usually keeping them is better for history.
            }
        });

        return NextResponse.json({ message: 'Usuario inactivado correctamente' });
    } catch (error) {
        console.error('[USER_DELETE_ERROR]', error);
        return NextResponse.json({ message: 'Error al inactivar el usuario' }, { status: 500 });
    }
}
