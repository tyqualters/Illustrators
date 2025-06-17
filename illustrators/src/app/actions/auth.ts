'use server';

// https://nextjs.org/docs/app/guides/authentication

import { LoginFormSchema, SignupFormSchema, FormState } from '@/app/lib/definitions';
import User from '@/app/models/User';                             
import connectDB from '@/app/lib/mongo';                          
const bcrypt = require('bcrypt');

import { createSession, deleteSession } from '@/app/lib/session';
import { redirect } from 'next/navigation';

export async function signup(state: FormState, formData: FormData) {
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await connectDB();                                       
    console.log('fml i hate coding sm');

    const { name, email, password } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, password: hashedPassword, email });
    await newUser.save();

    console.log('New user created.');

    await createSession(newUser._id);
    redirect('/profile');
  } catch (err: any) {
  console.error('User creation failed:', err);

  if (err.code === 11000) {
    return {
      message: 'Email is already in use.',
    };
  }

  return {
    message: 'Signup failed. Please try again.',
  };
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
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await connectDB();
    console.log('fml i hate coding sm');

    const { email, password } = validatedFields.data;
    const user = await authenticateUser(email, password);

    console.log('User logged in.');

    await createSession(user._id);
    redirect('/profile'); // This triggers an internal redirect
  } catch (err: any) {
    if (err?.digest?.startsWith?.('NEXT_REDIRECT')) {
      return undefined; // Prevents the error message from showing
    }

    console.error('User authentication failed:', err);
    return { message: err?.message ?? 'Login failed. Please check your credentials.' };
  }
}


export async function logout() {
  await deleteSession();
  redirect('/login');
}
