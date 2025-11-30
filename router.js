// router.js - Sistema de routing avanzado
const url = require('url');

class Router {
    /**
     * Crea una nueva instancia del Router.
     */
  constructor() {
    this.routes = {};
    this.middlewares = [];
  }

  /**
   * Agrega un middleware global al router.
   * @param {function} middleware - La función de middleware a agregar.
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Registra una ruta con un método, una ruta y una o más funciones de manejo.
   * @param {string} method - El método HTTP (GET, POST, etc.).
   * @param {string} path - La ruta de la URL.
   * @param  {...function} handlers - Las funciones de manejo de la ruta.
   */
  addRoute(method, path, ...handlers) {
    if (!this.routes[method]) {
      this.routes[method] = [];
    }

    // Convertir path con parámetros a regex
    const paramNames = [];
    const regexPath = path.replace(/:(\w+)/g, (match, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });

    this.routes[method].push({
      originalPath: path,
      regex: new RegExp(`^${regexPath}$`),
      paramNames,
      handlers
    });
  }

    /**
     * Registra una ruta GET.
     * @param {string} path - La ruta de la URL.
     * @param  {...function} handlers - Las funciones de manejo de la ruta.
     */
  get(path, ...handlers) {
    this.addRoute('GET', path, ...handlers);
  }

    /**
     * Registra una ruta POST.
     * @param {string} path - La ruta de la URL.
     * @param  {...function} handlers - Las funciones de manejo de la ruta.
     */
  post(path, ...handlers) {
    this.addRoute('POST', path, ...handlers);
  }

    /**
     * Registra una ruta PUT.
     * @param {string} path - La ruta de la URL.
     * @param  {...function} handlers - Las funciones de manejo de la ruta.
     */
  put(path, ...handlers) {
    this.addRoute('PUT', path, ...handlers);
  }

    /**
     * Registra una ruta DELETE.
     * @param {string} path - La ruta de la URL.
     * @param  {...function} handlers - Las funciones de manejo de la ruta.
     */
  delete(path, ...handlers) {
    this.addRoute('DELETE', path, ...handlers);
  }

    /**
     * Encuentra una ruta que coincida con el método y la ruta de la URL.
     * @param {string} method - El método HTTP.
     * @param {string} pathname - La ruta de la URL.
     * @returns {object|null} - La información de la ruta o null si no se encuentra.
     */
  findRoute(method, pathname) {
    const methodRoutes = this.routes[method];
    if (!methodRoutes) return null;

    for (const route of methodRoutes) {
      const match = pathname.match(route.regex);
      if (match) {
        // Extraer parámetros
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return { route, params };
      }
    }

    return null;
  }

    /**
     * Ejecuta los middlewares y las funciones de manejo de una ruta.
     * @param {http.IncomingMessage} request - El objeto de la petición.
     * @param {http.ServerResponse} response - El objeto de la respuesta.
     * @param {object} routeInfo - La información de la ruta.
     * @returns {Promise<any>}
     */
  async execute(request, response, routeInfo) {
    const { route, params } = routeInfo;

    // Crear contexto
    const context = {
      request,
      response,
      params,
      query: url.parse(request.url, true).query,
      body: null
    };

    // Ejecutar middlewares globales
    for (const middleware of this.middlewares) {
        const result = await middleware(context);
        if (result === 'stop_execution') {
            return;
        }
    }

    // Ejecutar handlers de la ruta
    for (const handler of route.handlers) {
      const result = await handler(context);
      if (result === 'next') continue;
      if (result !== undefined) return result;
    }
  }
}

module.exports = Router;