type MobileConfigProps = {
    serverUrl: string
    calendarName: string
    username: string
}

export const generateMobileConfig = ({ serverUrl, calendarName, username }: MobileConfigProps) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>CalDAVAccountDescription</key>
            <string>${calendarName}</string>
            <key>CalDAVHostName</key>
            <string>${new URL(serverUrl).hostname}</string>
            <key>CalDAVPort</key>
            <integer>${new URL(serverUrl).port || (serverUrl.startsWith('https') ? 443 : 80)}</integer>
            <key>CalDAVPrincipalURL</key>
            <string>${new URL(serverUrl).pathname}</string>
            <key>CalDAVUseSSL</key>
            <${serverUrl.startsWith('https') ? 'true' : 'false'}/>
            <key>CalDAVUsername</key>
            <string>${username}</string>
            <key>PayloadDescription</key>
            <string>CalDAV 계정 설정</string>
            <key>PayloadDisplayName</key>
            <string>${calendarName}</string>
            <key>PayloadIdentifier</key>
            <string>com.b-calendar.caldav.${Date.now()}</string>
            <key>PayloadType</key>
            <string>com.apple.caldav.account</string>
            <key>PayloadUUID</key>
            <string>${crypto.randomUUID()}</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>B-Calendar CalDAV 계정</string>
    <key>PayloadDisplayName</key>
    <string>${calendarName}</string>
    <key>PayloadIdentifier</key>
    <string>com.b-calendar.profile.${Date.now()}</string>
    <key>PayloadOrganization</key>
    <string>B-Calendar</string>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>${crypto.randomUUID()}</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`
