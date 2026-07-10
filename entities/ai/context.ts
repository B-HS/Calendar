import type { CalendarEvent, CalendarGroup, EventStatus } from '@/entities/calendar/types'
import type { AiChatMessage } from './types'
import { AI_CONTEXT_INTRO, AI_SYSTEM_PROMPT } from '@/shared/constant/ai'

const STATUS_TEXT: Record<EventStatus, string> = {
    confirmed: '확정',
    tentative: '미정',
    cancelled: '취소됨',
}

const formatEventPeriod = (event: CalendarEvent) => {
    if (event.isAllDay) {
        const range = event.startDate === event.endDate ? event.startDate : `${event.startDate} ~ ${event.endDate}`
        return `${range} (종일)`
    }
    const time = `${event.startTime ?? ''}${event.endTime ? `~${event.endTime}` : ''}`.trim()
    const dateRange = event.startDate === event.endDate ? event.startDate : `${event.startDate} ~ ${event.endDate}`
    return time ? `${dateRange} ${time}` : dateRange
}

const formatEventLine = (event: CalendarEvent, groupNameById: Map<string, string>) => {
    const groupName = event.groupId ? groupNameById.get(event.groupId) : undefined
    const parts = [
        formatEventPeriod(event),
        `"${event.title}"`,
        groupName ? `그룹: ${groupName}` : '',
        event.status ? `상태: ${STATUS_TEXT[event.status]}` : '',
        event.location ? `장소: ${event.location}` : '',
        event.description ? `설명: ${event.description}` : '',
    ].filter((part) => part !== '')
    return `- ${parts.join(' | ')}`
}

export const buildCalendarContextText = (events: CalendarEvent[], groups: CalendarGroup[], today: string) => {
    const groupNameById = new Map(groups.map((group) => [group.id, group.name]))
    const groupLines = groups.length > 0 ? groups.map((group) => `- ${group.name}`).join('\n') : '- (그룹 없음)'
    const sortedEvents = [...events].sort((a, b) => a.startDate.localeCompare(b.startDate))
    const eventLines = sortedEvents.length > 0 ? sortedEvents.map((event) => formatEventLine(event, groupNameById)).join('\n') : '- (일정 없음)'
    return [`[오늘 날짜] ${today}`, '', '[그룹]', groupLines, '', `[일정] (총 ${sortedEvents.length}개)`, eventLines].join('\n')
}

export const buildAiMessages = ({ contextText, history }: { contextText: string; history: AiChatMessage[] }): AiChatMessage[] => [
    { role: 'system', content: AI_SYSTEM_PROMPT },
    { role: 'system', content: `${AI_CONTEXT_INTRO}\n\n${contextText}` },
    ...history,
]

export const appendAssistantDelta = (messages: AiChatMessage[], delta: string): AiChatMessage[] => {
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant') return [...messages, { role: 'assistant', content: delta }]
    return [...messages.slice(0, -1), { role: 'assistant', content: last.content + delta }]
}

export const dropTrailingEmptyAssistant = (messages: AiChatMessage[]): AiChatMessage[] => {
    const last = messages[messages.length - 1]
    if (last && last.role === 'assistant' && last.content === '') return messages.slice(0, -1)
    return messages
}
