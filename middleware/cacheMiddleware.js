const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600, useClones: false });

/**
 * Middleware para cachear las respuestas de las peticiones.
 * Si una petición ya ha sido cacheada, la sirve desde la caché.
 * Si no, la procesa y la guarda en caché para futuras peticiones.
 * @param {object} context - El objeto de contexto de la petición.
 * @param {http.IncomingMessage} context.request - El objeto de la petición.
 * @param {http.ServerResponse} context.response - El objeto de la respuesta.
 * @returns {string|void} - Retorna 'stop_execution' si la respuesta es servida desde la caché.
 */
function cacheMiddleware(context) {
  const { request, response } = context;
  const key = request.url;

  const cachedResult = cache.get(key);

  //Si existe la KEY en la cache, retornamos la ruta cacheada 
  if (cachedResult) {
    //console.log(`[CACHE] HIT: ${key}`); //Indica que retornamos la página cacheada
    response.writeHead(cachedResult.statusCode, cachedResult.headers);
    response.end(cachedResult.body);
    return 'stop_execution';
  }

  //Si no existe la KEY hacemos la petición al servidor y guardamos la página de la ruta en caché
  //console.log(`[CACHE] MISS: ${key}`); //Indica que retornaremos la respuesta directamente desde el servidor no desde cache

  const originalEnd = response.end;
  const chunks = [];
  
  // Sobrescribimos la función 'end' de la respuesta
  response.end = function(chunk, encoding) {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    
    // Reconstruimos el cuerpo de la respuesta
    const body = Buffer.concat(chunks).toString('utf8');

    // Asumimos que si no hay error, el status es 200.
    // Esta es una simplificación, pero debería funcionar para las rutas GET.
    const statusCode = response.statusCode || 200;
    
    if (statusCode === 200) {
      try {
        const headers = response.getHeaders ? response.getHeaders() : (response.headers || {});
        const cacheData = {
          statusCode: statusCode,
          headers: headers,
          body: body
        };
        
        // Verificación final antes de llamar a set
        if (typeof key === 'string' || typeof key === 'number') {
          cache.set(key, cacheData);  //Agregamnos la página en cache
        } else {
          console.error(`[CACHE-ERROR] Intento de guardar en caché con clave inválida. Tipo: ${typeof key}, Valor: ${key}`);
        }
      } catch (e) {
        console.error(`[CACHE-ERROR] Error al intentar guardar en caché: ${e.message}`);
      }
    }

    // Devolvemos la función 'end' a su estado original para esta instancia
    response.end = originalEnd;
    // Y la llamamos para finalizar la respuesta real
    response.end(chunk, encoding);
  };
}

/**
 * Limpia toda la caché.
 */
function clearCache() {
  cache.flushAll();
  console.log("Caché completamente limpiada.");
}

module.exports = { cache, cacheMiddleware, clearCache };