# xfce4

# sudo apt-get install -y nodejs npm
# cd /workspaces/xfce4/current
# npm install ws
# node compare-server.js
# 仮想出力（virtual sink）を作成 
pactl load-module module-null-sink sink_name=virtual_sink sink_properties=device.description=VirtualSink 
# 入力モニタを確認 
pactl list short sinks 
pactl list short sources