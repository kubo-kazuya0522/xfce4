import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// HTML 配信
const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, "ws-audio.html");
  const html = fs.readFileSync(filePath);
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
});

// WebSocket
const wss = new WebSocketServer({ server });

let clients = [];

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.push(ws);

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);
  });
});

// ffmpeg → PCM（raw）を stdout に流す
const ffmpeg = spawn("ffmpeg", [
  "-f", "pulse",
  "-i", "virtual_sink.monitor",
  "-ac", "1",
  "-ar", "29000",
  "-f", "s16le",
  "-flush_packets", "0", 
  "-max_delay", "0",
  "pipe:1"
]);

ffmpeg.stdout.on("data", (chunk) => {
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(chunk);
    }
  }
});

ffmpeg.stderr.on("data", (data) => {
  console.log("ffmpeg:", data.toString());
});

server.listen(9000, () => {
  console.log("Server + WebSocket running on port 9000");
});
