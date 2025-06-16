'use server';

// https://nextjs.org/docs/app/guides/authentication

import { LoginFormSchema, SignupFormSchema, FormState, UserData as User, MongoDBConnect } from '@/app/lib/definitions'
import * as mongoose from 'mongoose';
const bcrypt = require('bcrypt');

import { createSession, deleteSession } from '@/app/lib/session'
import { redirect } from 'next/navigation'
import { optional } from 'zod/v4';

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

        
        await createSession(newUser._id);
        
        redirect('/profile');

    } catch (err) {
        console.error('User creation failed:', err);
    }
}

export async function authenticateUser(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  return user; // Authentication successful
}

export async function login(state: FormState, formData: FormData) {
    // Validate form fields
    const validatedFields = LoginFormSchema.safeParse({
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

        const { email, password } = validatedFields.data;
        const hashedPassword = await bcrypt.hash(password, 10);


        let user = (await authenticateUser(email, hashedPassword)).lean();

        console.log('User logged in.');

        
        await createSession(user._id);
        
        redirect('/profile');

    } catch (err) {
        console.error('User authentication failed:', err);
    }
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}