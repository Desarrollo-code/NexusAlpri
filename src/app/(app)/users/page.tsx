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
        <div className="w-full px-8 py-8 space-y-8 animate-in fade-in duration-700">
            <UserCreatorModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onUserCreated={() => setRefreshTrigger(prev => prev + 1)}
            />

            <div className="flex flex-col gap-1 text-left max-w-4xl">
                <p className="text-slate-600 text-lg font-semibold leading-relaxed">
                    Gestiona los accesos y roles de tu equipo de trabajo.
                </p>
                <div className="h-1 w-12 bg-indigo-600 rounded-full mt-1" />
            </div>

            <UserManagementTable key={refreshTrigger} />
        </div>
    );
}
