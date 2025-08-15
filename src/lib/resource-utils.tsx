// src/lib/resource-utils.tsx
import React from 'react';
import type { AppResourceType } from '@/types';
import { FolderIcon, FileQuestion, Video as VideoIcon, FileText as FileTextIcon, Info, Notebook, Shield, Link as LinkIcon } from 'lucide-react';

export const getIconForType = (type: AppResourceType['type']) => {
    switch (type) {
      case 'FOLDER': return FolderIcon;
      case 'DOCUMENT': return FileTextIcon;
      case 'GUIDE': return Info;
      case 'MANUAL': return Notebook;
      case 'POLICY': return Shield;
      case 'VIDEO': return VideoIcon;
      case 'EXTERNAL_LINK': return LinkIcon;
      default: return FileQuestion;
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
