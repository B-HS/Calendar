import { z } from 'zod/v4'

export type AiChatRole = 'system' | 'user' | 'assistant'
export type AiChatMessage = { role: AiChatRole; content: string }

export const aiProviderStatusSchema = z.object({
    provider: z.string(),
    connected: z.boolean(),
    keyCount: z.number().optional(),
})
export type AiProviderStatus = z.infer<typeof aiProviderStatusSchema>

const aiStatusEnvelopeSchema = z.object({
    success: z.literal(true),
    data: z.array(aiProviderStatusSchema),
})

export const parseAiProviders = (raw: unknown): AiProviderStatus[] => {
    const envelope = aiStatusEnvelopeSchema.safeParse(raw)
    if (envelope.success) return envelope.data.data
    return z.array(aiProviderStatusSchema).parse(raw)
}

export const aiChatDeltaSchema = z.object({ text: z.string() })
export const aiChatErrorSchema = z.object({ code: z.string(), message: z.string() })
export const aiErrorResponseSchema = z.object({
    success: z.literal(false),
    error: z.object({ code: z.string(), message: z.string() }),
})
