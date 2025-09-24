import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { sendEmail } from '@/lib/email';
import { AnnouncementEmail } from '@/components/emails/announcement-email';
import type { UserRole } from '@/types';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('pageSize');
  const filter = searchParams.get('filter'); // all, by-me, by-others, pinned, trending
  
  const isPaginated = pageParam && pageSizeParam;

  let whereClause: Prisma.AnnouncementWhereInput = {};

  // 1. Filtro base de audiencia: El usuario solo debe ver lo que le corresponde.
  if (session.role !== 'ADMINISTRATOR') {
    whereClause.OR = [
      { audience: 'ALL' },
      { audience: session.role as UserRole },
    ];
  }

  // 2. Filtro de pestañas (si aplica)
  if (filter === 'by-me') {
    whereClause.authorId = session.id;
  } else if (filter === 'by-others') {
    whereClause.authorId = { not: session.id };
  } else if (filter === 'pinned') {
    whereClause.isPinned = true;
  }
  
  // 3. Ordenamiento
  let orderBy: Prisma.AnnouncementOrderByWithRelationAndSearchRelevanceInput[] = [
    { isPinned: 'desc' },
    { date: 'desc' }
  ];
  
  try {
    const commonFindOptions: Prisma.AnnouncementFindManyArgs = {
        where: whereClause,
        orderBy: orderBy,
        include: { 
          author: { select: { id: true, name: true, avatar: true } },
          attachments: true,
          // Optimization: Fetch only what's needed for display, not the whole user object
          reads: { 
              select: { 
                  user: { 
                      select: { id: true, name: true, avatar: true }
                  } 
              } 
          },
          reactions: { 
              select: { 
                  userId: true, 
                  reaction: true, 
                  user: { select: { id: true, name: true, avatar: true }} 
              } 
          },
          // Use _count for efficient counting
          _count: { select: { reads: true, reactions: true } },
        },
    };

    let announcementsFromDb;
    let totalAnnouncements;
    
    if (isPaginated) {
        const page = parseInt(pageParam, 10);
        const pageSize = parseInt(pageSizeParam, 10);
        const skip = (page - 1) * pageSize;

        const [announcementsData, totalCount] = await prisma.$transaction([
            prisma.announcement.findMany({
                ...commonFindOptions,
                skip: skip,
                take: pageSize,
            }),
            prisma.announcement.count({ where: whereClause })
        ]);
        announcementsFromDb = announcementsData;
        totalAnnouncements = totalCount;
    } else {
        const take = Number(searchParams.get('pageSize') || 4);
        announcementsFromDb = await prisma.announcement.findMany({
            ...commonFindOptions,
            take: take,
        });
        totalAnnouncements = await prisma.announcement.count({ where: whereClause });
    }

    // Ordenar los anuncios si el filtro es "trending"
    let announcements = announcementsFromDb.map(ann => ({
        ...ann,
        reads: ann.reads.map(r => r.user),
    }));

    if (filter === 'trending') {
        announcements.sort((a, b) => b._count.reactions - a._count.reactions);
    }
    
    return NextResponse.json({ announcements, totalAnnouncements });

  } catch (error) {
    console.error('[ANNOUNCEMENTS_GET_ERROR]', error);
    return NextResponse.json({ message: 'Error al obtener los anuncios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'ADMINISTRATOR' && session.role !== 'INSTRUCTOR')) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, content, audience, attachments } = body;

    if (!title || (!content && attachments?.length === 0)) {
        return NextResponse.json({ message: 'Se requiere título, y contenido o al menos un adjunto.' }, { status: 400 });
    }
    
    const audienceToStore = Array.isArray(audience) ? audience[0] : audience;

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        content,
        audience: audienceToStore,
        authorId: session.id,
        date: new Date(),
        priority: 'Normal',
        isPinned: false,
        attachments: {
          create: attachments?.map((att: { name: string; url: string; type: string; size: number }) => ({
            name: att.name,
            url: att.url,
            type: att.type,
            size: att.size,
          })) || [],
        },
      },
      include: {
        author: { select: { name: true, id: true, avatar: true } },
        attachments: true,
        _count: { select: { reads: true, reactions: true } },
      }
    });

    const settings = await prisma.platformSettings.findFirst();
    let targetUsersQuery: Prisma.UserFindManyArgs = {};
    if (audienceToStore !== 'ALL') {
        targetUsersQuery = { where: { role: audienceToStore as UserRole } };
    }
    const allTargetUsers = await prisma.user.findMany(targetUsersQuery);
    
    const usersToNotify = allTargetUsers.filter(user => user.id !== session.id);

    if (usersToNotify.length > 0) {
      const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '');
      const plainTextContent = stripHtml(content);
      const description = plainTextContent.substring(0, 100) + (plainTextContent.length > 100 ? '...' : '');

      await prisma.notification.createMany({
        data: usersToNotify.map(user => ({
          userId: user.id,
          title: `Nuevo Anuncio: ${title}`,
          description: description,
          link: '/announcements',
          announcementId: newAnnouncement.id,
        }))
      });

      if (settings?.enableEmailNotifications) {
        const recipientEmails = usersToNotify.map(u => u.email).filter(Boolean) as string[];
        if (recipientEmails.length > 0) {
            await sendEmail({
                to: recipientEmails,
                subject: `Nuevo Anuncio en ${settings.platformName || 'NexusAlpri'}: ${title}`,
                react: AnnouncementEmail({
                    title,
                    content,
                    authorName: newAnnouncement.author?.name || 'Sistema',
                    platformName: settings.platformName || 'NexusAlpri',
                }),
            });
        }
      }
    }

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error('[ANNOUNCEMENT_POST_ERROR]', error);
    return NextResponse.json({ message: 'Error al crear el anuncio' }, { status: 500 });
  }
}
