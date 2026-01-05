"use client";

import React, { useState } from "react";
import { UserManagementTable } from "@/components/users/user-management-table";
import { useTitle } from "@/contexts/title-context";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { UserCreatorModal } from "@/components/users/user-creator-modal";

export default function UsersPage() {
    const { setPageTitle, setHeaderActions } = useTitle();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    React.useEffect(() => {
        setPageTitle("Control Central");
        setHeaderActions(
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-primary text-primary-foreground shadow-sm">
                <UserPlus className="h-4 w-4" />
                Nuevo Usuario
            </Button>
        );
        return () => setHeaderActions(null);
    }, [setPageTitle, setHeaderActions]);

    return (
        <div className="container mx-auto py-6 space-y-6">
            <UserCreatorModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onUserCreated={() => setRefreshTrigger(prev => prev + 1)}
            />

            <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-lg">
                    Gestiona usuarios, roles y accesos de la plataforma desde un solo lugar.
                </p>
            </div>

            <UserManagementTable key={refreshTrigger} />
        </div>
    );
}
