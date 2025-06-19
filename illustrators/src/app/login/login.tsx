'use client';

import { login } from '@/actions/auth';
import Link from 'next/link';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { FormState } from '@/lib/definitions';

export default function LoginForm() {
  const router = useRouter();

  const [state, formAction] = useActionState(
  async (prevState: FormState, formData: FormData): Promise<FormState> => {
    const result = await login(prevState, formData);

    if (!result?.errors && !result?.message) {
      router.push('/profile');
    }

    return result;
  },
  undefined
);

  return (
    <form action={formAction} className="max-w-md mx-auto mt-8 p-6 bg-white rounded-2xl shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 text-center">Login</h2>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          required
          className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-4 py-2"
        />
        {state?.errors?.email && (
          <p className="text-sm text-red-500 mt-1">{state.errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-4 py-2"
        />
        {state?.errors?.password && (
          <div className="text-sm text-red-500 mt-1">
            <p>Password must:</p>
            <ul className="list-disc pl-5">
              {state.errors.password.map((error) => (
                <li key={error}>- {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {state?.message && (
        <p className="text-sm text-red-500 mt-2">{state.message}</p>
      )}

      <button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Login
      </button>

      <p className="text-center">
        Don't have an account?{' '}
        <Link href="/sign-up" className="text-blue-500">Register</Link>
      </p>
    </form>
  );
}