'use client'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { type FC, useEffect, useRef, useState } from 'react'
import { eventFormSchema } from '@/entities/calendar/validate'
import type { CalendarEvent } from '@/entities/calendar/types'
import { useCalendar } from '@/shared/hooks/use-calendar'
import { ColorPicker } from '@/shared/ui/color-picker'

type CalendarEventEditPopoverProps = {
    event: CalendarEvent | null
    anchor: { x: number; y: number } | null
    onClose: () => void
}

export const CalendarEventEditPopover: FC<CalendarEventEditPopoverProps> = ({ event, anchor, onClose }) => {
    if (!event || !anchor) return null
    return <CalendarEventEditPopoverInner key={event.id} event={event} anchor={anchor} onClose={onClose} />
}

const CalendarEventEditPopoverInner: FC<{ event: CalendarEvent; anchor: { x: number; y: number }; onClose: () => void }> = ({
    event,
    anchor,
    onClose,
}) => {
    const { locale, groups, updateEvent } = useCalendar()
    const ref = useRef<HTMLDivElement>(null)

    const [title, setTitle] = useState(event.title)
    const [description, setDescription] = useState(event.description ?? '')
    const [location, setLocation] = useState(event.location ?? '')
    const [startDate, setStartDate] = useState(event.startDate)
    const [endDate, setEndDate] = useState(event.endDate)
    const [groupId, setGroupId] = useState(event.groupId ?? '')
    const [color, setColor] = useState<string | undefined>(event.color)
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose()
        }
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [onClose])

    const handleSave = () => {
        const data = {
            title: title.trim(),
            description: description.trim() || undefined,
            location: location.trim() || undefined,
            startDate,
            endDate,
            groupId,
            isAllDay: event.isAllDay,
            color,
        }

        const result = eventFormSchema.safeParse(data)
        if (!result.success) {
            const fieldErrors: Record<string, string> = {}
            for (const issue of result.error.issues) {
                const path = issue.path?.[0]
                if (path) fieldErrors[String(path)] = issue.message
            }
            setErrors(fieldErrors)
            return
        }

        updateEvent(event.id, data)
        onClose()
    }

    return (
        <div
            ref={ref}
            className='fixed z-50 w-72 rounded-xs border bg-popover p-3 shadow-lg'
            style={{
                left: `${Math.min(anchor.x, window.innerWidth - 300)}px`,
                top: `${Math.min(anchor.y + 8, window.innerHeight - 400)}px`,
            }}>
            <div className='grid gap-3'>
                <div className='grid gap-1.5'>
                    <Label htmlFor='edit-title' className='text-xs'>
                        {locale.eventTitle}
                    </Label>
                    <Input
                        id='edit-title'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        className={cn(errors.title && 'border-destructive')}
                    />
                    {errors.title && <p className='text-xs text-destructive'>{errors.title}</p>}
                </div>
                <div className='grid gap-1.5'>
                    <Label htmlFor='edit-description' className='text-xs'>
                        {locale.description}
                    </Label>
                    <textarea
                        id='edit-description'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className='flex w-full rounded-xs border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                    />
                </div>
                <div className='grid gap-1.5'>
                    <Label htmlFor='edit-location' className='text-xs'>
                        {locale.location}
                    </Label>
                    <Input id='edit-location' value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
                <div className='grid grid-cols-2 gap-2'>
                    <div className='grid gap-1.5'>
                        <Label htmlFor='edit-start' className='text-xs'>
                            {locale.startDate}
                        </Label>
                        <Input id='edit-start' type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className='grid gap-1.5'>
                        <Label htmlFor='edit-end' className='text-xs'>
                            {locale.endDate}
                        </Label>
                        <Input
                            id='edit-end'
                            type='date'
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={cn(errors.endDate && 'border-destructive')}
                        />
                    </div>
                </div>
                <div className='grid gap-1.5'>
                    <Label className='text-xs'>{locale.group}</Label>
                    <div className='flex gap-1.5'>
                        {groups.map((g) => (
                            <button
                                key={g.id}
                                type='button'
                                className={cn('h-6 w-6 rounded-full', g.color, g.id === groupId && 'ring-2 ring-offset-2 ring-foreground')}
                                onClick={() => setGroupId(g.id)}
                            />
                        ))}
                    </div>
                </div>
                <div className='grid gap-1.5'>
                    <Label className='text-xs'>{locale.colorPicker}</Label>
                    <ColorPicker value={color} onChange={setColor} label={locale.colorPicker} />
                </div>
                <div className='flex justify-end gap-2'>
                    <Button variant='outline' size='sm' onClick={onClose}>
                        {locale.cancel}
                    </Button>
                    <Button size='sm' onClick={handleSave}>
                        {locale.save}
                    </Button>
                </div>
            </div>
        </div>
    )
}
