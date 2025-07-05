'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { login } from '@/actions/auth';
import { Code, GraduationCap } from 'lucide-react';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center items-center mb-6">
          <GraduationCap className="h-10 w-10 text-primary" />
          <h1 className="ml-4 text-4xl font-headline font-bold text-primary">NexusAlpri</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Bienvenido</CardTitle>
            <CardDescription>Inicia sesión para acceder a tu panel de control.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={login} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" placeholder="tu@email.com" required defaultValue="demo@nexus.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" required defaultValue="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Iniciar sesión como</Label>
                <Select name="role" defaultValue="student">
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">Administrador</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="student">Estudiante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
                Iniciar Sesión
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2">
          <Code className="w-4 h-4"/>
          Desarrollado para la excelencia corporativa.
        </p>
      </div>
    </main>
  );
}
