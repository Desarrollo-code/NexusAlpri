
"use client";

import React from "react";
import { UserManagementTable } from "@/components/users/user-management-table";

export default function UsersPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Control Central</h1>
                <p className="text-muted-foreground">Gestiona usuarios, roles y accesos desde un solo lugar.</p>
            </div>

            <UserManagementTable />
        </div>
    );
}
