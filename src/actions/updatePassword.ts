'use server';
import connectDB from '@/lib/mongo';
import UserModel from '@/models/User'
import * as bcrypt from 'bcrypt';
import { z } from 'zod'
import {verifySession} from '@/lib/dal';
import { FormState } from '@/lib/definitions';

const UpdatePasswordSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  newPassword: z
    .string()
    .min(8, { message: 'Be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Contain at least one special character.',
    })
    .trim(),
})

export type UpdatePasswordState = {
  message?: string
  errors?: Record<string, string[]>
}

export async function updatePassword(
  state: FormState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const validated = UpdatePasswordSchema.safeParse({
    userId: formData.get('userId'),
    newPassword: formData.get('newPassword'),
  })

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const { userId, newPassword } = validated.data

  const session = await verifySession();

  if(session.userId != userId) {
    return {
        errors: {
            userId: ["Mismatched User IDs"]
        }
    }
  }

  try {
    await connectDB()

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const user = await UserModel.findById(userId)

    if (!user) {
      return { message: 'User not found.' }
    }

    user.password = hashedPassword
    await user.save()
    console.log(`Password Updated for ${user.name}`)

    return { message: 'Password updated successfully.' }
  } catch (err: unknown) {
    console.error('Password update failed:', err)

    const message =
      typeof err === 'object' &&
      err !== null &&
      'message' in err &&
      typeof (err as Record<string, unknown>).message === 'string'
        ? (err as Record<string, unknown>).message
        : 'Unexpected error occurred.'

    return { message: message as string | 'Unknown status' };
  }
}

const UpdateUsernameSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .trim(),
})

export type UpdateUsernameState = {
  message?: string
  errors?: Record<string, string[]>
}

export async function updateUsername(
  state: FormState,
  formData: FormData
): Promise<UpdateUsernameState> {
  const validated = UpdateUsernameSchema.safeParse({
    userId: formData.get('userId'),
    name: formData.get('name'),
  })

  if (!validated.success) {
    return {
      errors: validated.error.flatten().fieldErrors,
    }
  }

  const { userId, name } = validated.data

  const session = await verifySession();

  if(session.userId != userId) {
    return {
        errors: {
            userId: ["Mismatched User IDs"]
        }
    }
  }

  let oldUsername = null;

  try {
    await connectDB()

    const user = await UserModel.findById(userId)

    if (!user) {
      return { message: 'User not found.' }
    }

    oldUsername = user.name;
    user.name = name;
    await user.save()
    console.log(`Username Updated for ${oldUsername} now ${user.name}`)

    return { message: 'Username updated successfully.' }
  } catch (err: unknown) {
    console.error('Username update failed:', err)

    const message =
      typeof err === 'object' &&
      err !== null &&
      'message' in err &&
      typeof (err as Record<string, unknown>).message === 'string'
        ? (err as Record<string, unknown>).message
        : 'Unexpected error occurred.'

    return { message: message as string | 'Unknown status' };
  }
}