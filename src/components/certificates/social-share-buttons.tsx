// src/components/certificates/social-share-buttons.tsx
'use client';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Linkedin, MessageCircle, Share2, Twitter } from 'lucide-react';

interface SocialShareButtonsProps {
    url: string;
    title: string;
}

export function SocialShareButtons({ url, title }: SocialShareButtonsProps) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const linkedInShareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedTitle}`;
    const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartir
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem asChild>
                    <a href={linkedInShareUrl} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="mr-2 h-4 w-4" />
                        LinkedIn
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                     <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer">
                        <Twitter className="mr-2 h-4 w-4" />
                        Twitter / X
                    </a>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                     <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp
                    </a>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
