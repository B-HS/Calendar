'use client'

import {
    CALDAV_DEFAULT_NAME,
    CALDAV_DEFAULT_PORT,
    CALDAV_DEFAULT_USERNAME,
    CALDAV_IDENTIFIER_PREFIX,
    CALDAV_MIME_TYPE,
    CALDAV_ORGANIZATION,
    CALDAV_PAYLOAD_TYPE,
    CALDAV_PROFILE_PREFIX,
    CALDAV_PROFILE_TYPE,
} from '@/shared/constant/caldav'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { type FC, useState } from 'react'

import type { CalendarLocale } from '@/entities/calendar/types'
import { useCalendar } from '@/shared/hooks/use-calendar'

type CaldavProfileDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    caldavUrl: string
    token: string
    defaultName?: string
}

const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const generateMobileconfig = (config: {
    name: string
    description: string
    caldavUrl: string
    username: string
    password: string
    locale: CalendarLocale
}) => {
    const uuid = () => crypto.randomUUID()
    const name = escapeXml(config.name)
    const description = escapeXml(config.description || config.name)
    const fullDescription = escapeXml(config.description || config.locale.caldavAccountSetup(config.name))
    const username = escapeXml(config.username)
    const password = escapeXml(config.password)
    const hostname = escapeXml(new URL(config.caldavUrl).hostname)
    const port = new URL(config.caldavUrl).port || CALDAV_DEFAULT_PORT

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>CalDAVAccountDescription</key>
            <string>${description}</string>
            <key>CalDAVHostName</key>
            <string>${hostname}</string>
            <key>CalDAVPort</key>
            <integer>${port}</integer>
            <key>CalDAVPrincipalURL</key>
            <string>/</string>
            <key>CalDAVUseSSL</key>
            <${config.caldavUrl.startsWith('https') ? 'true' : 'false'}/>
            <key>CalDAVUsername</key>
            <string>${username}</string>
            <key>CalDAVPassword</key>
            <string>${password}</string>
            <key>PayloadDisplayName</key>
            <string>${name}</string>
            <key>PayloadIdentifier</key>
            <string>${CALDAV_IDENTIFIER_PREFIX}.${uuid()}</string>
            <key>PayloadType</key>
            <string>${CALDAV_PAYLOAD_TYPE}</string>
            <key>PayloadUUID</key>
            <string>${uuid()}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>${name}</string>
    <key>PayloadDescription</key>
    <string>${fullDescription}</string>
    <key>PayloadIdentifier</key>
    <string>${CALDAV_PROFILE_PREFIX}.${uuid()}</string>
    <key>PayloadOrganization</key>
    <string>${CALDAV_ORGANIZATION}</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>${CALDAV_PROFILE_TYPE}</string>
    <key>PayloadUUID</key>
    <string>${uuid()}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`

    return xml
}

const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export const CaldavProfileDialog: FC<CaldavProfileDialogProps> = ({ open, onOpenChange, caldavUrl, token, defaultName }) => {
    const { locale } = useCalendar()

    const serverAddress = (() => {
        try {
            const url = new URL(caldavUrl)
            return url.port ? `${url.hostname}:${url.port}` : url.hostname
        } catch {
            return caldavUrl
        }
    })()

    const [name, setName] = useState(defaultName ?? CALDAV_DEFAULT_NAME)
    const [description, setDescription] = useState('')

    const handleDownload = () => {
        const xml = generateMobileconfig({ name, description, caldavUrl, username: CALDAV_DEFAULT_USERNAME, password: token, locale })
        downloadFile(xml, `${name}.mobileconfig`, CALDAV_MIME_TYPE)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>{locale.saveCaldavProfile}</DialogTitle>
                </DialogHeader>
                <div className='grid gap-4 py-2'>
                    <div className='grid gap-2'>
                        <Label htmlFor='caldav-name'>{locale.calendarName}</Label>
                        <Input id='caldav-name' value={name} onChange={(e) => setName(e.target.value)} placeholder={CALDAV_DEFAULT_NAME} />
                    </div>
                    <div className='grid gap-2'>
                        <Label htmlFor='caldav-description'>{locale.description}</Label>
                        <Input
                            id='caldav-description'
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={locale.calendarDescriptionOptional}
                        />
                    </div>
                    <div className='grid gap-2'>
                        <Label className='text-muted-foreground'>{locale.serverAddress}</Label>
                        <Input value={serverAddress} readOnly className='text-muted-foreground' />
                    </div>
                    <div className='grid gap-2'>
                        <Label className='text-muted-foreground'>{locale.passwordToken}</Label>
                        <Input value={token} readOnly className='text-muted-foreground font-mono text-xs' />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>
                        {locale.cancel}
                    </Button>
                    <Button onClick={handleDownload} disabled={!name.trim()}>
                        {locale.save}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
