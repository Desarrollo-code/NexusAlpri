
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { GitCommitHorizontal, User, CheckCircle, AlertCircle, Play, FileInput, LogIn, Send, Eye, Filter, Edit, CircleDashed } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type TestCase = {
  id: string;
  identifier: string;
  description: string;
  owner: string[];
  preConditions: string[];
  inputs: string[];
  steps: string[];
  expectedResult: string;
  obtainedResult: string;
  postCondition: string;
  status: 'Exitoso' | 'Fallido' | 'Pendiente';
  priority: 'Alta' | 'Media' | 'Baja';
};

const testCases: TestCase[] = [
  {
    id: 'tc-01',
    identifier: 'RF001',
    description: 'Consolidado de despachos',
    owner: ['Despachos', 'Administrador'],
    preConditions: ['Iniciar sesión', 'Registrar formulario de Despachos', 'Enviar el formulario', 'Visualizar Consolidado'],
    inputs: ['Costo Transporte', 'Costos Transporte Real', 'Diferencia'],
    steps: ['Iniciar Sesión', 'Visualizar Consolidado'],
    expectedResult: 'Visualización de consolidado',
    obtainedResult: 'Visualización de consolidado',
    postCondition: 'Visualización de consolidado',
    status: 'Exitoso',
    priority: 'Alta',
  },
  {
    id: 'tc-02',
    identifier: 'RF002',
    description: 'Registro Informe de despachos',
    owner: ['Despachos', 'Administrador'],
    preConditions: ['Iniciar sesión', 'Registrar formulario Despachos', 'Enviar registro'],
    inputs: ['Costo Transporte PP', 'Costo Real', 'Diferencia Transporte', 'Mensajería', 'Nombre Quien Despacha', 'Cantidad Total', 'Estado y datos específicos de despachos'],
    steps: ['Iniciar Sesión', 'Seleccionar botón Editar', 'Dar click en Enviar'],
    expectedResult: 'Visualización registros en tabla, consolidado e informes excel',
    obtainedResult: 'Visualización en todo el módulo de despachos',
    postCondition: 'Visualización en todo el módulo de despachos',
    status: 'Exitoso',
    priority: 'Alta',
  },
    {
    id: 'tc-03',
    identifier: 'RF003',
    description: 'Informes Excel',
    owner: ['Despachos', 'Administrador'],
    preConditions: ['Iniciar sesión', 'Visualizar registro en Excel'],
    inputs: ['Costo Transporte PP', 'Costo Real', 'Diferencia Transporte', 'Mensajería', 'Nombre Quien Despacha', 'Cantidad Total', 'Estado y datos específicos de despachos'],
    steps: ['Iniciar Sesión', 'Seleccionar botón \'Imagen Perfil\'', 'Dar click en cualquier Excel'],
    expectedResult: 'Visualización de Despachos en informes Excel',
    obtainedResult: 'Visualización de Despachos en informes Excel',
    postCondition: 'Visualización de Despachos en informes Excel',
    status: 'Exitoso',
    priority: 'Alta',
  },
  {
    id: 'tc-04',
    identifier: 'RF004',
    description: 'Filtrado de datos en tabla',
    owner: ['Despachos', 'Administrador'],
    preConditions: ['Iniciar sesión', 'Filtrar datos al inicio de las columnas de la tabla'],
    inputs: ['Ingresar datos específicos de la columna en el filtro'],
    steps: ['Iniciar Sesión', 'Dar click sobre el filtro al inicio de las columnas'],
    expectedResult: 'Visualización de los datos que se filtraron en la tabla',
    obtainedResult: 'Visualización de los datos que se filtraron en la tabla',
    postCondition: 'Visualización de los datos que se filtraron en la tabla',
    status: 'Exitoso',
    priority: 'Alta',
  },
  {
    id: 'tc-05',
    identifier: 'RF005',
    description: 'Editar',
    owner: ['Despachos', 'Administrador'],
    preConditions: ['Iniciar sesión', 'Editar registro', 'Actualizar registro'],
    inputs: ['Costo Transporte PP', 'Costo Real', 'Diferencia Transporte', 'Mensajería', 'Nombre Quien Despacha', 'Cantidad Total', 'Estado y datos específicos de despachos'],
    steps: ['Iniciar Sesión', 'Seleccionar botón Editar', 'Dar click en Enviar'],
    expectedResult: 'Registro Actualizado',
    obtainedResult: 'Visualización de los cambios efectuados en Despachos',
    postCondition: 'Visualización de los cambios efectuados en el PDF',
    status: 'Exitoso',
    priority: 'Media',
  },
];

const PriorityBadge = ({ priority }: { priority: TestCase['priority'] }) => {
  const variants = {
    Alta: 'destructive',
    Media: 'default',
    Baja: 'secondary',
  } as const;
  return <Badge variant={variants[priority]}>{priority}</Badge>;
};

const StatusIcon = ({ status }: { status: TestCase['status'] }) => {
  switch (status) {
    case 'Exitoso':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'Fallido':
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    default:
      return <CircleDashed className="h-5 w-5 text-muted-foreground" />;
  }
};

const DetailSection = ({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) => (
  <div className="space-y-2">
    <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">{icon}{title}</h4>
    <ul className="list-disc list-inside space-y-1 text-sm pl-2">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  </div>
);

const ResultSection = ({ title, text }: { title: string, text: string }) => (
    <div className="space-y-1">
        <h4 className="font-semibold text-sm text-muted-foreground">{title}</h4>
        <p className="text-sm p-3 bg-muted/50 rounded-md">{text}</p>
    </div>
);


export default function TraceabilityMatrixPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
          <GitCommitHorizontal className="h-8 w-8 text-primary" />
          Matriz de Trazabilidad de Requisitos
        </h1>
        <p className="text-muted-foreground mt-2">
          Un seguimiento detallado de los casos de prueba y su relación con los requisitos funcionales del sistema.
        </p>
      </div>
      <div className="space-y-4">
        {testCases.map((tc) => (
          <Card key={tc.id} className="card-border-animated overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-grow">
                <Badge variant="outline" className="font-mono mb-2">{tc.identifier}</Badge>
                <CardTitle className="text-lg">{tc.description}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {tc.owner.map(role => <Badge key={role} variant="secondary">{role}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                  <PriorityBadge priority={tc.priority} />
                  <div className="flex items-center gap-2">
                    <StatusIcon status={tc.status} />
                    <span className="font-semibold">{tc.status}</span>
                  </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="border-t">
                  <AccordionTrigger className="px-6 text-sm">Ver Detalles</AccordionTrigger>
                  <AccordionContent className="p-6 pt-2 bg-muted/30">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                      <DetailSection title="Pre-Condiciones" items={tc.preConditions} icon={<LogIn className="h-4 w-4"/>} />
                      <DetailSection title="Entradas" items={tc.inputs} icon={<FileInput className="h-4 w-4"/>} />
                      <DetailSection title="Pasos" items={tc.steps} icon={<Play className="h-4 w-4"/>} />
                      <div className="md:col-span-2 lg:col-span-3"><Separator/></div>
                      <ResultSection title="Resultado Esperado" text={tc.expectedResult} />
                      <ResultSection title="Resultado Obtenido" text={tc.obtainedResult} />
                      <ResultSection title="Post-Condición" text={tc.postCondition} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
