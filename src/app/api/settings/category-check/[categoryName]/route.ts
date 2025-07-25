
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
    req: NextRequest, 
    context: { params: { categoryName: string } }
) {
    const session = await getCurrentUser();
    if (!session || session.role !== 'ADMINISTRATOR') {
        return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
    }

    try {
        const { categoryName: encodedCategoryName } = context.params;
        const categoryName = decodeURIComponent(encodedCategoryName);

        const courseCount = await prisma.course.count({
            where: { category: categoryName }
        });

        const resourceCount = await prisma.resource.count({
            where: { category: categoryName }
        });
        
        const totalUsage = courseCount + resourceCount;
        
        if (totalUsage > 0) {
            return NextResponse.json({
                message: `No se puede eliminar la categoría "${categoryName}" porque está siendo utilizada por ${totalUsage} curso(s) o recurso(s).`,
            }, { status: 409 }); // 409 Conflict
        }
        
        return NextResponse.json({ message: 'La categoría puede ser eliminada.' });
        
    } catch (error) {
        console.error('[CATEGORY_CHECK_ERROR]', error);
        return NextResponse.json({ message: 'Error al verificar la categoría' }, { status: 500 });
    }
}
