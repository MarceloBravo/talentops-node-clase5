const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const url = require('url');
const { parseMultipartFormData } = require('./multipart-parser');

// Middleware de logging
function logger(context) {
  const timestamp = new Date().toISOString();
  const { method, url } = context.request;
  console.log(`[${timestamp}] ${method} ${url}`);
}

// Middleware CORS
function cors(context) {
  const { response } = context;
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Middleware para parsear JSON
async function jsonParser(context) {
  const { request } = context;

  if (request.headers['content-type'] && request.headers['content-type'].startsWith('application/json')) {
    let body = '';

    return new Promise((resolve, reject) => {
      request.on('data', chunk => {
        body += chunk.toString();
      });

      request.on('end', () => {
        try {
          context.body = JSON.parse(body);
          resolve();
        } catch (error) {
          reject(new Error('JSON inválido'));
        }
      });

      request.on('error', reject);
    });
  }
}

// Middleware para servir archivos estáticos
async function staticFiles(context) {
  const { request, response } = context;
  const parsedUrl = url.parse(request.url);
  const pathname = parsedUrl.pathname;

  // Solo servir archivos de /public/
  if (pathname.startsWith('/public/')) {
    const filePath = path.join(__dirname, pathname);

    try {
      const stat = await fsp.stat(filePath);

      if (stat.isFile()) {
        const ext = path.extname(filePath);
        const contentType = getContentType(ext);

        response.writeHead(200, { 'Content-Type': contentType });

        const stream = fs.createReadStream(filePath);
        stream.pipe(response);
        return 'end'; // Terminar procesamiento
      }
    } catch (error) {
      // Archivo no encontrado, continuar
    }
  }
}

function getContentType(ext) {
  const types = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif'
  };
  return types[ext] || 'text/plain';
}

// Middleware para parsear multipart/form-data
async function multipart(context) {
  const { request } = context;
  const contentType = request.headers['content-type'];

  if (contentType && contentType.startsWith('multipart/form-data')) {
    const boundaryMatch = /boundary=(.+)/.exec(contentType);
    if (!boundaryMatch) {
      return;
    }
    const boundary = boundaryMatch[1];

    let body = [];
    return new Promise((resolve, reject) => {
      request.on('data', (chunk) => {
        body.push(chunk);
      });

      request.on('end', () => {
        const fullBuffer = Buffer.concat(body);
        const parsedData = parseMultipartFormData(fullBuffer, boundary);
        context.body = parsedData;
        resolve();
      });

      request.on('error', reject);
    });
  }
}

// Middleware para gestionar sesiones simples (in-memory)
// Se debe inicializar usando createSessionMiddleware(sessionStore)
function createSessionMiddleware(sessionStore) {
  return async function session(context) {
    const { request } = context;
    const cookieHeader = request.headers['cookie'];
    context.session = null;
    context.user = null;
    if (!cookieHeader) return;

    // Parse cookies simples (clave=valor; ...)
    const cookies = cookieHeader.split(';').reduce((acc, cookiePart) => {
      const [k, v] = cookiePart.split('=').map(s => s && s.trim());
      if (k) acc[k] = v;
      return acc;
    }, {});

    const sessionId = cookies.sessionId;
    if (!sessionId) return;

    if (sessionStore && typeof sessionStore.get === 'function') {
      const sessionData = sessionStore.get(sessionId);
      if (sessionData) {
        context.session = sessionData;
        context.user = sessionData.user || sessionData;
      }
    }
  }
}

module.exports = {
  logger,
  cors,
  jsonParser,
  staticFiles,
  multipart,
  createSessionMiddleware
};