import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Ajustes del Sistema</h1>
        <p className="text-muted-foreground">Gestiona la configuración general de la plataforma NexusAlpri.</p>
      </div>

      <Tabs defaultValue="theme" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="theme">Tema</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="roles">Roles y Permisos</TabsTrigger>
        </TabsList>
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Personalización de Tema</CardTitle>
              <CardDescription>
                Ajusta la apariencia de la plataforma para que coincida con tu marca.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="logo">Logotipo de la Empresa</Label>
                <Input id="logo" type="file" />
              </div>
              <div className="space-y-2">
                <Label>Paleta de Colores</Label>
                <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary ring-2 ring-ring"></div>
                        <span>Primario</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-accent"></div>
                        <span>Acento</span>
                    </div>
                     <div className="flex flex-col items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-background border"></div>
                        <span>Fondo</span>
                    </div>
                </div>
              </div>
               <Button>Guardar Cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories">
           <Card>
            <CardHeader>
              <CardTitle className="font-headline">Gestión de Categorías</CardTitle>
              <CardDescription>
                Organiza tus cursos y recursos con categorías y etiquetas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content for category management */}
              <p>Funcionalidad de gestión de categorías próximamente.</p>
               <Button>Guardar Cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="roles">
           <Card>
            <CardHeader>
              <CardTitle className="font-headline">Gestión de Roles y Permisos</CardTitle>
              <CardDescription>
                Define qué puede hacer cada rol dentro de la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               {/* Content for role management */}
               <p>Funcionalidad de gestión de roles próximamente.</p>
               <Button>Guardar Cambios</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
