'use server';
import crypto from 'crypto';

export default async function GetRandomUUID() {
    return crypto.randomUUID();
}