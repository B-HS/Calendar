import { redirect, fail } from '@sveltejs/kit'
import type { PageServerLoad, Actions } from './$types'
import { auth } from '$lib/auth'
import sharp from 'sharp'

export const load: PageServerLoad = async ({ request, depends }) => {
    depends('app:profile')
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session?.user) throw redirect(302, '/login')

    return {
        user: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
        },
    }
}

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const processImage = async (file: File): Promise<string | null> => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
        return null
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const resizedBuffer = await sharp(buffer)
        .resize(128, 128, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer()

    return `data:image/webp;base64,${resizedBuffer.toString('base64')}`
}

export const actions: Actions = {
    updateProfile: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) return fail(401, { message: 'Unauthorized' })

        const formData = await request.formData()
        const name = formData.get('name') as string
        const imageFile = formData.get('imageFile') as File | null
        const removeImage = formData.get('removeImage') as string

        if (!name || name.trim().length === 0) {
            return fail(400, { message: 'Name is required' })
        }

        try {
            let imageToUpdate: string | null | undefined = undefined

            if (imageFile instanceof File && imageFile.size > 0) {
                const processed = await processImage(imageFile)
                if (processed === null) {
                    return fail(400, { message: 'Unsupported image format' })
                }
                imageToUpdate = processed
            } else if (removeImage === 'true') {
                imageToUpdate = null
            }

            if (imageToUpdate !== undefined) {
                await auth.api.updateUser({
                    body: { name: name.trim(), image: imageToUpdate },
                    headers: request.headers,
                })
            } else {
                await auth.api.updateUser({
                    body: { name: name.trim() },
                    headers: request.headers,
                })
            }

            return { success: true }
        } catch (error) {
            console.error('Profile update error:', error)
            return fail(500, { message: 'Failed to update profile' })
        }
    },
}
