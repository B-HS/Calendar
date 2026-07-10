import { z } from 'zod/v4'

export type AiChatRole = 'system' | 'user' | 'assistant'
export type AiChatMessage = { role: AiChatRole; content: string }

export const aiProviderSchema = z.object({
    provider: z.enum(['codex', 'anthropic', 'ollama']),
    status: z.enum(['active', 'reauth_required', 'disabled']),
    displayName: z.string(),
})
export type AiProvider = z.infer<typeof aiProviderSchema>

export const aiModelSchema = z.object({
    modelId: z.string(),
    displayName: z.string(),
})
export type AiModel = z.infer<typeof aiModelSchema>

const successEnvelopeSchema = z.object({ success: z.literal(true), data: z.unknown() })

const unwrapSuccessEnvelope = (raw: unknown) => {
    const envelope = successEnvelopeSchema.safeParse(raw)
    return envelope.success ? envelope.data.data : raw
}

export const parseAiProviders = (raw: unknown) => z.array(aiProviderSchema).parse(unwrapSuccessEnvelope(raw))

export const parseAiModels = (raw: unknown) => z.array(aiModelSchema).parse(unwrapSuccessEnvelope(raw))

export const aiChatDeltaSchema = z.object({ text: z.string() })
export const aiChatErrorSchema = z.object({ code: z.string(), message: z.string() })
export const aiErrorResponseSchema = z.object({
    success: z.literal(false),
    error: z.object({ code: z.string(), message: z.string() }),
})
