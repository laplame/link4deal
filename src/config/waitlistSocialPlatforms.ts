import type { LucideIcon } from 'lucide-react';
import { Instagram, Youtube, Twitter, Facebook, Twitch, Video, Globe } from 'lucide-react';

export type WaitlistSocialPlatformId =
    | 'instagram'
    | 'tiktok'
    | 'youtube'
    | 'twitter'
    | 'facebook'
    | 'twitch'
    | 'other';

export interface WaitlistSocialPlatformOption {
    id: WaitlistSocialPlatformId;
    label: string;
    handlePlaceholder: string;
    handleHint: string;
    icon: LucideIcon;
}

export const WAITLIST_SOCIAL_PLATFORMS: WaitlistSocialPlatformOption[] = [
    {
        id: 'instagram',
        label: 'Instagram',
        handlePlaceholder: '@tuusuario',
        handleHint: 'Usuario o enlace de perfil',
        icon: Instagram,
    },
    {
        id: 'tiktok',
        label: 'TikTok',
        handlePlaceholder: '@tuusuario',
        handleHint: 'Usuario de TikTok',
        icon: Video,
    },
    {
        id: 'youtube',
        label: 'YouTube',
        handlePlaceholder: '@canal o nombre del canal',
        handleHint: 'Handle o URL del canal',
        icon: Youtube,
    },
    {
        id: 'twitter',
        label: 'X (Twitter)',
        handlePlaceholder: '@tuusuario',
        handleHint: 'Usuario en X',
        icon: Twitter,
    },
    {
        id: 'facebook',
        label: 'Facebook',
        handlePlaceholder: 'usuario o página',
        handleHint: 'Perfil o página de Facebook',
        icon: Facebook,
    },
    {
        id: 'twitch',
        label: 'Twitch',
        handlePlaceholder: 'tuusuario',
        handleHint: 'Nombre de canal en Twitch',
        icon: Twitch,
    },
    {
        id: 'other',
        label: 'Otra',
        handlePlaceholder: 'usuario o enlace',
        handleHint: 'Red social y usuario',
        icon: Globe,
    },
];

export function getWaitlistSocialPlatform(id: string): WaitlistSocialPlatformOption | undefined {
    return WAITLIST_SOCIAL_PLATFORMS.find((p) => p.id === id);
}
