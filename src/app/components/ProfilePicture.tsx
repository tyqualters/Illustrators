'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type ProfilePictureProps = {
    userId: string;
    alt?: string;
    size: number;
    className?: string;
};

export default function ProfilePicture({ userId, alt = ' ', size, className }: ProfilePictureProps) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        const fetchImageUrl = async () => {
            try {
                const res = await fetch(`/api/user/${userId}`);
                const data = await res.json();
                if(data.error) throw data.error;
                setSrc(`${data.gravatar}?s=${size}`);
            } catch (error) {
                console.error('Failed to fetch image URL:', error);
            }
        };

        fetchImageUrl();
    }, [userId]);

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