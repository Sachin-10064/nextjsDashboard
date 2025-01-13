"use server"
import { sql } from "@vercel/postgres"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"



const FormSchema = z.object({
    id: z.string(),
    customer_id: z.string({ invalid_type_error: 'Please Select a Customer' }),
    amount: z.coerce.number().gt(0, { message: 'Amount must be greater than 0' }),
    status: z.enum(['pending', 'paid'], { invalid_type_error: 'Please Select a Status' }),
    date: z.string()
})

export type State = {
    errors?: {
        customer_id?: string[];
        amount?: string[];
        status?: string[];
    },
    message?: string | null
}

const CreateInvoice = FormSchema.omit({ id: true, date: true })
export async function createInvoice(prevState: State, formData: FormData) {
    const validatedFields = CreateInvoice.safeParse({
        customer_id: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    // Prepare data for insertion into the database
    const { customer_id, amount, status } = validatedFields.data;

    const amountInCents = amount * 100
    const date = new Date().toISOString().split('T')[0]

    try {
        await sql`INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customer_id}, ${amountInCents}, ${status}, ${date})`;
    } catch {
        return { message: 'Database Error: Failed to Create Invoice.' }
    }


    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

const UpdateInvoice = FormSchema.omit({ date: true, id: true })

export async function updateInvoice(id: string, prevState: State, form: FormData) {
    const validatedFields = UpdateInvoice.safeParse({
        customer_id: form.get('customerId'),
        amount: form.get('amount'),
        status: form.get('status'),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Invoice.',
        };
    }

    const { customer_id, amount, status } = validatedFields.data;
    const amountInCents = amount * 100
    const date = new Date().toDateString().split('T')[0]

    try {
        await sql`UPDATE invoices 
    SET customer_id = ${customer_id}, amount = ${amountInCents}, status = ${status}, date= ${date}
    WHERE id = ${id}`
    } catch {
        return { message: "DateBase Error: Failed to update Invoice" }
    }
    revalidatePath('/dashboard/invoices')
    redirect('/dashboard/invoices')
}

export async function deleteInvoice(id: string): Promise<{ message: string } | undefined> {
    // throw new Error('failed DataBase')
    try {
        await sql`DELETE FROM Invoices WHERE id = ${id}`;
    } catch {
        return { message: 'DateBase Error: Failed to delete Invoice' }
    }


    revalidatePath('/dashboard/invoices')
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}