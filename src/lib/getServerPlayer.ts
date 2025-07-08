import { cookies } from 'next/headers';
import { decrypt } from '@/lib/session';
import { SessionPayload } from '@/lib/definitions';

export async function getServerPlayer() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (session) {
    const payload = await decrypt(session) as SessionPayload;
    return { name: payload.name, id: payload.userId };
  }

  return null;
}
