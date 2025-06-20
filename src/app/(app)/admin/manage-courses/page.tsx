
'use client';

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { BookOpen, PlusCircle, Search, MoreHorizontal, Edit, Trash2, Eye, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAtom, useSetAtom } from "jotai";
import { coursesAtom, coursesLoadingAtom, coursesErrorAtom, loadCoursesAtom } from "@/store/courses";
import { useEffect } from "react";

export default function AdminManageCoursesPage() {
  const [courses] = useAtom(coursesAtom);
  const [isLoading] = useAtom(coursesLoadingAtom);
  const [error] = useAtom(coursesErrorAtom);
  const dispatchLoadCourses = useSetAtom(loadCoursesAtom);

  // Optionally, trigger a re-fetch if needed, e.g., on component mount if not handled by layout
  // useEffect(() => {
  //  dispatchLoadCourses();
  // }, [dispatchLoadCourses]);

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="container mx-auto py-8 px-4 md:px-0">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-primary font-headline">Gestionar Cursos</h1>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar cursos..." className="pl-8 w-full md:w-64 bg-card" />
            </div>
            <Button asChild>
              <Link href="/admin/manage-courses/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Curso
              </Link>
            </Button>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Listado de Cursos</CardTitle>
            <CardDescription>Edita, publica o elimina cursos de la plataforma. ({isLoading ? 'Cargando...' : courses.length} cursos)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando cursos...</p>
              </div>
            )}
            {error && !isLoading && (
              <div className="flex flex-col items-center justify-center py-10 text-destructive">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p className="text-lg font-semibold">Error al cargar cursos</p>
                <p className="text-sm">{error}</p>
                <Button variant="outline" onClick={() => dispatchLoadCourses()} className="mt-4">Reintentar</Button>
              </div>
            )}
            {!isLoading && !error && courses.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título del Curso</TableHead>
                    <TableHead className="hidden md:table-cell">Categoría</TableHead>
                    <TableHead className="hidden sm:table-cell">Instructor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map(course => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Image src={course.thumbnailUrl || "https://placehold.co/60x34.png"} alt={course.title} width={60} height={34} className="rounded-sm object-cover" data-ai-hint={course.dataAiHint || "course image"}/>
                          <span className="font-medium">{course.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{course.category}</TableCell>
                      <TableCell className="hidden sm:table-cell">{course.instructor}</TableCell>
                      <TableCell>
                        <Badge variant={Math.random() > 0.5 ? "default" : "outline"} className={Math.random() > 0.5 ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                          {Math.random() > 0.5 ? "Publicado" : "Borrador"}
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
                            <DropdownMenuItem asChild><Link href={`/courses/${course.id}`} className="cursor-pointer"><Eye className="mr-2 h-4 w-4" /> Ver Contenido</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href={`/admin/manage-courses/${course.id}/edit`} className="cursor-pointer"><Edit className="mr-2 h-4 w-4" /> Editar Curso</Link></DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Eliminar Curso</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Ver Estadísticas</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!isLoading && !error && courses.length === 0 && (
              <div className="text-center py-10">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">No hay cursos creados todavía.</p>
                <Button asChild className="mt-4">
                  <Link href="/admin/manage-courses/new">
                    <PlusCircle className="mr-2 h-4 w-4" /> Crear Primer Curso
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
