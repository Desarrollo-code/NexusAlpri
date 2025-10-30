// src/components/empty-state.tsx
import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: React.ReactNode;
  imageUrl?: string | null;
  actionButton?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, imageUrl, actionButton }) => {
  return (
    <Card className="text-center py-12 md:py-16 border-2 border-dashed flex flex-col items-center justify-center">
      <CardHeader>
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
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-md mx-auto">{description}</CardDescription>
      </CardHeader>
       {actionButton && (
        <CardContent>
          {actionButton}
        </CardContent>
      )}
    </Card>
  );
};
