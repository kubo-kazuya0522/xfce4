import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// ---- HTTP サーバ ----
const server = http.createServer((req, res) => {

  // ★ /pcm を復活
  if (req.url === "/pcm") {
    const filePath = path.join(__dirname, "pcm.html");
    const html = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (req.url === "/pcm-worklet") {
    const filePath = path.join(__dirname, "pcm-worklet.html");
    const html = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (req.url === "/webrtc") {
    const filePath = path.join(__dirname, "webrtc.html");
    const html = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  if (req.url === "/worklet.js") {
    const filePath = path.join(__dirname, "worklet.js");
    const js = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": "application/javascript" });
    res.end(js);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

// ---- PCM 用 WebSocket ----
const wssPcm = new WebSocketServer({ noServer: true });
let pcmClients = [];

wssPcm.on("connection", (ws) => {
  console.log("PCM client connected");
  ws._socket.setNoDelay(true);
  pcmClients.push(ws);

  ws.on("close", () => {
    pcmClients = pcmClients.filter(c => c !== ws);
  });
});

// ---- HTTP Upgrade ----
server.on("upgrade", (req, socket, head) => {
  socket.setNoDelay(true);
  if (req.url === "/pcm-ws") {
    wssPcm.handleUpgrade(req, socket, head, (ws) => {
      wssPcm.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

// ---- ffmpeg → PCM（高音質・低遅延設定） ----
const ffmpeg = spawn("ffmpeg", [
  "-flags", "low_delay",
  "-f", "pulse",
  "-i", "virtual_sink.monitor",
  "-ac", "1",
  "-ar", "44100",
  "-f", "f32le",
  "-flush_packets", "1",
  "-max_delay", "0",
  "pipe:1"
]);

// ---- WebSocket 送信（小さめチャンク） ----
ffmpeg.stdout.on("data", (chunk) => {
  const size = 4096;
  for (let i = 0; i < chunk.length; i += size) {
    const slice = chunk.subarray(i, i + size);
    for (const ws of pcmClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(slice);
      }
    }
  }
});

ffmpeg.stderr.on("data", (data) => {
  console.log("ffmpeg:", data.toString());
});

server.listen(9000, () => {
  console.log("Compare server running on port 9000");
  console.log("PCM page        : /pcm");
  console.log("PCM Worklet page: /pcm-worklet");
  console.log("WebRTC page     : /webrtc");
});
