import connectDB from '@/lib/mongo';
import UserModel from '@/models/User'
import * as bcrypt from 'bcrypt';
import { z } from 'zod'

const UpdatePasswordSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export type UpdatePasswordState = {
  message?: string
  errors?: Record<string, string[]>
}

export async function updatePassword(
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

  try {
    await connectDB()

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const user = await UserModel.findById(userId)

    if (!user) {
      return { message: 'User not found.' }
    }

    user.password = hashedPassword
    await user.save()

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