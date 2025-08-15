// src/lib/resource-utils.tsx
import React from 'react';
import type { AppResourceType } from '@/types';
import { FolderIcon, FileQuestion, Video as VideoIcon, FileText as FileTextIcon, Info, Notebook, Shield, Link as LinkIcon } from 'lucide-react';

export const getIconForType = (type: AppResourceType['type']) => {
    const props = { className: "h-5 w-5 shrink-0" };
    switch (type) {
      case 'FOLDER': return <FolderIcon {...props} />;
      case 'DOCUMENT': return <FileTextIcon {...props} />;
      case 'GUIDE': return <Info {...props} />;
      case 'MANUAL': return <Notebook {...props} />;
      case 'POLICY': return <Shield {...props} />;
      case 'VIDEO': return <VideoIcon {...props} />;
      case 'EXTERNAL_LINK': return <LinkIcon {...props} />;
      default: return <FileQuestion {...props} />;
    }
};

export const getYoutubeVideoId = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId = null;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        videoId = urlObj.searchParams.get('v');
      } else if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.substring(1);
      }
    } catch (e) {
      const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      return match ? match[1] : null;
    }
    return videoId;
};
