'use client';

import { login } from '@/actions/auth';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import type { FormState } from '@/lib/definitions';

/**
 * LoginForm component
 * @returns <LoginForm />
 */
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


  const createAccount = () => {
    router.push('/sign-up');
  }

   const returnHome = () => {
    router.push('/');
  }

  return (
    <div className="bg-container flex items-center justify-center min-h-[75vh]">
      <form action={formAction} className="formProperties bg-black w-9/10 md:w-1/2 mx-auto mt-8 p-6 rounded-2xl space-y-6">
        <h2 className="text-4xl font-bold text-white text-center">Login</h2>

        <div>
          <label htmlFor="email" className="block text-sm text-white font-bold">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            required
            className="mt-1 block w-full rounded-xl border border-blue-300 placeholder-blue-400 text-white bg-transparent focus:border-blue-400  px-4 py-2"
          />
          {state?.errors?.email && (
            <p className="text-sm text-red-500 mt-1">{state.errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-white font-bold">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            required
            className="mt-1 block w-full rounded-xl border border-blue-300 placeholder-blue-400 text-white bg-transparent focus:border-blue-400 px-4 py-2"
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
          className=" w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Login 
        </button>

         <button
          onClick={createAccount}
          className="w-full text-white px-6 py-3 font-semibold  rounded-xl bg-yellow-600 hover:bg-yellow-700 "
        >
          Create New Account
        </button>

        <button
          onClick={returnHome}
          className="w-full text-white px-6 py-2 font-semibold rounded-xl  bg-indigo-600 hover:bg-indigo-700 mt-1"
          >
            Return Home
          </button>
      </form>
    </div>
  );
}