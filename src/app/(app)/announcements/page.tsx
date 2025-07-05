import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { announcements } from "@/lib/data";
import { cookies } from "next/headers";

const getPriorityVariant = (priority: string) => {
    switch(priority.toLowerCase()) {
        case 'urgente': return 'destructive';
        case 'importante': return 'secondary';
        default: return 'outline';
    }
}

export default function AnnouncementsPage() {
  const cookieStore = cookies();
  const role = cookieStore.get('user_role')?.value;
  const canPost = role === 'administrator' || role === 'instructor';
    
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline">Anuncios</h1>
          <p className="text-muted-foreground">Comunicados, noticias y notificaciones importantes.</p>
        </div>
        {canPost && (
            <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo Anuncio
            </Button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.map(announcement => (
          <Card key={announcement.id}>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="font-headline text-xl">{announcement.title}</CardTitle>
                    <Badge variant={getPriorityVariant(announcement.priority)}>{announcement.priority}</Badge>
                </div>
              <CardDescription>
                Publicado por {announcement.author} el {new Date(announcement.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>{announcement.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
