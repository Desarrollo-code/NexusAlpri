'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Layout, Layers3, Settings2, Globe, Save, Eye, Plus, GripVertical, Trash2, Sparkles, ImagePlus, ChevronRight } from 'lucide-react';

/**
 * REDISEÑO TOTAL – PRINCIPIOS
 * - Arquitectura clara (Sidebar + Workspace + Inspector)
 * - Jerarquía visual fuerte
 * - Micro-interacciones sutiles
 * - Densidad óptima (editor profesional)
 * - Accesible, rápido, elegante
 */

export default function CourseEditorRedesign() {
  const [tab, setTab] = useState<'overview'|'curriculum'|'settings'|'publish'>('overview');
  const progress = 62;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Editor de cursos</p>
              <h1 className="text-sm font-semibold leading-tight">Arquitectura Zero‑Friction</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2"><Eye className="h-4 w-4"/>Vista previa</Button>
            <Button size="sm" className="gap-2"><Save className="h-4 w-4"/>Guardar</Button>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="max-w-[1600px] mx-auto px-6 py-6 grid grid-cols-[280px_1fr_320px] gap-6">
        {/* SIDEBAR */}
        <aside className="hidden lg:block">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Estado del curso</CardTitle>
              <CardDescription>Completitud general</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress}% completo</span>
                <Badge variant="secondary">Borrador</Badge>
              </div>
            </CardContent>
            <Separator />
            <CardContent className="space-y-1">
              <SidebarItem active={tab==='overview'} onClick={()=>setTab('overview')} icon={<Layout/>} label="Resumen" />
              <SidebarItem active={tab==='curriculum'} onClick={()=>setTab('curriculum')} icon={<Layers3/>} label="Contenido" />
              <SidebarItem active={tab==='settings'} onClick={()=>setTab('settings')} icon={<Settings2/>} label="Configuración" />
              <SidebarItem active={tab==='publish'} onClick={()=>setTab('publish')} icon={<Globe/>} label="Publicación" />
            </CardContent>
          </Card>
        </aside>

        {/* WORKSPACE */}
        <main>
          <AnimatePresence mode="wait">
            {tab === 'overview' && (
              <motion.section key="overview" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-6">
                <HeroCard />
                <div className="grid md:grid-cols-2 gap-6">
                  <BasicInfoCard />
                  <CoverCard />
                </div>
              </motion.section>
            )}

            {tab === 'curriculum' && (
              <motion.section key="curriculum" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-6">
                <CurriculumBoard />
              </motion.section>
            )}

            {tab === 'settings' && (
              <motion.section key="settings" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-6">
                <SettingsPanel />
              </motion.section>
            )}

            {tab === 'publish' && (
              <motion.section key="publish" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-6">
                <PublishPanel />
              </motion.section>
            )}
          </AnimatePresence>
        </main>

        {/* INSPECTOR */}
        <aside className="hidden xl:block">
          <Card className="rounded-2xl shadow-sm sticky top-24">
            <CardHeader>
              <CardTitle className="text-sm">Inspector</CardTitle>
              <CardDescription>Contextual y dinámico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Curso obligatorio</span>
                <Switch />
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Consejos inteligentes</p>
                <div className="p-3 rounded-xl bg-primary/5 text-xs">
                  Añadir quizzes aumenta la retención un 23%.
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/* ---------------- COMPONENTES ---------------- */

function SidebarItem({active, icon, label, onClick}:{active:boolean; icon:any; label:string; onClick:()=>void}) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${active?'bg-primary/10 text-primary':'hover:bg-muted'}`}>
      <span className="h-4 w-4">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight className="h-4 w-4 opacity-40" />
    </button>
  );
}

function HeroCard() {
  return (
    <Card className="rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-indigo-600 text-white">
      <CardContent className="p-8">
        <h2 className="text-2xl font-bold mb-2">Diseña una experiencia educativa excepcional</h2>
        <p className="text-sm text-white/80 max-w-xl">Estructura módulos, lecciones y evaluaciones con precisión profesional.</p>
      </CardContent>
    </Card>
  );
}

function BasicInfoCard() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Información esencial</CardTitle>
        <CardDescription>Lo que verán los estudiantes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Título del curso" />
        <Textarea placeholder="Descripción clara y persuasiva" rows={4} />
      </CardContent>
    </Card>
  );
}

function CoverCard() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Imagen de portada</CardTitle>
        <CardDescription>Impacto visual inmediato</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center border-2 border-dashed rounded-xl h-48">
        <Button variant="outline" className="gap-2"><ImagePlus className="h-4 w-4"/>Subir imagen</Button>
      </CardContent>
    </Card>
  );
}

function CurriculumBoard() {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Arquitectura del curso</CardTitle>
          <CardDescription>Arrastra, ordena y perfecciona</CardDescription>
        </div>
        <Button size="sm" className="gap-2"><Plus className="h-4 w-4"/>Nuevo módulo</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {[1,2].map(m=> (
          <motion.div key={m} layout className="p-4 rounded-xl border bg-background flex items-center gap-3">
            <GripVertical className="h-4 w-4 opacity-40" />
            <div className="flex-1">
              <p className="text-sm font-medium">Módulo {m}</p>
              <p className="text-xs text-muted-foreground">3 lecciones · 12 min</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4"/></Button></DropdownMenuTrigger>
              <DropdownMenuContent><DropdownMenuItem>Eliminar</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}

function SettingsPanel() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Configuración avanzada</CardTitle>
        <CardDescription>Reglas, requisitos y certificación</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between"><span>Curso obligatorio</span><Switch/></div>
        <div className="flex items-center justify-between"><span>Certificado habilitado</span><Switch/></div>
      </CardContent>
    </Card>
  );
}

function PublishPanel() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Publicación</CardTitle>
        <CardDescription>Visibilidad y distribución</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full gap-2"><Sparkles className="h-4 w-4"/>Publicar curso</Button>
      </CardContent>
    </Card>
  );
}
