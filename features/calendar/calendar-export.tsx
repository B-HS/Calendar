'use client'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Separator } from '@/shared/ui/separator'
import { type FC, useState } from 'react'
import { useCalendar } from '@/shared/hooks/use-calendar'
import { CaldavProfileDialog } from './caldav-profile-dialog'

type CalendarExportProps = {
    icsUrl?: string
    caldavUrl?: string
    caldavToken?: string
    subscriptionName?: string
    className?: string
}

export const CalendarExport: FC<CalendarExportProps> = ({ icsUrl, caldavUrl, caldavToken, subscriptionName, className }) => {
    const { locale } = useCalendar()
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

    return (
        <div className={cn('space-y-4 p-3', className)}>
            <Separator />
            <div className='space-y-2'>
                <h3 className='text-xs font-semibold text-muted-foreground'>{locale.export}</h3>

                {caldavUrl && (
                    <Button variant='outline' size='sm' className='w-full text-xs' onClick={() => setIsProfileDialogOpen(true)}>
                        {locale.saveCaldavProfile}
                    </Button>
                )}

                {icsUrl && (
                    <Button variant='outline' size='sm' className='w-full text-xs' asChild>
                        <a href={icsUrl} download='calendar.ics'>
                            {locale.downloadIcsFile}
                        </a>
                    </Button>
                )}
            </div>

            {caldavUrl && caldavToken && (
                <CaldavProfileDialog
                    open={isProfileDialogOpen}
                    onOpenChange={setIsProfileDialogOpen}
                    caldavUrl={caldavUrl}
                    token={caldavToken}
                    defaultName={subscriptionName}
                />
            )}
        </div>
    )
}
