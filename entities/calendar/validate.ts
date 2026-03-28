import { z } from 'zod/v4'

export { EVENT_COLORS, type EventColor } from '@/shared/constant/color'

export const eventFormSchema = z
    .object({
        title: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        location: z.string().max(200).optional(),
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startTime: z
            .string()
            .regex(/^\d{2}:\d{2}$/)
            .optional(),
        endTime: z
            .string()
            .regex(/^\d{2}:\d{2}$/)
            .optional(),
        groupId: z.string().optional(),
        isAllDay: z.boolean(),
        status: z.enum(['confirmed', 'tentative', 'cancelled']).optional(),
        color: z.string().optional(),
    })
    .refine((data) => data.startDate <= data.endDate, {
        message: 'Start date must be before or equal to end date',
        path: ['endDate'],
    })
    .refine(
        (data) => {
            if (!data.isAllDay && data.startDate === data.endDate && data.startTime && data.endTime) {
                return data.startTime < data.endTime
            }
            return true
        },
        {
            message: 'Start time must be before end time',
            path: ['endTime'],
        },
    )

export type EventFormInput = z.infer<typeof eventFormSchema>

export const groupFormSchema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().min(1),
})

export const groupUpdateSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    color: z.string().min(1).optional(),
    sortOrder: z.number().int().optional(),
    isVisible: z.boolean().optional(),
})

export const uidSchema = z.string().min(1).max(200)
export const dateRangeSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
