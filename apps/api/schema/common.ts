import { z } from '@hono/zod-openapi'

export const ErrorSchema = z
    .object({
        error: z.string().openapi({
            description: '오류 메시지. 발생한 오류의 원인을 설명하는 사람이 읽을 수 있는 문자열입니다.',
            example: '인증되지 않은 요청입니다',
        }),
    })
    .openapi({
        title: '오류 응답',
        description:
            'API 요청 처리 중 오류가 발생했을 때 반환되는 응답 객체입니다. 클라이언트는 이 응답을 받았을 때 error 필드의 메시지를 확인하여 적절한 오류 처리를 수행해야 합니다.',
    })

export const MessageSchema = z
    .object({
        message: z.string().openapi({
            description: '성공 메시지. 요청이 성공적으로 처리되었음을 알리는 문자열입니다.',
            example: '요청이 성공적으로 처리되었습니다',
        }),
    })
    .openapi({
        title: '성공 메시지 응답',
        description: 'API 요청이 성공적으로 처리되었을 때 반환되는 간단한 메시지 응답 객체입니다.',
    })

export type ErrorResponse = z.infer<typeof ErrorSchema>
export type MessageResponse = z.infer<typeof MessageSchema>
