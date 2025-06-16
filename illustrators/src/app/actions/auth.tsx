'use server';

// https://nextjs.org/docs/app/guides/authentication

import { SignupFormSchema, FormState, UserData as User, MongoDBConnect } from '@/app/lib/definitions'
import * as mongoose from 'mongoose';
const bcrypt = require('bcrypt');

export async function signup(state: FormState, formData: FormData) {
    // Validate form fields
    const validatedFields = SignupFormSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    })

    // If any form fields are invalid, return early
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    // Call the provider or db to create a user...
    try {
        await MongoDBConnect();
        console.log('fml i hate coding sm');

        const { name, email, password } = validatedFields.data;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ name, password: hashedPassword, email });
        await newUser.save();

        console.log('New user created.');
    } catch (err) {
        console.error('User creation failed:', err);
    }
}