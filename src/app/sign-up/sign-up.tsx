'use client';

 
import { signup } from '@/actions/auth';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * SignupForm component
 * @returns <SignupForm />
 */
export default function SignupForm() {
    
    const [state, action, pending] = useActionState(signup, undefined)
    const router = useRouter();
       const loginPage = () => {
            router.push('/login');
            }

        const returnHome = () => {
            router.push('/');
            }

         
   
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

        <div className="bg-container flex items-center justify-center min-h-[75vh]">
            <form action={action} className="formProperties bg-black w-9/10 md:w-1/2 mx-auto mt-8 p-6 rounded-2xl space-y-6">
                <h2 className="text-4xl font-bold text-white text-center">Create Account</h2>

                <div>
                    <label htmlFor="name" className="block text-sm text-white font-bold">Name</label>
                    <input
                        id="name"
                        name="name"
                        placeholder="Name"
                        className="mt-1 block w-full rounded-xl border border-blue-300 placeholder-blue-400 text-white bg-transparent focus:border-blue-400 px-4 py-2"
                    />
                    {state?.errors?.name && <p className="text-sm text-red-500 mt-1">{state.errors.name}</p>}
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm text-white font-bold">Email</label>
                    <input
                        id="email"
                        name="email"
                        placeholder="Email"
                        className="mt-1 block w-full rounded-xl border border-blue-300 placeholder-blue-400 text-white bg-transparent focus:border-blue-400 px-4 py-2"
                    />
                    {state?.errors?.email && <p className="text-sm text-red-500 mt-1">{state.errors.email}</p>}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm text-white font-bold">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Password"
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

                <button
                    type="submit"
                    disabled={pending}
                    className="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {pending ? 'Signing Up...' : 'Sign Up'}
                </button>

                <button
          onClick={loginPage}
          className="w-full text-white px-6 py-3 font-semibold  rounded-xl bg-yellow-600 hover:bg-yellow-700 "
        >
          Login
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