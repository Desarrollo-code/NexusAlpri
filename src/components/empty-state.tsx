// src/components/empty-state.tsx
import React from 'react';
import Image from 'next/image';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: React.ReactNode;
  imageUrl?: string | null;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, imageUrl }) => {
  return (
    <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
      {imageUrl ? (
        <div className="relative w-48 h-48 mb-4">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-contain"
            data-ai-hint="empty state illustration"
          />
        </div>
      ) : (
        <Icon className="mx-auto h-12 w-12 mb-4 text-primary/70" />
      )}
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <div className="max-w-md mx-auto">{description}</div>
    </div>
  );
};