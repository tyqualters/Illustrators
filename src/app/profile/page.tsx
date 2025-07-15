import { verifySession } from '@/lib/dal'
import Link from 'next/link';
import ProfilePicture from '@/app/components/ProfilePicture';
// import { redirect } from 'next/navigation';

export default async function Profile() {
    const session = await verifySession();

    if (session.isAuth) {
        return (
            <div>
                <p>Welcome!</p>
                <ProfilePicture userId={String(session.userId)} size={128} />
                <p>Want to <Link href="/" className="text-blue-500">go home</Link> or <Link href="/logout" className="text-blue-500">sign out</Link>?</p>
            </div>
        );
    };
}