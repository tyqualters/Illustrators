'use server';
import crypto from 'crypto';

/**
 * Server Action to get random UUID (required for libcrypto)
 * @returns 
 */
export default async function GetRandomUUID() {
    return crypto.randomUUID();
}