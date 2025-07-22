import ProfilePicture from '@/app/components/ProfilePicture';
// import { redirect } from 'next/navigation';
import Header from '@/app/components/Header/Header.jsx'
import {headers} from 'next/headers';
import Image from 'next/image';

interface ProfileProps {
    params: {
        id: string;
    };
}


export default async function Profile({ params }: ProfileProps) {
    const { id } = await params;

    let username: string = "Unknown", imageUrl = '/pfpfallback.png';

    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'http';

    const response = await fetch(`${protocol}://${host}/api/user/${id}`, { cache: 'no-store' });

    if (!response.ok) {
        console.error(`User API error: ${response.status}`);
    } else {
        const data = await response.json();
        username = data.name ?? username;
        imageUrl = (data?.gravatar) ? `${data.gravatar}?s=256`: imageUrl;
    }

    return (
        <>
            <Header />
            <div className="flex items-center justify-center">
                <Image src={imageUrl} alt="Profile Picture" width={128} height={128} className="block m-2" />
                <h1 className="text-3xl text-white font-extrabold m-2">{username}</h1>
            </div>
        </>
    );
}