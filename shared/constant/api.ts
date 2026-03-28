export const API_PATH = {
    EVENTS: {
        RANGE: '/api/calendar/events/range',
        DETAIL: (uid: string) => `/api/calendar/events/detail/${uid}`,
        CREATE: '/api/calendar/events/create',
        UPDATE: (uid: string) => `/api/calendar/events/${uid}`,
        DELETE: (uid: string) => `/api/calendar/events/${uid}`,
    },
    GROUPS: {
        LIST: '/api/calendar/groups',
        CREATE: '/api/calendar/groups',
        UPDATE: (id: string) => `/api/calendar/groups/${id}`,
        DELETE: (id: string) => `/api/calendar/groups/${id}`,
    },
    SUBSCRIPTION: {
        GET: '/api/calendar/subscription',
        CREATE: '/api/calendar/subscription',
        REGENERATE_TOKEN: '/api/calendar/subscription/regenerate',
        REGENERATE_ICS: '/api/calendar/subscription/regenerate-ics',
    },
} as const

export const ERROR_CODE = {
    SUBSCRIPTION_NOT_FOUND: 'CALENDAR_SUBSCRIPTION_NOT_FOUND',
} as const
