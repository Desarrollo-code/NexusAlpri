import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// UPDATE user
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getCurrentUser();
    if (!session) {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const isSelfUpdate = session.id === id;

    if (!isSelfUpdate && session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

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
            theme,
            customPermissions
        } = body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!existingUser) {
            return NextResponse.json({ message: 'Usuario no encontrado' }, { status: 404 });
        }

        // Prepare data for update
        const updateData: any = {};

        // Users can always update these fields for themselves
        if (isSelfUpdate || session.role === 'ADMINISTRATOR') {
            if (name !== undefined) updateData.name = name;
            if (avatar !== undefined) updateData.avatar = avatar;
            if (theme !== undefined) updateData.theme = theme;
        }

        // Only administrators can update these fields
        if (session.role === 'ADMINISTRATOR') {
            if (email !== undefined) updateData.email = email.toLowerCase();
            if (role !== undefined) updateData.role = role;
            if (processId !== undefined) updateData.processId = processId === 'unassigned' ? null : processId;
            if (isActive !== undefined) updateData.isActive = isActive;
            if (customPermissions !== undefined) updateData.customPermissions = customPermissions;
        }

        // Hash password if provided
        if (password && password.trim() !== '') {
            // Only admins or self can change password
            if (isSelfUpdate || session.role === 'ADMINISTRATOR') {
                updateData.password = await bcrypt.hash(password, 10);
            }
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
                theme: true,
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
