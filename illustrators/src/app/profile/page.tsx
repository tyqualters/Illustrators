import { verifySession } from '@/app/lib/dal'
import {redirect} from 'next/navigation';

export default async function Profile() {
    const session = await verifySession();
    
    if (session.isAuth) {
        return (
            <p>Welcome!</p>
        );
    };
}