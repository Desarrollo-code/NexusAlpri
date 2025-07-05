import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, ShieldAlert, Activity } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
       <div className="space-y-1">
        <h1 className="text-3xl font-bold font-headline">Panel de Administrador</h1>
        <p className="text-muted-foreground">Vista general del sistema y métricas clave.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cursos Totales</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">52</div>
            <p className="text-xs text-muted-foreground">+5 desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Seguridad</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Intentos de login fallidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">Finalizaciones de lecciones hoy</p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle className="font-headline">Resumen de Actividad</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="w-full h-[300px] bg-secondary rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Gráfico de actividad aquí</p>
                </div>
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="font-headline">Anuncios Recientes</CardTitle>
                <CardDescription>Comunicaciones importantes para el equipo.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-red-500/20 text-red-400 p-2 rounded-lg">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-medium">Actualización de Política de Seguridad</p>
                            <p className="text-sm text-muted-foreground">Todo el personal debe revisar la nueva política.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
                            <Megaphone className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-medium">Mantenimiento Programado</p>
                            <p className="text-sm text-muted-foreground">La plataforma no estará disponible el sábado.</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
