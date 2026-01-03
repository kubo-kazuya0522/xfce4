#!/usr/bin/env bash
set -e

echo "[*] Starting PulseAudio..."
pulseaudio -k 2>/dev/null || true
pulseaudio --start --exit-idle-time=-1

echo "[*] Creating virtual audio sink..."
pactl load-module module-null-sink sink_name=virtual_sink sink_properties=device.description=VirtualSink

echo "[*] Restarting Icecast2..."
sudo service icecast2 restart

echo "[*] Starting ultra low-latency ffmpeg stream (OGG)..."

ffmpeg -f pulse -i virtual_sink.monitor \
  -ac 2 -ar 20000 \
  -b:a 64k \
  -compression_level 0 \
  -application voip \
  -content_type application/ogg \
  -fflags nobuffer \
  -flags low_delay \
  -max_delay 0 \
  -flush_packets 1 \
  -f ogg icecast://source:vncpass@localhost:8000/stream.ogg
