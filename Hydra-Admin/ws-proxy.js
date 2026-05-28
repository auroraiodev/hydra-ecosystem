/**
 * Lightweight reverse proxy — single public entry point for the Admin container.
 *
 * Port layout:
 *   PORT (3001)      — this proxy, exposed to Traefik / the internet
 *   NEXT_PORT (3010) — Next.js standalone (internal only)
 *
 * Routing:
 *   WebSocket upgrades              → hydra-chat (CHAT_HOST:CHAT_PORT)
 *   GET|POST /socket.io/* (polling) → hydra-chat (CHAT_HOST:CHAT_PORT)
 *   Everything else                 → Next.js
 */

import http from 'http';
import net from 'net';
import { URL } from 'url';

const PORT      = parseInt(process.env.PORT      || '3001', 10);
const NEXT_PORT = parseInt(process.env.NEXT_PORT || '3010', 10);

const _chatUrl  = process.env.CHAT_SERVICE_URL || 'http://127.0.0.1:3007';
const _parsed   = new URL(_chatUrl);
const CHAT_HOST = _parsed.hostname;
const CHAT_PORT = parseInt(_parsed.port || '3007', 10);

function proxyHttp(req, res, targetHost, targetPort) {
  const upstream = http.request(
    { hostname: targetHost, port: targetPort, path: req.url, method: req.method, headers: req.headers },
    (upRes) => {
      res.writeHead(upRes.statusCode, upRes.headers);
      upRes.pipe(res, { end: true });
    },
  );
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502);
    res.end('Bad Gateway');
  });
  req.pipe(upstream, { end: true });
}

function proxyWs(req, socket, head, targetHost, targetPort) {
  const target = net.connect(targetPort, targetHost, () => {
    const rawHeaders = Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n');
    target.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${rawHeaders}\r\n\r\n`);
    if (head?.length) target.write(head);
    socket.pipe(target);
    target.pipe(socket);
  });
  target.on('error', () => socket.destroy());
  socket.on('error', () => target.destroy());
}

const server = http.createServer((req, res) => {
  if (req.url?.startsWith('/socket.io')) {
    proxyHttp(req, res, CHAT_HOST, CHAT_PORT);
  } else {
    proxyHttp(req, res, '127.0.0.1', NEXT_PORT);
  }
});

server.on('upgrade', (req, socket, head) => {
  proxyWs(req, socket, head, CHAT_HOST, CHAT_PORT);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[ws-proxy-admin] :${PORT} → Next.js :${NEXT_PORT}, Chat WS: ${CHAT_HOST}:${CHAT_PORT}`);
});
