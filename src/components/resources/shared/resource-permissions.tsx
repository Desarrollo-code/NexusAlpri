import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, Briefcase, Users, Lock, ChevronDown } from 'lucide-react';
import { UserOrProcessList } from './user-or-process-list';
import { ResourceSharingMode } from '@/types';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ResourcePermissionsProps {
    sharingMode: ResourceSharingMode;
    setSharingMode: (mode: ResourceSharingMode) => void;
    sharedWithUserIds: string[];
    setSharedWithUserIds: (ids: string[]) => void;
    sharedWithProcessIds: string[];
    setSharedWithProcessIds: (ids: string[]) => void;
    collaboratorIds: string[];
    setCollaboratorIds: (ids: string[]) => void;
    allUsers: any[];
    flattenedProcesses: any[];
    className?: string;
}

export function ResourcePermissions({
    sharingMode, setSharingMode,
    sharedWithUserIds, setSharedWithUserIds,
    sharedWithProcessIds, setSharedWithProcessIds,
    collaboratorIds, setCollaboratorIds,
    allUsers, flattenedProcesses,
    className
}: ResourcePermissionsProps) {
    return (
        <div className={cn("space-y-6", className)}>
            <div className="grid gap-6">
                <div>
                    <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Visibilidad</h3>
                    <RadioGroup
                        value={sharingMode}
                        onValueChange={(v) => setSharingMode(v as ResourceSharingMode)}
                        className="grid grid-cols-1 md:grid-cols-3 gap-3"
                    >
                        <SelectionCard
                            value="PUBLIC"
                            id="share-public"
                            icon={Globe}
                            title="Público"
                            description="Visible para todos"
                            checked={sharingMode === 'PUBLIC'}
                        />
                        <SelectionCard
                            value="PROCESS"
                            id="share-process"
                            icon={Briefcase}
                            title="Por Proceso"
                            description="Restringido a áreas"
                            checked={sharingMode === 'PROCESS'}
                        />
                        <SelectionCard
                            value="PRIVATE"
                            id="share-private"
                            icon={Lock}
                            title="Privado"
                            description="Solo usuarios específicos"
                            checked={sharingMode === 'PRIVATE'}
                        />
                    </RadioGroup>
                </div>

                <div className="bg-muted/30 rounded-xl border p-1">
                    {sharingMode === 'PROCESS' && (
                        <div className="p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-primary" />
                                Seleccionar Procesos Autorizados
                            </h4>
                            <UserOrProcessList
                                type="process"
                                items={flattenedProcesses}
                                selectedIds={sharedWithProcessIds}
                                onSelectionChange={setSharedWithProcessIds}
                            />
                        </div>
                    )}

                    {sharingMode === 'PRIVATE' && (
                        <div className="p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                Seleccionar Usuarios Autorizados
                            </h4>
                            <UserOrProcessList
                                type="user"
                                items={allUsers}
                                selectedIds={sharedWithUserIds}
                                onSelectionChange={setSharedWithUserIds}
                            />
                        </div>
                    )}

                    {sharingMode === 'PUBLIC' && (
                        <div className="p-8 text-center text-muted-foreground animate-in fade-in zoom-in-95 duration-300">
                            <Globe className="h-10 w-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Este recurso será visible para todos los usuarios registrados en la plataforma.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-dashed">
                <Collapsible>
                    <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors group">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 font-semibold">
                                    <Users className="h-4 w-4 text-indigo-500" />
                                    <span>Colaboradores Editoriales</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Otorga permisos de edición a otros instructores.</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2 animate-in slide-in-from-top-2">
                        <Card className="border-none shadow-none bg-muted/30">
                            <CardContent className="p-4">
                                <UserOrProcessList
                                    type="user"
                                    items={allUsers.filter(u => u.role !== 'STUDENT')}
                                    selectedIds={collaboratorIds}
                                    onSelectionChange={setCollaboratorIds}
                                />
                            </CardContent>
                        </Card>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    );
}

function SelectionCard({ value, id, icon: Icon, title, description, checked }: any) {
    return (
        <div className="relative">
            <RadioGroupItem value={value} id={id} className="sr-only" />
            <Label
                htmlFor={id}
                className={cn(
                    "flex flex-col items-center text-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:bg-muted/50",
                    checked
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-muted hover:border-primary/30"
                )}
            >
                <div className={cn(
                    "p-3 rounded-full mb-3 transition-colors",
                    checked ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                <span className={cn("font-semibold text-sm", checked ? "text-primary" : "text-foreground")}>{title}</span>
                <span className="text-xs text-muted-foreground mt-1">{description}</span>
            </Label>
        </div>
    );
}
