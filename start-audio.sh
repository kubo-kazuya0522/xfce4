#!/usr/bin/env bash
set -e

echo "[*] Installing audio streaming packages..."

sudo apt-get update -y
sudo apt-get install -y \
    icecast2 pulseaudio ffmpeg

echo "[*] Configuring PulseAudio..."

pulseaudio -k 2>/dev/null || true
pulseaudio --start --exit-idle-time=-1

echo "[*] Starting Icecast2..."
sudo service icecast2 restart

echo "[*] Starting ffmpeg audio stream (PulseAudio → Icecast)..."

ffmpeg -f pulse -i default -ac 2 -ar 44100 -b:a 128k \
    -content_type audio/mpeg \
    -f mp3 icecast://source:vncpass@localhost:8000/stream.mp3
