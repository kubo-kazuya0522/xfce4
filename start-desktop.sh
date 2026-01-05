#!/usr/bin/env bash
set -e

echo "[*] Installing packages..."

# ==== Update =======================================================
sudo apt-get update -y
sudo apt-get upgrade -y

# ==== Install packages ============================================
sudo apt-get install -y \
  xfce4 xfce4-goodies \
  tigervnc-standalone-server tigervnc-common \
  novnc websockify \
  dbus-x11 x11-xserver-utils \
  xfce4-terminal xfce4-panel \
  pulseaudio \
  ibus ibus-mozc \
  language-pack-ja language-pack-gnome-ja \
  fonts-ipafont fonts-ipafont-gothic fonts-ipafont-mincho \
  wget tar xz-utils bzip2 git

# ==== Locale =======================================================
sudo locale-gen ja_JP.UTF-8
sudo update-locale LANG=ja_JP.UTF-8

export LANG=ja_JP.UTF-8
export LC_ALL=ja_JP.UTF-8
export LANGUAGE=ja_JP:ja

# ==== Input Method (IBus) ==========================================
export GTK_IM_MODULE=ibus
export QT_IM_MODULE=ibus
export XMODIFIERS=@im=ibus

mkdir -p ~/.config/autostart
cat > ~/.config/autostart/ibus.desktop <<'EOF'
[Desktop Entry]
Type=Application
Exec=ibus-daemon -drx
X-GNOME-Autostart-enabled=true
Name=IBus
EOF

# ==== VNC Setup ====================================================
VNC_DIR="$HOME/.vnc"
mkdir -p "$VNC_DIR"

echo "vncpass" | vncpasswd -f > "$VNC_DIR/passwd" || true
chmod 600 "$VNC_DIR/passwd"

cat > "$VNC_DIR/xstartup" <<'EOF'
#!/bin/bash
export LANG=ja_JP.UTF-8
export LC_ALL=ja_JP.UTF-8
export LANGUAGE=ja_JP:ja

export GTK_IM_MODULE=ibus
export QT_IM_MODULE=ibus
export XMODIFIERS=@im=ibus

xrdb $HOME/.Xresources
exec dbus-launch --exit-with-session startxfce4
EOF
chmod +x "$VNC_DIR/xstartup"

# ==== Cleanup old sessions ========================================
vncserver -kill :1 2>/dev/null || true
pkill Xtigervnc 2>/dev/null || true
pkill websockify 2>/dev/null || true

# ==== Wait until port 6080 is free ================================
while ss -tlnp | grep -q ":6080"; do
  echo "[*] Waiting for port 6080 to be free..."
  sleep 1
done

# ==== Update noVNC to latest ======================================
sudo rm -rf /usr/share/novnc
sudo git clone https://github.com/novnc/noVNC /usr/share/novnc

# ==== Start VNC (TigerVNC) ========================================
echo "[*] Starting TigerVNC (:1)..."
vncserver :1 -geometry 1366x768 -depth 24 -localhost no

# ==== Delay to ensure VNC is ready ================================
sleep 2

# ==== Start noVNC (websockify) ====================================
echo "[*] Starting noVNC (6080)..."
nohup websockify --web=/usr/share/novnc/ \
  6080 localhost:5901 \
  > /tmp/novnc.log 2>&1 &

# ==== Audio ========================================================
pulseaudio --kill 2>/dev/null || true
pulseaudio --start --exit-idle-time=-1

# ==== Done =========================================================
echo "=============================================================="
echo " ✔ noVNC  : http://localhost:6080/"
echo " ✔ Desktop: XFCE4 (Japanese / IBus / Mozc)"
echo " ✔ TigerVNC + 最新 noVNC"
echo " ✔ 6080 ポート詰まり対策済み（安定版）"
echo "=============================================================="
