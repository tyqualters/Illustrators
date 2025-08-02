

// import ProfilePicture from '@/app/components/ProfilePicture';
// import { redirect } from 'next/navigation';
import Header from '@/app/components/Header/Header.jsx'
import Laser from '@/app/components/Laser/Laser';
import { headers } from 'next/headers';
import UpdateProfileForm from './update';
import { getUserId, getUser } from '@/lib/dal';
import ProfilePicture from '@/app/components/ProfilePicture';


async function IsUserProfile(userId: string) {
    return (await getUserId() ?? '') == userId;
}

interface ProfileProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function Profile({ params }: ProfileProps) {
    const { id } = await params;

    let username: string = "Unknown", email: string = "Unknown";

    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'http';

    if (!id.startsWith('guest-')) {
        const response = await fetch(`${protocol}://${host}/api/user/${id}`, { cache: 'no-store' });

        if (!response.ok) {
            console.error(`User API error: ${response.status}`);
        } else {
            const data = await response.json();
            username = data.name ?? username;
        }
    }

    //<div className="flex items-center justify-center">
    // <Image src={imageUrl} alt="Profile Picture" width={128} height={128} className="block m-2" />
    //  <h1 className="text-3xl text-white font-extrabold m-2">{username}</h1>
    // </div>

    const isUserProfile = await IsUserProfile(id);

    if (isUserProfile) {
        const user = await getUser();
        if (user) {
            email = user.email
        }
    }

    return (
        <>

            <Laser />
            <Header />


            <main className="flex items-center justify-center min-h-[75vh]">

                <div className=" w-11/12 md:w-full  items-center justify-center">

                    {isUserProfile ? <UpdateProfileForm username={username} email={email} userId={id} /> : (
                        <div className="flex flex-col items-center justify-center m-2">
                            <ProfilePicture userId={id} size={128} />
                            <h1 className="text-white text-4xl">{username}</h1>
                        </div>
                    )}

                </div>

            </main>
        </>
    );
}