<script lang="ts">
    import { useDraggable } from '@dnd-kit-svelte/svelte'
    import { cn } from '$lib/utils'
    import type { CalendarEvent, EventPosition } from './types'
    import { type Locale } from './i18n'
    import { formatTime, generateEventColor } from './utils'

    interface Props {
        event: CalendarEvent
        position: EventPosition
        weekIndex: number
        locale?: Locale
        isOverlay?: boolean
        onEventClick?: (event: CalendarEvent) => void
    }

    let { event, position, weekIndex, locale = 'ko', isOverlay = false, onEventClick }: Props = $props()

    let isOverResizeHandle = $state(false)

    const { ref, isDragging } = useDraggable({
        id: () => `${event.uid}-${weekIndex}-${position.startCol}`,
        type: 'event',
        disabled: () => isOverResizeHandle,
        data: () => ({
            event,
            position,
            weekIndex,
            clickedCol: position.startCol,
            dragType: 'move',
        }),
    })

    const { ref: leftResizeRef, isDragging: isLeftResizing } = useDraggable({
        id: () => `${event.uid}-${weekIndex}-${position.startCol}-resize-start`,
        type: 'resize',
        data: () => ({
            event,
            position,
            weekIndex,
            edge: 'start',
            dragType: 'resize',
        }),
    })

    const { ref: rightResizeRef, isDragging: isRightResizing } = useDraggable({
        id: () => `${event.uid}-${weekIndex}-${position.startCol}-resize-end`,
        type: 'resize',
        data: () => ({
            event,
            position,
            weekIndex,
            edge: 'end',
            dragType: 'resize',
        }),
    })

    const colorClass = $derived(event.color || generateEventColor(event.uid))
    const isAnyDragging = $derived(isDragging.current || isLeftResizing.current || isRightResizing.current)

    const handleClick = (e: MouseEvent) => {
        if (!isAnyDragging) {
            e.stopPropagation()
            onEventClick?.(event)
        }
    }
</script>

<div
    {@attach ref}
    class={cn(
        'group absolute h-5 cursor-grab select-none truncate px-1 text-[10px] leading-5 text-white transition-opacity sm:px-1.5 sm:text-[11px]',
        colorClass,
        position.isStart && 'rounded-l-lg',
        position.isEnd && 'rounded-r-lg',
        isAnyDragging && !isOverlay && 'opacity-30',
        isOverlay && 'shadow-lg',
    )}
    style="
		top: {position.row * 24}px;
		left: calc({position.startCol} * 14.2857% + 1px);
		width: calc({position.span} * 14.2857% - 2px);
	"
    onclick={handleClick}
    onkeydown={(e) => e.key === 'Enter' && handleClick(e as unknown as MouseEvent)}
    role="button"
    tabindex="0">
    {#if position.isStart && !isOverlay}
        <div
            {@attach leftResizeRef}
            class="absolute left-0 top-0 h-full w-2 cursor-ew-resize opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-50"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            onpointerenter={() => (isOverResizeHandle = true)}
            onpointerleave={() => (isOverResizeHandle = false)}
            role="button"
            aria-label="Resize start"
            tabindex="-1">
            <div class="absolute left-0.5 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-white/80"></div>
        </div>
    {/if}

    {#if position.isStart}
        <span class="font-medium">
            {#if !event.isAllDay}
                <span class="hidden opacity-80 sm:inline">{formatTime(event.dtstart, locale)}</span>
            {/if}
            {event.summary}
        </span>
    {/if}

    {#if position.isEnd && !isOverlay}
        <div
            {@attach rightResizeRef}
            class="absolute right-0 top-0 h-full w-2 cursor-ew-resize opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-50"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.stopPropagation()}
            onpointerenter={() => (isOverResizeHandle = true)}
            onpointerleave={() => (isOverResizeHandle = false)}
            role="button"
            aria-label="Resize end"
            tabindex="-1">
            <div class="absolute right-0.5 top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-white/80"></div>
        </div>
    {/if}
</div>
