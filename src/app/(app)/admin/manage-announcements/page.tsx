import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { MOCK_ANNOUNCEMENTS } from "@/lib/constants";
import { Megaphone, PlusCircle, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AdminManageAnnouncementsPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="container mx-auto py-8 px-4 md:px-0">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center">
            <Megaphone className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-primary font-headline">Gestionar Anuncios</h1>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar anuncios..." className="pl-8 w-full md:w-64 bg-card" />
            </div>
            <Button asChild>
              <Link href="/admin/manage-announcements/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Anuncio
              </Link>
            </Button>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Listado de Anuncios</CardTitle>
            <CardDescription>Crea, edita o elimina anuncios para la plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead className="hidden md:table-cell">Autor</TableHead>
                  <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ANNOUNCEMENTS.map(announcement => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium">{announcement.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{announcement.author}</TableCell>
                    <TableCell className="hidden sm:table-cell">{format(parseISO(announcement.date), "dd MMM, yyyy", { locale: es })}</TableCell>
                    <TableCell>
                      <Badge variant={Math.random() > 0.2 ? "default" : "outline"} className={Math.random() > 0.2 ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                        {Math.random() > 0.2 ? "Publicado" : "Borrador"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Más acciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem asChild><Link href={`/admin/manage-announcements/${announcement.id}/edit`} className="cursor-pointer"><Edit className="mr-2 h-4 w-4" /> Editar</Link></DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
