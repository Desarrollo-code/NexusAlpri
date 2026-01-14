import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Identicon } from '@/components/ui/identicon';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserOrProcessListProps {
    type: 'user' | 'process';
    items: any[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    className?: string;
}

export function UserOrProcessList({ type, items, selectedIds, onSelectionChange, className }: UserOrProcessListProps) {
    const [search, setSearch] = useState('');
    const filteredItems = items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

    const handleSelection = (id: string, checked: boolean) => {
        onSelectionChange(checked ? [...selectedIds, id] : selectedIds.filter(i => i !== id));
    };

    return (
        <div className={cn("space-y-3", className)}>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={`Buscar ${type === 'user' ? 'usuario' : 'proceso'}...`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors"
                />
            </div>
            <div className="border rounded-xl bg-background/50 overflow-hidden">
                <ScrollArea className="h-48">
                    <div className="p-2 space-y-1">
                        {filteredItems.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No se encontraron resultados.
                            </div>
                        ) : (
                            filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "flex items-center space-x-3 p-2 rounded-lg transition-colors cursor-pointer group",
                                        selectedIds.includes(item.id) ? "bg-primary/10" : "hover:bg-muted"
                                    )}
                                    onClick={() => handleSelection(item.id, !selectedIds.includes(item.id))}
                                >
                                    <Checkbox
                                        id={`${type}-${item.id}`}
                                        checked={selectedIds.includes(item.id)}
                                        onCheckedChange={(c) => handleSelection(item.id, !!c)}
                                        className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                    <Label htmlFor={`${type}-${item.id}`} className="flex-1 flex items-center gap-3 font-normal cursor-pointer text-sm">
                                        {type === 'user' && (
                                            <Avatar className="h-8 w-8 ring-2 ring-background">
                                                <AvatarImage src={item.avatar || undefined} />
                                                <AvatarFallback><Identicon userId={item.id} /></AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className="flex flex-col">
                                            <span
                                                className="font-medium text-foreground"
                                                style={{ paddingLeft: `${type === 'process' ? (item.level || 0) * 1.5 : 0}rem` }}
                                            >
                                                {item.name}
                                            </span>
                                            {item.email && <span className="text-xs text-muted-foreground">{item.email}</span>}
                                        </div>
                                    </Label>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
            <div className="flex justify-between items-center px-1">
                <span className="text-xs text-muted-foreground">
                    {selectedIds.length} seleccionado{selectedIds.length !== 1 && 's'}
                </span>
                {selectedIds.length > 0 && (
                    <button
                        type="button"
                        onClick={() => onSelectionChange([])}
                        className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                    >
                        Limpiar selección
                    </button>
                )}
            </div>
        </div>
    );
}
