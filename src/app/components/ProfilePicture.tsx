'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import PrintError from '@/lib/printErr';

type ProfilePictureProps = {
    userId: string;
    alt?: string;
    size: number;
    className?: string;
};

/**
 * ProfilePicture component
 * @param param0 userId, alt text, size of image, classes
 * @returns <ProfilePicture />
 */
export default function ProfilePicture({ userId, alt = ' ', size, className }: ProfilePictureProps) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        const fetchImageUrl = async () => {
            try {
                if(userId.startsWith('guest-')) return;
                const res = await fetch(`/api/user/${userId}`);
                const data = await res.json();
                if(data.error) throw data.error;
                setSrc(`${data.gravatar}?s=${size}`);
            } catch (error: unknown) {
                PrintError(error);
                console.error('Failed to fetch image URL');
            }
        };

        fetchImageUrl();
    }, [userId, size]);

    return (
        <Image
            src={src ?? '/pfpfallback.png'}
            alt={alt}
            width={size}
            height={size}
            className={className}
        />
    );
}