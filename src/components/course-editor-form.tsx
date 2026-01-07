'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Save, Eye, Trash2, PlusCircle, Pencil, Layers3, BookOpen, BookOpenText, FileText, Video, FilePlus2, Sparkles, Award, CheckCircle, X, BarChart3, GripVertical, Info, Shield, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { UploadArea } from '@/components/ui/upload-area';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

import { cn } from '@/lib/utils';

// ECharts visualización estadísticas
import dynamic from 'next/dynamic';
const ECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// =============== INTERFACE MOCKS ==================
type LessonType = 'TEXT' | 'VIDEO' | 'FILE' | 'QUIZ';
type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface ContentBlock { id: string; type: LessonType; content: any; order: number }
interface AppLesson { id: string; title: string; order: number; contentBlocks: ContentBlock[] }
interface AppModule { id: string; title: string; order: number; lessons: AppLesson[] }
interface AppCourse {
  id: string; title: string; description: string; imageUrl?: string; status: CourseStatus; startDate?: string; endDate?: string; isMandatory?: boolean;
  modules: AppModule[]; category?: string; certificateTemplateId?: string; prerequisiteId?: string; modulesCount?: number;
}

// =============== COMPONENTES PRINCIPALES ==================

function generateUniqueId(prefix: string = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 8)}`;
}

const defaultCourse: AppCourse = {
  id: generateUniqueId('course'),
  title: 'Nuevo Curso',
  description: '',
  status: 'DRAFT',
  modules: [],
};

// Sidebar Navegación + Stats
function CourseSidebar({ modules, stats, activeTab, onTabChange, onModuleSelect }) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 p-4 shadow-sm">
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-2">Curso Editor</h2>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded text-center">
            <div className="text-xs text-gray-500">Módulos</div>
            <div className="font-bold">{stats.totalModules}</div>
          </div>
          <div className="p-2 bg-green-50 dark:bg-green-900 rounded text-center">
            <div className="text-xs text-gray-500">Lecciones</div>
            <div className="font-bold">{stats.totalLessons}</div>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-900 rounded text-center">
            <div className="text-xs text-gray-500">Bloques</div>
            <div className="font-bold">{stats.totalBlocks}</div>
          </div>
          <div className="p-2 bg-orange-50 dark:bg-orange-900 rounded text-center">
            <div className="text-xs text-gray-500">Estado</div>
            <div>{stats.status}</div>
          </div>
        </div>
        <ECharts
          option={{
            tooltip: { trigger: 'item' },
            series: [{
              type: 'pie',
              radius: ['40%', '70%'],
              data: [
                { value: stats.totalModules, name: 'Módulos' },
                { value: stats.totalLessons, name: 'Lecciones' },
                { value: stats.totalBlocks, name: 'Bloques' }
              ]
            }]
          }}
          style={{ height: 120, width: '100%' }}
          notMerge={true}
        />
      </div>
      <nav className="flex flex-col gap-1 mb-6">
        {[
          { key: 'basics', label: 'Información', icon: <Info className="h-4 w-4 mr-2" /> },
          { key: 'curriculum', label: 'Currículum', icon: <Layers3 className="h-4 w-4 mr-2" /> },
          { key: 'config', label: 'Config.', icon: <Settings2 className="h-4 w-4 mr-2" /> },
          { key: 'publish', label: 'Publicación', icon: <CalendarIcon className="h-4 w-4 mr-2" /> },
        ].map(tab => (
          <button
            key={tab.key}
            className={cn("flex items-center px-4 py-2 rounded text-sm font-medium transition-colors",
              activeTab === tab.key ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800')}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto">
        <h4 className="font-bold text-xs mb-2">Módulos:</h4>
        {modules.map((mod, idx) => (
          <button
            key={mod.id}
            className="flex w-full text-sm px-4 py-1 rounded hover:bg-primary/10 mb-1 truncate"
            onClick={() => onModuleSelect(idx)}>
            <Layers3 className="h-4 w-4 mr-2 text-blue-500" />
            {mod.title}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href={`/courses/preview`}><Eye className="h-4 w-4 mr-1" />Vista previa</Link>
        </Button>
      </div>
    </aside>
  );
}

// -------------------- TREEVIEW DEL CURRÍCULUM ----------------------

function CurriculumTree({ modules, onDragEnd, onEditModule, onEditLesson, onEditBlock }) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="module-droppable" type="MODULE">
        {provided => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
            {modules.map((mod, mIdx) => (
              <Draggable draggableId={mod.id} index={mIdx} key={mod.id}>
                {provMod => (
                  <div ref={provMod.innerRef} {...provMod.draggableProps}
                    className="border rounded-lg bg-white dark:bg-gray-900 shadow-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div {...provMod.dragHandleProps} className="cursor-grab"><GripVertical className="h-4 w-4" /></div>
                      <Layers3 className="h-4 w-4 text-blue-500" />
                      <Input
                        value={mod.title}
                        className="font-bold border-none bg-transparent px-1 flex-1"
                        onChange={e => onEditModule(mIdx, 'title', e.target.value)}
                      />
                      <Button size="icon" variant="ghost" onClick={() => onEditModule(mIdx, 'delete', null)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <Droppable droppableId={`lesson-droppable-${mod.id}`} type="LESSON">
                      {provLesson => (
                        <div ref={provLesson.innerRef} {...provLesson.droppableProps} className="pl-6 space-y-2">
                          {mod.lessons.map((les, lIdx) => (
                            <Draggable draggableId={les.id} index={lIdx} key={les.id}>
                              {provLes => (
                                <div ref={provLes.innerRef} {...provLes.draggableProps}
                                  className="border bg-gray-50 dark:bg-gray-800 rounded p-2">
                                  <div className="flex items-center gap-1">
                                    <div {...provLes.dragHandleProps}><GripVertical className="h-4 w-4" /></div>
                                    <BookOpenText className="h-4 w-4 text-green-600" />
                                    <Input
                                      value={les.title}
                                      className="border-none flex-1 bg-transparent px-1"
                                      onChange={e => onEditLesson(mIdx, lIdx, 'title', e.target.value)}
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => onEditLesson(mIdx, lIdx, 'delete', null)}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                  <Droppable droppableId={`block-droppable-${les.id}`} type="BLOCK">
                                    {provBlock => (
                                      <div ref={provBlock.innerRef} {...provBlock.droppableProps} className="pl-7 space-y-1">
                                        {les.contentBlocks.map((bl, bIdx) => (
                                          <Draggable draggableId={bl.id} index={bIdx} key={bl.id}>
                                            {provBl => (
                                              <div ref={provBl.innerRef} {...provBl.draggableProps}
                                                className="bg-white dark:bg-gray-900 rounded border p-1 flex items-center gap-2">
                                                <div {...provBl.dragHandleProps}><GripVertical className="h-3 w-3" /></div>
                                                <Badge className="text-xs">{bl.type}</Badge>
                                                <InlineBlockEditor
                                                  block={bl}
                                                  onChange={v => onEditBlock(mIdx, lIdx, bIdx, v)}
                                                />
                                                <Button size="icon" variant="ghost" onClick={() => onEditBlock(mIdx, lIdx, bIdx, { action: 'delete' })}>
                                                  <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                              </div>
                                            )}
                                          </Draggable>
                                        ))}
                                        {provBlock.placeholder}
                                      </div>
                                    )}
                                  </Droppable>
                                  <div className="pt-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1"
                                      onClick={() => onEditBlock(mIdx, lIdx, les.contentBlocks.length, { type: 'TEXT' })}
                                    >+ Texto</Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1 ml-1"
                                      onClick={() => onEditBlock(mIdx, lIdx, les.contentBlocks.length, { type: 'VIDEO' })}
                                    >+ Video</Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-1 ml-1"
                                      onClick={() => onEditBlock(mIdx, lIdx, les.contentBlocks.length, { type: 'FILE' })}
                                    >+ Archivo</Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provLesson.placeholder}
                          <Button variant="secondary" size="sm" className="mt-2" onClick={() => onEditLesson(mIdx, mod.lessons.length, 'add', null)}>
                            <FilePlus2 className="h-4 w-4 mr-1" />Añadir lección
                          </Button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            <Button variant="primary" className="w-full" onClick={() => onEditModule(modules.length, 'add', null)}>
              <PlusCircle className="h-4 w-4 mr-2" />Nuevo Módulo
            </Button>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

// Editor inline para bloques (texto, vídeo, archivo, quiz)
function InlineBlockEditor({ block, onChange }) {
  if (block.type === 'TEXT') {
    return (
      <Textarea
        className="text-xs border-gray-200 dark:border-gray-800 min-w-[120px]"
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        placeholder="Contenido del texto..."
      />
    );
  }
  if (block.type === 'VIDEO') {
    return (
      <Input
        className="text-xs border-gray-200 dark:border-gray-800 min-w-[120px]"
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        placeholder="URL del video..."
      />
    );
  }
  if (block.type === 'FILE') {
    return (
      <Input
        className="text-xs border-gray-200 dark:border-gray-800 min-w-[120px]"
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        placeholder="URL del archivo..."
      />
    );
  }
  if (block.type === 'QUIZ') {
    return (
      <Input
        className="text-xs border-gray-200 dark:border-gray-800 min-w-[120px]"
        value={block.content}
        onChange={e => onChange({ ...block, content: e.target.value })}
        placeholder="Titulo del quiz..."
      />
    );
  }
  return null;
}


// =============== PÁGINA PRINCIPAL (container) ==================

export default function CourseEditorPage() {
  const [course, setCourse] = useState<AppCourse>(defaultCourse);
  const [activeTab, setActiveTab] = useState('basics');
  const [dirty, setDirty] = useState(false);
  const [selectedModuleIdx, setSelectedModuleIdx] = useState(null);

  // Estadísticas del curso
  const courseStats = {
    totalModules: course.modules.length,
    totalLessons: course.modules.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0),
    totalBlocks: course.modules.reduce((acc, mod) =>
      acc + (mod.lessons?.reduce((lessonAcc, lesson) =>
        lessonAcc + (lesson.contentBlocks?.length || 0), 0) || 0), 0),
    status: course.status,
  };

  // AUTOGUARDADO
  useEffect(() => {
    if (dirty) {
      const timeout = setTimeout(() => {
        // Guardar automáticamente aquí
        // saveCourse(course);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [course, dirty]);

  // HISTORIAL DE CAMBIOS
  const history = useRef<AppCourse[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  function updateCourse(updater: (draft: AppCourse) => void) {
    setCourse(prev => {
      const draft = JSON.parse(JSON.stringify(prev));
      updater(draft);
      setDirty(true);
      history.current.push(draft);
      setCanUndo(history.current.length > 1);
      return draft;
    });
  }

  // DRAG AND DROP CURRÍCULUM
  const handleCurriculumDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;

    let upd = (draft: AppCourse) => {};

    if (type === 'MODULE') {
      upd = draft => {
        const [mod] = draft.modules.splice(source.index, 1);
        draft.modules.splice(destination.index, 0, mod);
      };
    }
    else if (type === 'LESSON') {
      upd = draft => {
        const modIdx = draft.modules.findIndex(m => `lesson-droppable-${m.id}` === source.droppableId);
        if (modIdx === -1) return;
        const [lesson] = draft.modules[modIdx].lessons.splice(source.index, 1);
        draft.modules[modIdx].lessons.splice(destination.index, 0, lesson);
      };
    }
    else if (type === 'BLOCK') {
      upd = draft => {
        for (const mod of draft.modules) {
          for (const les of mod.lessons) {
            if (`block-droppable-${les.id}` === source.droppableId) {
              const [block] = les.contentBlocks.splice(source.index, 1);
              les.contentBlocks.splice(destination.index, 0, block);
            }
          }
        }
      };
    }

    updateCourse(upd);
  };

  // EDICIÓN MÓDULO/LECCIÓN/BLOQUE
  function editModule(idx, field, value) {
    updateCourse(draft => {
      if (field === 'add') {
        draft.modules.push({
          id: generateUniqueId('module'),
          title: 'Nuevo Módulo',
          order: draft.modules.length,
          lessons: [],
        });
      } else if (field === 'delete') {
        draft.modules.splice(idx, 1);
      } else {
        draft.modules[idx][field] = value;
      }
    });
  }
  function editLesson(mIdx, lIdx, field, value) {
    updateCourse(draft => {
      if (field === 'add') {
        draft.modules[mIdx].lessons.push({
          id: generateUniqueId('lesson'),
          title: 'Nueva Lección',
          order: draft.modules[mIdx].lessons.length,
          contentBlocks: [],
        });
      } else if (field === 'delete') {
        draft.modules[mIdx].lessons.splice(lIdx, 1);
      } else {
        draft.modules[mIdx].lessons[lIdx][field] = value;
      }
    });
  }
  function editBlock(mIdx, lIdx, bIdx, value) {
    updateCourse(draft => {
      if (value.action === 'delete') {
        draft.modules[mIdx].lessons[lIdx].contentBlocks.splice(bIdx, 1);
      } else if (value.type) {
        draft.modules[mIdx].lessons[lIdx].contentBlocks.push({
          id: generateUniqueId('block'),
          type: value.type,
          content: '',
          order: draft.modules[mIdx].lessons[lIdx].contentBlocks.length,
        });
      } else {
        draft.modules[mIdx].lessons[lIdx].contentBlocks[bIdx] = value;
      }
    });
  }

  // VALIDACIONES
  const errors = [];
  if (!course.title || course.title.trim().length < 3)
    errors.push("El título del curso es obligatorio.");
  if (course.modules.some(m => !m.title || m.title.trim().length < 3))
    errors.push("Cada módulo debe tener un título.");
  if (course.modules.some(m => m.lessons.some(l => !l.title || l.title.trim().length < 3)))
    errors.push("Cada lección debe tener un título.");

  // PANELES DE CONTENIDO
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <CourseSidebar
        modules={course.modules}
        stats={courseStats}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onModuleSelect={setSelectedModuleIdx}
      />
      <main className="flex-1 p-6 max-w-4xl">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Editor de Cursos</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!dirty}>
              <Save className="h-4 w-4 mr-1" />
              Guardar cambios
            </Button>
            <Button variant="secondary" size="sm" onClick={() => {/* preview */}}>
              <Eye className="h-4 w-4 mr-1" />
              Vista previa
            </Button>
          </div>
        </header>

        <Tabs value={activeTab}>
          <TabsList>
            <TabsTrigger value="basics">Información Básica</TabsTrigger>
            <TabsTrigger value="curriculum">Plan de Estudios</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
            <TabsTrigger value="publish">Publicación</TabsTrigger>
          </TabsList>

          <TabsContent value="basics">
            <Card>
              <CardHeader>
                <CardTitle>Datos principales</CardTitle>
                <CardDescription>Lo que identificará tu curso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex flex-col w-2/3">
                    <label className="text-sm font-medium mb-2">Título *</label>
                    <Input
                      value={course.title}
                      onChange={e => updateCourse(d => { d.title = e.target.value; })}
                      className="mb-3"
                      placeholder="Ejemplo: Programación Avanzada"
                    />
                    <label className="text-sm font-medium mb-2">Descripción</label>
                    <Textarea
                      value={course.description}
                      onChange={e => updateCourse(d => { d.description = e.target.value; })}
                      placeholder="Describe el propósito y objetivos generales..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="text-sm font-medium">Imagen de portada</label>
                    <UploadArea
                      onFileSelect={file => {/* upload/cambiar imagen */}}
                      className="aspect-video w-full border border-dashed border-primary/30 mt-2 rounded"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-red-500">{errors.length ? errors[0] : null}</div>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="curriculum">
            <CurriculumTree
              modules={course.modules}
              onDragEnd={handleCurriculumDragEnd}
              onEditModule={editModule}
              onEditLesson={editLesson}
              onEditBlock={editBlock}
            />
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configuración avanzada</CardTitle>
                <CardDescription>Certificados, acceso, prerrequisitos...</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span>Curso obligatorio</span>
                      <Switch checked={course.isMandatory || false}
                        onCheckedChange={v => updateCourse(d => { d.isMandatory = v; })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm">Certificado:</label>
                    <Select
                      value={course.certificateTemplateId || ''}
                      onValueChange={v => updateCourse(d => { d.certificateTemplateId = v; })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin certificado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin certificado</SelectItem>
                        {/* Tus plantillas de certificado aquí */}
                        <SelectItem value="cert1">Certificado profesional 1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="publish">
            <Card>
              <CardHeader>
                <CardTitle>Publicación</CardTitle>
                <CardDescription>Fechas y estado de publicación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div>
                    <label className="text-sm">Estado</label>
                    <Select
                      value={course.status}
                      onValueChange={v => updateCourse(d => { d.status = v as CourseStatus; })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Borrador</SelectItem>
                        <SelectItem value="PUBLISHED">Publicado</SelectItem>
                        <SelectItem value="ARCHIVED">Archivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm">Rango de fechas</label>
                    <div className="flex gap-2">
                      <Input type="date" value={course.startDate || ''}
                        onChange={e => updateCourse(d => { d.startDate = e.target.value; })} />
                      <Input type="date" value={course.endDate || ''}
                        onChange={e => updateCourse(d => { d.endDate = e.target.value; })} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
