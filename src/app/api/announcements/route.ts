
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { sendEmail } from '@/lib/email';
import { AnnouncementEmail } from '@/components/emails/announcement-email';
import type { UserRole } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { date: 'desc' },
      include: { author: { select: { id: true, name: true } } },
    });
    return NextResponse.json(announcements);
  } catch (error) {
    console.error('[ANNOUNCEMENTS_GET_ERROR]', error);
    return NextResponse.json({ message: 'Error al obtener los anuncios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, content, audience } = body;

    if (!title || !content || !audience) {
        return NextResponse.json({ message: 'Título, contenido y audiencia son requeridos' }, { status: 400 });
    }

    // Convert audience array to JSON string if it's an array
    const audienceForDb = Array.isArray(audience) ? JSON.stringify(audience) : audience;

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        content,
        audience: audienceForDb,
        authorId: session.id,
        date: new Date(),
      },
      include: {
        author: { select: { name: true } }
      }
    });

    const settings = await prisma.platformSettings.findFirst();
    let targetUsersQuery: any = {};
    if (audience === 'ALL') {
        // No filter, all users
    } else if (Array.isArray(audience)) {
        targetUsersQuery = { where: { role: { in: audience as UserRole[] } } };
    }
    const targetUsers = await prisma.user.findMany(targetUsersQuery);

    // Create in-app notifications
    if (targetUsers.length > 0) {
      await prisma.notification.createMany({
        data: targetUsers.map(user => ({
          userId: user.id,
          title: `Nuevo Anuncio: ${title}`,
          description: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          link: '/announcements'
        }))
      });
    }


    // --- EMAIL LOGIC ---
    if (settings?.enableEmailNotifications) {
        const recipientEmails = targetUsers.map(u => u.email).filter(Boolean);

        if (recipientEmails.length > 0) {
            await sendEmail({
                to: recipientEmails,
                subject: `Nuevo Anuncio en ${settings.platformName}: ${title}`,
                react: AnnouncementEmail({
                    title,
                    content,
                    authorName: newAnnouncement.author?.name || 'Sistema',
                    platformName: settings.platformName,
                }),
            });
        }
    }
    // --- END EMAIL LOGIC ---

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error('[ANNOUNCEMENT_POST_ERROR]', error);
    return NextResponse.json({ message: 'Error al crear el anuncio' }, { status: 500 });
  }
}
