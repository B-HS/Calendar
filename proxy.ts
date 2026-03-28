import { type NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/calendar']
const API_URL = process.env.API_URL ?? 'http://localhost:9999'

export const proxy = async (request: NextRequest) => {
    const { pathname } = request.nextUrl

    const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
    if (!isProtected) return NextResponse.next()

    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
        const res = await fetch(`${API_URL}/api/auth/get-session`, {
            headers: { Cookie: cookieHeader },
        })

        if (!res.ok) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const session = await res.json()
        if (!session?.session) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    } catch {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/calendar/:path*'],
}
