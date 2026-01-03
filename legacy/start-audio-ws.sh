#!/usr/bin/env bash
set -e

echo "[*] Starting PulseAudio..."
pulseaudio -k 2>/dev/null || true
pulseaudio --start --exit-idle-time=-1

echo "[*] Creating virtual audio sink..."
pactl load-module module-null-sink sink_name=virtual_sink sink_properties=device.description=VirtualSink

echo "[*] Starting WebSocket audio stream (Opus)..."

ffmpeg -f pulse -i virtual_sink.monitor \
  -ac 1 -ar 16000 \
  -b:a 48k \
  -c:a libopus \
  -application lowdelay \
  -frame_duration 10 \
  -f ogg \
  -flush_packets 1 \
  "ws://localhost:9000"
