

// import ProfilePicture from '@/app/components/ProfilePicture';
// import { redirect } from 'next/navigation';
import Header from '@/app/components/Header/Header.jsx'
import IllustratorsLogo from '@/app/components/IllustratorsLogo/IllustratorsLogo';
import Image from 'next/image';
import Laser from '@/app/components/Laser/Laser';
import { headers } from 'next/headers';
import UpdateProfileForm from './update';
import { getUserId, getUser } from '@/lib/dal';
async function IsUserProfile(userId: string) {
    return (await getUserId() ?? '') == userId;
}

interface ProfileProps {
    params: {
        id: string;
    };
}

export default async function Profile({ params }: ProfileProps) {
    const { id } = await params;

    let username: string = "Unknown", email: string = "Unknown", imageUrl: string = '/pfpfallback.png';

    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'http';

    const response = await fetch(`${protocol}://${host}/api/user/${id}`, { cache: 'no-store' });

    if (!response.ok) {
        console.error(`User API error: ${response.status}`);
    } else {
        const data = await response.json();
        username = data.name ?? username;
        imageUrl = (data?.gravatar) ? `${data.gravatar}?s=256` : imageUrl;
    }
    //<div className="flex items-center justify-center">
    // <Image src={imageUrl} alt="Profile Picture" width={128} height={128} className="block m-2" />
    //  <h1 className="text-3xl text-white font-extrabold m-2">{username}</h1>
    // </div>

    const isUserProfile = await IsUserProfile(id);

    if(isUserProfile) {
        const user = await getUser();
        if(user) {
            email = user.email
        }
    }

    return (
        <>

      <Laser/>
      <Header/>
      <IllustratorsLogo/>


    
    <main className="bg-container flex items-center justify-center min-h-[75vh]">

      <div className="formProperties bg-black w-9/10 md:w-1/2 mx-auto mt-8 p-6 rounded-2xl space-y-6">
        <div className="text-4xl font-bold text-white text-center">
          Edit {username}'s Profile
        </div>

            




            <main className="bg-container flex items-center justify-center min-h-[75vh]">

                {isUserProfile && <UpdateProfileForm username={username} email={email} userId={id} />}

            </main>
        </>
    );
}