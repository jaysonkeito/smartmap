#!/bin/bash
while true; do
  curl -s http://127.0.0.1:3000/ > /dev/null 2>&1
  sleep 5
done
