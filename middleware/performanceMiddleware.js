/**
 * Middleware para medir el tiempo de respuesta de las peticiones.
 * Registra la duración de cada petición en la consola.
 * @param {object} context - El objeto de contexto de la petición.
 * @param {http.IncomingMessage} context.request - El objeto de la petición.
 * @param {http.ServerResponse} context.response - El objeto de la respuesta.
 */
const performanceMetricsMiddleware = (context) => {
    const { request, response } = context;
    const start = process.hrtime();

    if (response) {
        response.on('finish', () => {
            const diff = process.hrtime(start);
            const durationInMs = (diff[0] * 1e3) + (diff[1] * 1e-6);

            console.log(
                `[Metrics] Petición a: ${request.url} | Código: ${response.statusCode} | Duración: ${durationInMs.toFixed(3)} ms`
            );
        });
    }
};

module.exports = {
    performanceMetricsMiddleware,
};
