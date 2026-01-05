
"use client";

import React, { useState } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    ArrowUpDown,
    ChevronDown,
    MoreHorizontal,
    Search,
    UserPlus,
    Shield,
    GraduationCap,
    Briefcase,
    Mail,
    CheckCircle,
    XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// --- TYPES ---
export type User = {
    id: string;
    name: string;
    email: string;
    role: "ADMINISTRATOR" | "INSTRUCTOR" | "STUDENT";
    status: "active" | "inactive" | "pending";
    lastLogin: string;
    department?: string;
};

// --- COLUMNS DEFINITION ---
export const columns: ColumnDef<User>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Usuario
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{row.original.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-medium">{row.getValue("name")}</span>
                    <span className="text-xs text-muted-foreground">{row.original.email}</span>
                </div>
            </div>
        ),
    },
    {
        accessorKey: "role",
        header: "Rol",
        cell: ({ row }) => {
            const role = row.getValue("role") as string;
            const config = {
                "ADMINISTRATOR": { icon: Shield, label: "Admin", class: "bg-purple-100 text-purple-700 border-purple-200" },
                "INSTRUCTOR": { icon: Briefcase, label: "Instructor", class: "bg-blue-100 text-blue-700 border-blue-200" },
                "STUDENT": { icon: GraduationCap, label: "Estudiante", class: "bg-slate-100 text-slate-700 border-slate-200" }
            }[role] || { icon: GraduationCap, label: role, class: "" };

            const Icon = config.icon;

            return (
                <Badge variant="outline" className={`gap-1 ${config.class}`}>
                    <Icon className="h-3 w-3" />
                    {config.label}
                </Badge>
            );
        },
    },
    {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <div className="flex items-center gap-2">
                    {status === "active" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {status === "inactive" && <XCircle className="h-4 w-4 text-slate-400" />}
                    {status === "pending" && <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />}
                    <span className="capitalize text-sm">{status === "active" ? "Activo" : status === "inactive" ? "Inactivo" : "Pendiente"}</span>
                </div>
            )
        },
    },
    {
        accessorKey: "lastLogin",
        header: "Último Acceso",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("lastLogin")}</span>
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const user = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                            Copiar ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Ver Perfil Completo</DropdownMenuItem>
                        <DropdownMenuItem>Asignar Curso</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Desactivar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];

export function UserManagementTable() {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    const table = useReactTable({
        data: MOCK_USERS,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    return (
        <div className="space-y-4">
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="Usuarios Totales" value={MOCK_USERS.length} icon={Shield} />
                <StatCard title="Activos Ahora" value={3} icon={CheckCircle} color="text-green-500" />
                <StatCard title="Nuevos (Mes)" value={5} icon={UserPlus} color="text-blue-500" />
                <StatCard title="Pendientes" value={1} icon={Mail} color="text-amber-500" />
            </div>

            <div className="flex items-center justify-between py-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filtrar por nombre..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="pl-8"
                    />
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                Columnas <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button className="gap-2">
                        <UserPlus className="h-4 w-4" /> Nuevo Usuario
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} de{" "}
                    {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color?: string }) {
    return (
        <Card>
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                </div>
                <div className={`h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    )
}
