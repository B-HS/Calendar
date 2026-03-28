export const FADE_UP = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
} as const

export const STAGGER = {
    animate: { transition: { staggerChildren: 0.12 } },
} as const

export const MOTION_DURATION = 0.6
