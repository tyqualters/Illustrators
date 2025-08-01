import { verifySession } from '@/lib/dal'
// import Link from 'next/link';
// import ProfilePicture from '@/app/components/ProfilePicture';
// import { redirect } from 'next/navigation';
// import Header from '@/app/components/Header/Header.jsx'
import { redirect } from 'next/navigation';

export default async function Profile() {
    const session = await verifySession();



    if (session.isAuth) {
        
        redirect(`/profile/${String(session.userId)}`);
    }
}