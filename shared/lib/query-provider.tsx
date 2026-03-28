'use client'

import { QUERY_GC_TIME, QUERY_RETRY_COUNT, QUERY_STALE_TIME } from '@/shared/constant/query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type FC, type PropsWithChildren, useState } from 'react'

export const QueryProvider: FC<PropsWithChildren> = ({ children }) => {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: QUERY_STALE_TIME,
                        gcTime: QUERY_GC_TIME,
                        retry: QUERY_RETRY_COUNT,
                    },
                },
            }),
    )

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
