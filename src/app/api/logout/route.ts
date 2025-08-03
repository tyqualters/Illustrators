import { logout } from '@/actions/auth';
import { NextResponse } from 'next/server';

/**
 * API Endpoint for Logout
 * @returns Redirect Response
 */
export async function POST() {
  await logout();
  return NextResponse.redirect('/');
}