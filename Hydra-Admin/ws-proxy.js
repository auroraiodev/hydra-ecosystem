/**
 * Lightweight reverse proxy — single public entry point for the Admin container.
 *
 * Port layout:
 *   PORT (3001)      — this proxy, exposed to Traefik / the internet
 *   NEXT_PORT (3010) — Next.js standalone (internal only)
 *   API_PORT (3002)  — NestJS backend (internal only)
 *
 * Routing:
 *   /socket.io/*                       → NestJS chat service (CHAT_HOST:CHAT_PORT)
 *   /api/*                             → NestJS backend (:API_PORT)
 *   Everything else                     → Next.js (:NEXT_PORT)
 */

import http from 'http';
import net from 'net';
import { URL } from 'url';

const PORT      = parseInt(process.env.PORT      || '3001', 10);
const NEXT_PORT = parseInt(process.env.NEXT_PORT || '3010', 10);
const API_PORT  = parseInt(process.env.API_PORT  || '3002', 10);

const _chatUrl  = process.env.CHAT_SERVICE_URL || (process.env.NODE_ENV === 'production' ? 'http://hydra-admin-api:3002' : 'http://127.0.0.1:3002');
const _parsed   = new URL(_chatUrl);
const CHAT_HOST = _parsed.hostname;
const CHAT_PORT = parseInt(_parsed.port || '3002', 10);

function proxyHttp(req, res, targetHost, targetPort, addV1Prefix = false) {
  let path = req.url || '';
  if (addV1Prefix && path.startsWith('/api/')) {
    // Insert /v1 after /api to satisfy NestJS URI versioning
    path = path.replace('/api/', '/api/v1/');
  }
  const upstream = http.request(
    { hostname: targetHost, port: targetPort, path, method: req.method, headers: req.headers },
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
  const url = req.url || '';
  if (url.startsWith('/socket.io')) {
    // WebSocket and Socket.IO traffic → NestJS chat service
    proxyHttp(req, res, CHAT_HOST, CHAT_PORT);
  } else if (url.startsWith('/api/')) {
    // API traffic → NestJS backend (port 3002) with /v1 versioning
    proxyHttp(req, res, '127.0.0.1', API_PORT, true);
  } else {
    // Everything else → Next.js frontend (port 3010)
    proxyHttp(req, res, '127.0.0.1', NEXT_PORT);
  }
});

server.on('upgrade', (req, socket, head) => {
  proxyWs(req, socket, head, CHAT_HOST, CHAT_PORT);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[ws-proxy-admin] :${PORT} → Next.js :${NEXT_PORT}, API :${API_PORT}, Chat WS: ${CHAT_HOST}:${CHAT_PORT}`);
});
