// src/components/users/user-table.tsx
'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Identicon } from '@/components/ui/identicon';
import { Button } from "../ui/button";
import { MoreVertical, Edit, UserCog, UserX, Key } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Checkbox } from "../ui/checkbox";
import type { User } from '@/types';
import { cn } from "@/lib/utils";
import { getProcessColors } from "@/lib/utils";
import { getRoleInSpanish, getRoleBadgeVariant } from "@/lib/security-log-utils";

interface UserWithProcess extends User {
    process: { id: string; name: string } | null;
}

interface UserTableProps {
    users: UserWithProcess[];
    onSelectionChange: (id: string, selected: boolean) => void;
    selectedUserIds: Set<string>;
    onEdit: (user: User) => void;
    onRoleChange: (user: User) => void;
    onStatusChange: (user: User, status: boolean) => void;
    onChatPermissions: (user: User) => void;
}

export const UserTable = ({ users, onSelectionChange, selectedUserIds, onEdit, onRoleChange, onStatusChange, onChatPermissions }: UserTableProps) => {

    const handleSelectAll = (checked: boolean) => {
        onSelectionChange('all', checked);
    };

    return (
         <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox 
                                checked={users.length > 0 && users.every(u => selectedUserIds.has(u.id))}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                            />
                        </TableHead>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Proceso</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => {
                        const processColors = user.process ? getProcessColors(user.process.id) : null;
                        return (
                        <TableRow key={user.id}>
                            <TableCell>
                                <Checkbox
                                    checked={selectedUserIds.has(user.id)}
                                    onCheckedChange={(checked) => onSelectionChange(user.id, !!checked)}
                                />
                            </TableCell>
                            <TableCell>
                                 <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.avatar || undefined} />
                                        <AvatarFallback><Identicon userId={user.id}/></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell><Badge variant={getRoleBadgeVariant(user.role)}>{getRoleInSpanish(user.role)}</Badge></TableCell>
                            <TableCell>
                                {user.process && processColors ? (
                                    <Badge 
                                        className="text-xs"
                                        style={{
                                            backgroundColor: processColors.raw.light,
                                            color: processColors.raw.dark,
                                        }}
                                    >
                                        {user.process.name}
                                    </Badge>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Sin asignar</span>
                                )}
                            </TableCell>
                            <TableCell>
                                 <Badge variant={user.isActive ? "default" : "secondary"} className={cn("text-xs py-0.5 px-1.5", user.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300")}>
                                    {user.isActive ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onSelect={() => onEdit(user)}>
                                            <Edit className="mr-2 h-4 w-4"/>Editar Perfil
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onChatPermissions(user)}>
                                            <Key className="mr-2 h-4 w-4"/>Permisos de Chat
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onRoleChange(user)}>
                                            <UserCog className="mr-2 h-4 w-4"/>Cambiar Rol
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onStatusChange(user, !user.isActive)} className={user.isActive ? "text-destructive" : ""}>
                                            <UserX className="mr-2 h-4 w-4"/>{user.isActive ? 'Inactivar' : 'Activar'}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )})}
                </TableBody>
            </Table>
        </Card>
    );
};
