#!/bin/bash
cd /home/z/my-project
export NODE_OPTIONS="--max-old-space-size=512"

echo "WRAPPER: Starting at $(date)" > /home/z/my-project/wrapper.log

node node_modules/.bin/next dev -p 3000 2>&1 | tee /home/z/my-project/dev.log
EXIT_CODE=${PIPESTATUS[0]}

echo "WRAPPER: Process exited with code $EXIT_CODE at $(date)" >> /home/z/my-project/wrapper.log
echo "WRAPPER: Sleeping 5s before restart..." >> /home/z/my-project/wrapper.log
sleep 5
echo "WRAPPER: Restarting..." >> /home/z/my-project/wrapper.log

# Restart
exec "$0"
