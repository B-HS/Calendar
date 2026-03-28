'use client'

import { DEFAULT_END_TIME, DEFAULT_START_TIME } from '@/shared/constant/date'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { type FC, useState } from 'react'
import { eventFormSchema } from '@/entities/calendar/validate'
import type { CalendarEvent } from '@/entities/calendar/types'
import { useCalendar } from '@/shared/hooks/use-calendar'
import { ColorPicker } from '@/shared/ui/color-picker'

type CalendarEventFormProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultDate: string
    editingEvent: CalendarEvent | null
}

export const CalendarEventForm: FC<CalendarEventFormProps> = ({ open, onOpenChange, defaultDate, editingEvent }) => {
    if (!open) return null
    return (
        <CalendarEventFormInner
            key={editingEvent?.id ?? `new-${defaultDate}`}
            onOpenChange={onOpenChange}
            defaultDate={defaultDate}
            editingEvent={editingEvent}
        />
    )
}

type CalendarEventFormInnerProps = {
    onOpenChange: (open: boolean) => void
    defaultDate: string
    editingEvent: CalendarEvent | null
}

const CalendarEventFormInner: FC<CalendarEventFormInnerProps> = ({ onOpenChange, defaultDate, editingEvent }) => {
    const { locale, groups, addEvent, updateEvent } = useCalendar()

    const [title, setTitle] = useState(editingEvent?.title ?? '')
    const [description, setDescription] = useState(editingEvent?.description ?? '')
    const [location, setLocation] = useState(editingEvent?.location ?? '')
    const [startDate, setStartDate] = useState(editingEvent?.startDate ?? defaultDate)
    const [endDate, setEndDate] = useState(editingEvent?.endDate ?? defaultDate)
    const [startTime, setStartTime] = useState(editingEvent?.startTime ?? DEFAULT_START_TIME)
    const [endTime, setEndTime] = useState(editingEvent?.endTime ?? DEFAULT_END_TIME)
    const [groupId, setGroupId] = useState(editingEvent?.groupId ?? groups[0]?.id ?? '')
    const [isAllDay, setIsAllDay] = useState(editingEvent?.isAllDay ?? true)
    const [color, setColor] = useState<string | undefined>(editingEvent?.color)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleSubmit = () => {
        const data = {
            title: title.trim(),
            description: description.trim() || undefined,
            location: location.trim() || undefined,
            startDate,
            endDate,
            startTime: isAllDay ? undefined : startTime,
            endTime: isAllDay ? undefined : endTime,
            groupId: groupId || undefined,
            isAllDay,
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

        if (editingEvent) {
            updateEvent(editingEvent.id, data)
        } else {
            addEvent(data)
        }
        onOpenChange(false)
    }

    return (
        <Dialog open onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>{editingEvent ? locale.editEvent : locale.newEvent}</DialogTitle>
                </DialogHeader>
                <div className='grid gap-4 py-2'>
                    <div className='grid gap-2'>
                        <Label htmlFor='event-title'>{locale.eventTitle}</Label>
                        <Input
                            id='event-title'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={locale.newEvent}
                            autoFocus
                            className={cn(errors.title && 'border-destructive')}
                        />
                        {errors.title && <p className='text-xs text-destructive'>{errors.title}</p>}
                    </div>

                    <div className='grid gap-2'>
                        <Label htmlFor='event-description'>{locale.description}</Label>
                        <textarea
                            id='event-description'
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className='flex w-full rounded-xs border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                        />
                    </div>

                    <div className='grid gap-2'>
                        <Label htmlFor='event-location'>{locale.location}</Label>
                        <Input id='event-location' value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>

                    <label className='flex items-center gap-2 cursor-pointer'>
                        <Checkbox checked={isAllDay} onCheckedChange={(v) => setIsAllDay(v === true)} />
                        <span className='text-sm'>{locale.allDay}</span>
                    </label>

                    <div className='grid grid-cols-2 gap-4'>
                        <div className='grid gap-2'>
                            <Label htmlFor='event-start'>{locale.startDate}</Label>
                            <Input id='event-start' type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className='grid gap-2'>
                            <Label htmlFor='event-end'>{locale.endDate}</Label>
                            <Input
                                id='event-end'
                                type='date'
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={cn(errors.endDate && 'border-destructive')}
                            />
                            {errors.endDate && <p className='text-xs text-destructive'>{errors.endDate}</p>}
                        </div>
                    </div>

                    {!isAllDay && (
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='grid gap-2'>
                                <Label htmlFor='event-start-time'>{locale.startTime}</Label>
                                <Input id='event-start-time' type='time' value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                            </div>
                            <div className='grid gap-2'>
                                <Label htmlFor='event-end-time'>{locale.endTime}</Label>
                                <Input
                                    id='event-end-time'
                                    type='time'
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className={cn(errors.endTime && 'border-destructive')}
                                />
                                {errors.endTime && <p className='text-xs text-destructive'>{errors.endTime}</p>}
                            </div>
                        </div>
                    )}

                    <div className='grid gap-2'>
                        <Label htmlFor='event-group'>{locale.group}</Label>
                        <select
                            id='event-group'
                            value={groupId}
                            onChange={(e) => setGroupId(e.target.value)}
                            className='flex h-9 w-full rounded-xs border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                            {groups.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='grid gap-2'>
                        <Label>{locale.colorPicker}</Label>
                        <ColorPicker value={color} onChange={setColor} label={locale.colorPicker} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>
                        {locale.cancel}
                    </Button>
                    <Button onClick={handleSubmit}>{locale.save}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
