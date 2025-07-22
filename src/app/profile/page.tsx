import { verifySession } from '@/lib/dal'
// import Link from 'next/link';
// import ProfilePicture from '@/app/components/ProfilePicture';
// import { redirect } from 'next/navigation';
// import Header from '@/app/components/Header/Header.jsx'
import { redirect } from 'next/navigation';

export default async function Profile() {
    const session = await verifySession();

    // verifySession will automatically redirect to /login if not signed in
    // the if-statement below isn't technically required

    if (session.isAuth) {
        // return (
        //     <div>
        //         <Header/>
        //         <p>Welcome!</p>
        //         <ProfilePicture userId={String(session.userId)} size={128} />
        //         <p>Want to <Link href="/" className="text-blue-500">go home</Link> or <Link href="/logout" className="text-blue-500">sign out</Link>?</p>
        //     </div>
        // );
        redirect(`/profile/${String(session.userId)}`);
    }
}