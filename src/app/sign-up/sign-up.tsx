'use client';

import { signup } from '@/actions/auth';
import { useActionState } from 'react';
import Link from 'next/link';


export default function SignupForm() {
    const [state, action, pending] = useActionState(signup, undefined)

    return (
        // <form action={action}>
        //   <div>
        //     <label htmlFor="name">Name</label>
        //     <input id="name" name="name" placeholder="Name" />
        //   </div>
        //   {state?.errors?.name && <p>{state.errors.name}</p>}

        //   <div>
        //     <label htmlFor="email">Email</label>
        //     <input id="email" name="email" placeholder="Email" />
        //   </div>
        //   {state?.errors?.email && <p>{state.errors.email}</p>}

        //   <div>
        //     <label htmlFor="password">Password</label>
        //     <input id="password" name="password" type="password" />
        //   </div>
        //   {state?.errors?.password && (
        //     <div>
        //       <p>Password must:</p>
        //       <ul>
        //         {state.errors.password.map((error) => (
        //           <li key={error}>- {error}</li>
        //         ))}
        //       </ul>
        //     </div>
        //   )}
        //   <button disabled={pending} type="submit">
        //     Sign Up
        //   </button>
        // </form>
        <form action={action} className="max-w-md mx-auto mt-8 p-6 bg-white rounded-2xl shadow-md space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">Sign Up</h2>

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    id="name"
                    name="name"
                    placeholder="Name"
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-4 py-2"
                />
                {state?.errors?.name && <p className="text-sm text-red-500 mt-1">{state.errors.name}</p>}
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    id="email"
                    name="email"
                    placeholder="Email"
                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 px-4 py-2"
                />
                {state?.errors?.email && <p className="text-sm text-red-500 mt-1">{state.errors.email}</p>}
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
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

            <button
                type="submit"
                disabled={pending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
                {pending ? 'Signing Up...' : 'Sign Up'}
            </button>
            <p>Already have an account? <Link href="/login" className="text-blue-500">Login</Link></p>
        </form>
    );
}