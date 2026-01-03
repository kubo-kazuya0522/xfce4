import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// ---- HTTP サーバ ----
const server = http.createServer((req, res) => {
  if (req.url === "/pcm") {
    const filePath = path.join(__dirname, "pcm.html");
    const html = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;

  } else if (req.url === "/pcm-worklet") {   // ← 追加した部分
    const filePath = path.join(__dirname, "pcm-worklet.html");
    const html = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;

  } else if (req.url === "/webrtc") {
    const filePath = path.join(__dirname, "webrtc.html");
    const html = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;

  } else if (req.url === "/worklet.js") {   // ← AudioWorklet 用
    const filePath = path.join(__dirname, "worklet.js");
    const js = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": "application/javascript" });
    res.end(js);
    return;

  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// ---- PCM 用 WebSocket ----
const wssPcm = new WebSocketServer({ noServer: true });
let pcmClients = [];

wssPcm.on("connection", (ws) => {
  console.log("PCM client connected");
  pcmClients.push(ws);

  ws.on("close", () => {
    pcmClients = pcmClients.filter(c => c !== ws);
  });
});

// HTTP Upgrade で /pcm-ws にだけ WebSocket 接続許可
server.on("upgrade", (req, socket, head) => {
  if (req.url === "/pcm-ws") {
    wssPcm.handleUpgrade(req, socket, head, (ws) => {
      wssPcm.emit("connection", ws, req);
    });
  } else {
    socket.destroy();
  }
});

// ---- ffmpeg → PCM（16kHz, mono） ----
const ffmpeg = spawn("ffmpeg", [
  "-f", "pulse",
  "-i", "virtual_sink.monitor",
  "-ac", "1",          // モノラルに変換（データ量を半分にして遅延を減らす）
  "-ar", "16000",      // 16kHz に変換（あなたの環境で一番安定していた）
  "-f", "s16le",
  "-flush_packets", "0",
  "-max_delay", "0",
  "pipe:1"
]);

ffmpeg.stdout.on("data", (chunk) => {
  for (const ws of pcmClients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk);
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
