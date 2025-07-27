

 import ProfilePicture from '@/app/components/ProfilePicture';
// import { redirect } from 'next/navigation';
import Header from '@/app/components/Header/Header.jsx'
import IllustratorsLogo from '@/app/components/IllustratorsLogo/IllustratorsLogo';
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
  //<div className="flex items-center justify-center">
               // <Image src={imageUrl} alt="Profile Picture" width={128} height={128} className="block m-2" />
              //  <h1 className="text-3xl text-white font-extrabold m-2">{username}</h1>
           // </div>

    return (
        <>
            <Header/>
            <IllustratorsLogo/>


    
    <main className="bg-container flex items-center justify-center min-h-[75vh]">

      <div className="formProperties bg-black w-9/10 md:w-1/2 mx-auto mt-8 p-6 rounded-2xl space-y-6">
        <div className="text-4xl font-bold text-white text-center">
          Edit {username}'s Profile
        </div>

      <h2 className="block text-sm font-medium text-white font-bold">Display Name</h2>
      <div className="w-1/2 mt-0 flex items=center justify-between rounded-xl border border-blue-300 placeholder-blue-400 text-white bg-transparent focus:border-blue-400 px-4 py-2">
        <p>{username}</p>
        <p className='text-blue' ><i className="bi bi-pencil-square  "></i></p> 
      </div>

      <h2 className="block text-sm font-medium text-white font-bold">Email</h2>
      <div className="w-1/2 mt-0 flex items=center justify-between rounded-xl border border-blue-300 placeholder-blue-400 text-white bg-transparent focus:border-blue-400 px-4 py-2">
        <p>{ }</p>
        <p className='text-blue' ><i className="bi bi-pencil-square  "></i></p> 
      </div>

       <h2 className="block text-sm font-medium text-white font-bold">Password</h2>
      <div className="w-1/2 mt-0 flex items=center justify-between rounded-xl border border-blue-300 placeholder-blue-400 text-white bg-transparent focus:border-blue-400 px-4 py-2">
        <p>{ }</p>
        <p className='text-blue' ><i className="bi bi-pencil-square  "></i></p> 
      </div>

      </div>

    </main>
        </>
    );
}