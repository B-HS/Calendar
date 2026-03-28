import type { FC, PropsWithChildren } from 'react'
import { QueryProvider } from '@/shared/lib/query-provider'

const AppLayout: FC<PropsWithChildren> = ({ children }) => {
    return <QueryProvider>{children}</QueryProvider>
}

export default AppLayout
