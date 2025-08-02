'use client';

import { updatePassword, updateUsername } from "@/actions/updatePassword";
import { useActionState } from "react";

type UpdateProfileFormProps = {
    username: string,
    email: string | undefined,
    userId: string
}

export default function UpdateProfileForm({ username, email, userId }: UpdateProfileFormProps) {
    const [passstate, passaction, passpending] = useActionState(updatePassword, undefined)
    const [userstate, useraction, userpending] = useActionState(updateUsername, undefined)


    return (
        <div className="formProperties bg-black w-11/12 md:w-1/2 mx-auto mt-8 p-6 rounded-2xl space-y-6 mb-4">
                    <div className="text-4xl font-bold text-white text-center">
                        Edit {username}&apos;s Profile
                    </div>

                    {/* Update Username and Email */}
                    <form action={useraction} className="space-y-4 mb-6">
                        <h2 className="block text-sm text-white font-bold">Display Name</h2>
                        <div className="w-full flex items-center justify-between rounded-xl border border-blue-300 placeholder-blue-400 text-white bg-transparent focus-within:border-blue-400 px-4 py-2">
                            <input type="hidden"
                                name="userId"
                                value={userId}
                                hidden
                                aria-hidden
                            />
                            <input
                                type="text"
                                name="name"
                                defaultValue={username}
                                className="bg-transparent text-white w-full focus:outline-none"
                            />
                            <p className="text-blue">
                                <i className="bi bi-pencil-square"></i>
                            </p>
                        </div>

                        <h2 className="block text-sm text-white font-bold">Email</h2>
                        <div className="w-1/2 flex items-center justify-between rounded-xl border border-blue-300 placeholder-blue-400 text-white bg-transparent focus-within:border-blue-400 px-4 py-2">
                            <input
                                type="email"
                                name="email"
                                value={email}
                                className="bg-transparent text-white w-full focus:outline-none"
                                readOnly
                                aria-readonly
                                title="Cannot change email address"
                            />
                            <p className="text-blue">
                                <i className="bi bi-pencil-square"></i>
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer"
                        >
                            Update Username
                        </button>
                        {userstate?.errors?.name && (
                            <div className="text-sm text-red-500 mt-1">
                                <p>Username must:</p>
                                <ul className="list-disc pl-5">
                                    {userstate.errors.name.map((error) => (
                                        <li key={error}>- {error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {userpending && (<p className="text-sm text-white">Processing...</p>)}
                        {userstate?.message && (<p className="text-sm text-white">{userstate.message}</p>)}
                    </form>

                    {/* Change Password */}
                    <form action={passaction} className="space-y-4">
                        <h2 className="block text-sm text-white font-bold">Password</h2>
                        <div className="w-1/2 flex items-center justify-between rounded-xl border border-blue-300 placeholder-blue-400 text-white bg-transparent focus-within:border-blue-400 px-4 py-2">
                            <input type="hidden"
                                name="userId"
                                value={userId}
                                hidden
                                aria-hidden
                            />
                            <input
                                type="password"
                                name="newPassword"
                                placeholder="••••••••"
                                className="bg-transparent text-white w-full focus:outline-none"
                            />
                            <p className="text-blue">
                                <i className="bi bi-pencil-square"></i>
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 cursor-pointer"
                        >
                            Change Password
                        </button>
                        {passstate?.errors?.newPassword && (
                            <div className="text-sm text-red-500 mt-1">
                                <p>Password must:</p>
                                <ul className="list-disc pl-5">
                                    {passstate.errors.newPassword.map((error) => (
                                        <li key={error}>- {error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {passpending && (<p className="text-sm text-white">Processing...</p>)}
                        {passstate?.message && (<p className="text-sm text-white">{passstate.message}</p>)}
                    </form>
                </div>
    )
}