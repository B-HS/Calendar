import { cn } from '@/shared/lib/utils'
import { ThemeProvider } from '@/shared/ui/theme-provider'
import localFont from 'next/font/local'
import { Toaster } from 'sonner'
import './globals.css'

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
