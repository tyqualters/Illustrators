import { z } from 'zod';
import * as mongoose from 'mongoose';
require('dotenv').config();

export const SignupFormSchema = z.object({
    name: z
        .string()
        .min(2, { message: 'Name must be at least 2 characters long.' })
        .trim(),
    email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
    password: z
        .string()
        .min(8, { message: 'Be at least 8 characters long' })
        .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
        .regex(/[0-9]/, { message: 'Contain at least one number.' })
        .regex(/[^a-zA-Z0-9]/, {
            message: 'Contain at least one special character.',
        })
        .trim(),
})

export const UserSchema = new mongoose.Schema({
    name: String,
    password: String,
    email: String
});

export const UserData = mongoose.models.User || mongoose.model('User', UserSchema);

export const MongoDBConnect = async () => {
    if (process.env?.MONGODB_SRV)
        return mongoose.connection.readyState === 1 || await mongoose.connect(process.env.MONGODB_SRV).catch(console.error);
    else throw 'No MongoDB connection string.';
};

export type FormState =
    | {
        errors?: {
            name?: string[]
            email?: string[]
            password?: string[]
        }
        message?: string
    }
    | undefined