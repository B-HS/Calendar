import type { Metadata } from 'next'
import { cn } from '@/shared/lib/utils'
import { ThemeProvider } from '@/shared/ui/theme-provider'
import localFont from 'next/font/local'
import { Toaster } from 'sonner'
import './globals.css'

const SITE_NAME = 'BCalendar'
const SITE_DESCRIPTION = 'CalDAV 기반 캘린더 애플리케이션'
const SITE_URL = 'https://calendar.gumyo.net'

export const metadata: Metadata = {
    title: {
        default: SITE_NAME,
        template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    metadataBase: new URL(SITE_URL),
    icons: {
        icon: '/favicon.ico',
    },
    openGraph: {
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        siteName: SITE_NAME,
        url: SITE_URL,
        locale: 'ko_KR',
        type: 'website',
        images: [{ url: '/favicon.ico' }],
    },
    twitter: {
        card: 'summary',
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        images: ['/favicon.ico'],
    },
    robots: {
        index: true,
        follow: true,
    },
}

const mplus1Code = localFont({
    src: '../public/fonts/mplus1-code-variable.woff2',
    display: 'swap',
    variable: '--font-sans',
})

const nanumGothic = localFont({
    src: [
        { path: '../public/fonts/nanum-gothic-regular.woff2', weight: '400' },
        { path: '../public/fonts/nanum-gothic-bold.woff2', weight: '700' },
    ],
    display: 'swap',
    variable: '--font-korean',
})

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang='ko' suppressHydrationWarning className={cn('antialiased', mplus1Code.variable, nanumGothic.variable)}>
            <body>
                <ThemeProvider>
                    {children}
                    <Toaster richColors position='bottom-right' />
                </ThemeProvider>
            </body>
        </html>
    )
}
