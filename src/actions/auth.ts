'use server';

// https://nextjs.org/docs/app/guides/authentication

import { LoginFormSchema, SignupFormSchema, FormState } from '@/lib/definitions';
import User from '@/models/User';
import connectDB from '@/lib/mongo';
import * as bcrypt from 'bcrypt';

import { createSession, deleteSession } from '@/lib/session';
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

    // supports guest login
    await createSession(newUser._id.toString(), newUser.name);
    redirect('/profile');
  } catch (err: unknown) {
    console.error('User creation failed:', err);

    if (typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === 11000) {
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

export async function login(state: FormState, formData: FormData): Promise<FormState> {
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

    // supports guest login
    await createSession(user._id.toString(), user.name);
    redirect('/profile'); // This triggers an internal redirect
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      typeof (err as Record<string, unknown>).code === 'number' &&
      (err as Record<string, unknown>).code === 11000
    )

      console.error('User authentication failed:', err);

    const message =
      typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof (err as Record<string, unknown>).message === 'string'
        ? (err as Record<string, unknown>).message
        : 'Login failed. Please check your credentials.';

    const safeMessage: string = typeof message === 'string' ? message : 'Login failed. Please check your credentials.';

    return { message: safeMessage };
  }
}


export async function logout() {
  await deleteSession();
  redirect('/login');
}
