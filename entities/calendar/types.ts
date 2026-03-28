export type EventStatus = 'confirmed' | 'tentative' | 'cancelled'

export type CalendarEvent = {
    id: string
    title: string
    description?: string
    location?: string
    startDate: string
    endDate: string
    startTime?: string
    endTime?: string
    groupId?: string
    isAllDay: boolean
    status?: EventStatus
    color?: string
}

export type CalendarGroup = {
    id: string
    name: string
    color: string
    visible: boolean
}

export type EventLayout = {
    event: CalendarEvent
    lane: number
    startCol: number
    span: number
    isStart: boolean
    isEnd: boolean
}

export type WeekRow = {
    days: Date[]
    layouts: EventLayout[]
    overflowByDay: Record<number, CalendarEvent[]>
}

export type ResizePreview = {
    event: CalendarEvent
    edge: 'start' | 'end'
    originalLane: number
    sourceWeekIndex: number
    sourceStartCol: number
    sourceSpan: number
    targetWeekIndex: number
    targetDayIndex: number
} | null

export type MovePreview = {
    event: CalendarEvent
    eventTotalDays: number
    grabOffset: number
    targetWeekIndex: number
    targetDayIndex: number
} | null

export type CalendarLocale = {
    weekdays: string[]
    monthNames: string[]
    today: string
    more: (count: number) => string
    newEvent: string
    editEvent: string
    deleteEvent: string
    deleteConfirmTitle: string
    deleteConfirmDescription: string
    cancel: string
    save: string
    delete: string
    moveToGroup: string
    eventTitle: string
    description: string
    location: string
    startDate: string
    endDate: string
    startTime: string
    endTime: string
    group: string
    allDay: string
    noEvents: string
    status: string
    confirmed: string
    tentative: string
    cancelled: string
    colorPicker: string
    newGroup: string
    editGroup: string
    deleteGroup: string
    deleteGroupConfirmTitle: string
    deleteGroupConfirmDescription: string
    groupName: string
    dataLoadError: string
    errorOccurred: string
    retry: string
    export: string
    saveCaldavProfile: string
    downloadIcsFile: string
    calendarName: string
    calendarDescriptionOptional: string
    serverAddress: string
    passwordToken: string
    caldavAccountSetup: (name: string) => string
    eventCreated: string
    eventCreationFailed: (msg: string) => string
    eventUpdateFailed: (msg: string) => string
    eventDeleted: string
    eventDeletionFailed: (msg: string) => string
    groupCreated: string
    groupCreationFailed: (msg: string) => string
    groupUpdateFailed: (msg: string) => string
    groupDeleted: string
    groupDeletionFailed: (msg: string) => string
    caldavTokenRegenerated: string
    icsTokenRegenerated: string
    tokenRegenerationFailed: (msg: string) => string
    loginDescription: string
    loginWithGithub: string
    loginWithGoogle: string
    about: string
    getStarted: string
    startFree: string
    learnMore: string
    freeToUse: string
    tryNow: string
}

export type CalendarEventResponse = {
    id: string
    uid: string
    title: string
    startDate: string
    endDate: string
    startTime: string | null
    endTime: string | null
    isAllDay: boolean
    groupId: string | null
    description?: string
    location?: string
    status?: string
    transp?: string
    priority?: number
    categories?: string[]
    color?: string
    rrule?: {
        freq: string
        interval?: number
        count?: number
        until?: string
        byDay?: string[]
        byMonth?: number[]
        byMonthDay?: number[]
    }
    sequence: number
}

export type CalendarGroupResponse = {
    id: string
    name: string
    color: string
    sortOrder: number
    isVisible: boolean
}

export type SubscriptionResponse = {
    token: string
    icsToken: string
    name: string
    caldavUrl: string
    icsUrl: string
}

export type ApiResponse<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } }

export const toCalendarEvent = (r: CalendarEventResponse): CalendarEvent => ({
    id: r.id,
    title: r.title,
    startDate: r.startDate,
    endDate: r.endDate,
    startTime: r.startTime ?? undefined,
    endTime: r.endTime ?? undefined,
    isAllDay: r.isAllDay,
    groupId: r.groupId ?? '',
    description: r.description,
    location: r.location,
    status: r.status as CalendarEvent['status'],
    color: r.color,
})

export const toCalendarGroup = (r: CalendarGroupResponse): CalendarGroup => ({
    id: r.id,
    name: r.name,
    color: r.color,
    visible: r.isVisible,
})
