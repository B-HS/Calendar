'use client'

import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import type { FC } from 'react'
import { useCalendar } from '@/shared/hooks/use-calendar'

type CalendarDeleteDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
}

export const CalendarDeleteDialog: FC<CalendarDeleteDialogProps> = ({ open, onOpenChange, onConfirm }) => {
    const { locale } = useCalendar()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-sm'>
                <DialogHeader>
                    <DialogTitle>{locale.deleteConfirmTitle}</DialogTitle>
                    <DialogDescription>{locale.deleteConfirmDescription}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>
                        {locale.cancel}
                    </Button>
                    <Button variant='destructive' onClick={onConfirm}>
                        {locale.delete}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
