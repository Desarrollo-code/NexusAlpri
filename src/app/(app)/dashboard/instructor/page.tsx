import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Activity } from "lucide-react";
import Link from 'next/link';
import { courses, studentActivity } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function InstructorDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline">Panel de Instructor</h1>
          <p className="text-muted-foreground">Gestiona tus cursos y supervisa a tus estudiantes.</p>
        </div>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nuevo Curso
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Mis Cursos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {courses.slice(0, 2).map((course) => (
              <div key={course.id}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{course.title}</span>
                  <span className="text-sm text-muted-foreground">{course.progress}%</span>
                </div>
                <Progress value={course.progress} aria-label={`${course.progress}% completado`} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Estudiantes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">150</div>
                <p className="text-xs text-muted-foreground">en todos tus cursos</p>
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Actividad Reciente de Estudiantes</CardTitle>
          <CardDescription>Últimos avances en tus cursos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead className="text-right">Progreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentActivity.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{activity.name}</TableCell>
                  <TableCell>{activity.course}</TableCell>
                  <TableCell className="text-right">{activity.progress}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
