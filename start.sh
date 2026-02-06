#!/bin/bash

cd /app/apps/api && bun server.ts &
API_PID=$!

cd /app/apps/web && node build/index.js &
WEB_PID=$!

trap "kill $API_PID $WEB_PID 2>/dev/null" SIGTERM SIGINT

wait $API_PID $WEB_PID
