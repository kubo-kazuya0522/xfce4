#!/usr/bin/env bash
set -e

echo "[*] Starting PulseAudio..."
pulseaudio -k 2>/dev/null || true
pulseaudio --start --exit-idle-time=-1

echo "[*] Creating virtual audio sink..."
pactl load-module module-null-sink sink_name=virtual_sink sink_properties=device.description=VirtualSink

echo "[*] Restarting Icecast2..."
sudo service icecast2 restart

echo "[*] Starting low-latency ffmpeg stream..."

ffmpeg -f pulse -i virtual_sink.monitor \
  -ac 2 -ar 44100 -b:a 128k \
  -content_type audio/mpeg \
  -fflags nobuffer \
  -flags low_delay \
  -max_delay 0 \
  -f mp3 icecast://source:vncpass@localhost:8000/stream.mp3
