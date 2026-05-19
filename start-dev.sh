#!/bin/bash
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=512"
while true; do
  npx next dev -p 3000 > /home/z/my-project/dev.log 2>&1
  echo "Server died at $(date), restarting in 3s..." >> /home/z/my-project/dev-restart.log
  sleep 3
done
