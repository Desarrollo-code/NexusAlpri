// src/components/messages/message-input.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Paperclip, Send, XCircle, Loader2 } from 'lucide-react';
import type { Attachment } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { uploadWithProgress } from '@/lib/upload-with-progress';
import { Progress } from '../ui/progress';

interface MessageInputProps {
  onSendMessage: (content: string, attachments: Omit<Attachment, 'id'>[]) => void;
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if ((!text.trim() && attachments.length === 0) || isUploading) return;

    setIsUploading(true);
    const uploadedAttachments: Omit<Attachment, 'id'>[] = [];

    try {
        for (const file of attachments) {
            const result = await uploadWithProgress('/api/upload/chat-attachment', file, (progress) => {
                setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
            });
            uploadedAttachments.push({
                name: file.name,
                url: result.url,
                type: file.type,
                size: file.size
            });
        }
        
        onSendMessage(text, uploadedAttachments);
        setText('');
        setAttachments([]);
    } catch(err) {
        toast({ title: 'Error al subir', description: 'No se pudo subir uno o más archivos.', variant: 'destructive'});
    } finally {
        setIsUploading(false);
        setUploadProgress({});
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  
  const removeAttachment = (fileName: string) => {
      setAttachments(prev => prev.filter(f => f.name !== fileName));
  }

  return (
    <div className="space-y-3">
        {attachments.length > 0 && (
            <div className="space-y-2">
                {attachments.map(file => (
                    <div key={file.name} className="flex items-center justify-between p-2 bg-background rounded-md border">
                        <span className="text-sm truncate">{file.name}</span>
                        {isUploading && uploadProgress[file.name] !== undefined ? (
                            <Progress value={uploadProgress[file.name]} className="w-20 h-1.5" />
                        ) : (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAttachment(file.name)}><XCircle className="h-4 w-4"/></Button>
                        )}
                    </div>
                ))}
            </div>
        )}
      <div className="flex items-start gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          className="flex-grow resize-none"
          rows={1}
          disabled={isUploading}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          disabled={isUploading}
        />
         <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            <Paperclip className="h-5 w-5"/>
        </Button>
        <Button onClick={handleSendMessage} disabled={(!text.trim() && attachments.length === 0) || isUploading}>
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}