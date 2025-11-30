const http = require('http');
const Router = require('./router');
const TemplateEngine = require('./templates');
const StaticServer = require('./static-server');
const { logger, cors, jsonParser, staticFiles, multipart, createSessionMiddleware } = require('./middleware');
const { performanceMetricsMiddleware } = require('./middleware/performanceMiddleware.js');
const url = require('url');
const path = require('path');
const fs = require('fs');
const { cacheMiddleware, clearCache } = require('./middleware/cacheMiddleware.js'); // Importamos cache-middleware

// Datos de ejemplo
const productosData = fs.readFileSync(path.join(__dirname, 'data', 'productos.json'), 'utf-8');
const productos = JSON.parse(productosData.trim().replace(/^\uFEFF/, ''));
const users = require('./data/users.json');

// Inicializar componentes
const router = new Router();
const templates = new TemplateEngine();
const staticServer = new StaticServer();

// Configurar middleware
// In-memory sessions store
const sessions = new Map();

router.use(performanceMetricsMiddleware);
router.use(logger);
router.use(cors);
router.use(jsonParser);
router.use(multipart);
router.use(createSessionMiddleware(sessions));

// Rutas principales
router.get('/', cacheMiddleware, async (context) => {
  const { response } = context;

  const html = await templates.render('home', {
    titulo: 'Bienvenido a Mi Tienda',
    productos: productos.slice(0, 3), // Mostrar 3 productos destacados
    fecha: new Date().toLocaleDateString('es-ES')
    , user: context.user
    , isAuthenticated: !!context.user
    , isGuest: !context.user
  });

  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end(html);
});

router.get('/productos', cacheMiddleware, async (context) => {
  const { response, query } = context;

  let productosFiltrados = productos;

  // Filtros por query
  if (query.categoria) {
    productosFiltrados = productosFiltrados.filter(p => p.categoria === query.categoria);
  }

  if (query.maxPrecio) {
    const maxPrecio = parseFloat(query.maxPrecio);
    productosFiltrados = productosFiltrados.filter(p => p.precio <= maxPrecio);
  }

  const html = await templates.render('productos', {
    titulo: 'Nuestros Productos',
    productos: productosFiltrados,
    filtros: query
    , user: context.user
    , isAuthenticated: !!context.user
    , isGuest: !context.user
  });

  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end(html);
});

router.get('/productos/:id', cacheMiddleware, async (context) => {
  const { response, params } = context;
  const id = parseInt(params.id);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    const html = await templates.render('404', {
      titulo: 'Producto no encontrado',
      mensaje: `El producto con ID ${id} no existe.`
      , user: context.user
      , isAuthenticated: !!context.user
      , isGuest: !context.user
    });
    response.writeHead(404, { 'Content-Type': 'text/html' });
    response.end(html);
    return;
  }
  // Asegurar imagen por defecto
  if (!producto.imagen_url) producto.imagen_url = 'default.jpg';
  const html = await templates.render('producto-detalle', {
    titulo: producto.nombre,
    producto,
    user: context.user
    , isAuthenticated: !!context.user
    , isGuest: !context.user
  });

  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end(html);
});

router.get('/acerca', cacheMiddleware, async (context) => {
  const { response } = context;

  const html = await templates.render('about', {
    titulo: 'Acerca de Nosotros',
    empresa: 'Mi Tienda Online',
    descripcion: 'Somos una tienda especializada en productos tecnológicos.',
    fundacion: 2020
    , user: context.user
    , isAuthenticated: !!context.user
    , isGuest: !context.user
  });

  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end(html);
});

router.get('/login', cacheMiddleware, async (context) => {
  const { response } = context;

  const html = await templates.render('login', {
    titulo: 'Iniciar Sesión'
    , user: context.user
    , isAuthenticated: !!context.user
    , isGuest: !context.user
  });

  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.end(html);
});

// API REST
router.get('/api/productos', cacheMiddleware, (context) => {
  const { response, query } = context;

  let resultados = productos;

  // Aplicar filtros
  if (query.categoria) {
    resultados = resultados.filter(p => p.categoria === query.categoria);
  }

  if (query.minPrecio) {
    const minPrecio = parseFloat(query.minPrecio);
    resultados = resultados.filter(p => p.precio >= minPrecio);
  }

  if (query.maxPrecio) {
    const maxPrecio = parseFloat(query.maxPrecio);
    resultados = resultados.filter(p => p.precio <= maxPrecio);
  }

  // Ordenamiento
  if (query.ordenar === 'precio_asc') {
    resultados.sort((a, b) => a.precio - b.precio);
  } else if (query.ordenar === 'precio_desc') {
    resultados.sort((a, b) => b.precio - a.precio);
  }

  // Paginación
  const pagina = parseInt(query.pagina) || 1;
  const limite = parseInt(query.limite) || 10;
  const inicio = (pagina - 1) * limite;
  const paginados = resultados.slice(inicio, inicio + limite);

  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({
    total: resultados.length,
    pagina,
    limite,
    productos: paginados
  }));
});

router.get('/api/productos/:id', cacheMiddleware, (context) => {
  const { response, params } = context;
  const id = parseInt(params.id);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Producto no encontrado' }));
    return;
  }

  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(producto));
});

router.post('/api/login', (context) => {
  const { response, body } = context;
  const { username, password } = body;

  const user = users.find(u => u.usuario === username && u.contrasena === password);

  if (user) {
    // Crear una sesión simple en memoria
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessions.set(sessionId, { user });
    response.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Path=/`
    });
    response.end(JSON.stringify({ message: 'Login exitoso', user: { id: user.id, nombre: user.nombre, usuario: user.usuario } }));
  } else {
    response.writeHead(401, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Credenciales inválidas' }));
  }
});

router.post('/api/logout', (context) => {
  const { request, response } = context;
  const cookieHeader = request.headers['cookie'];
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
      const [k,v] = c.split('=').map(s=>s && s.trim()); if (k) acc[k]=v; return acc;
    }, {});
    const sessionId = cookies.sessionId;
    if (sessionId) {
      sessions.delete(sessionId);
    }
  }

  // Borrar cookie
  response.writeHead(200, { 'Set-Cookie': 'sessionId=; Max-Age=0; Path=/' , 'Content-Type': 'application/json'});
  response.end(JSON.stringify({ message: 'Logout exitoso' }));
});

// Ruta de logout por GET como fallback para usuarios sin JS funcional
router.get('/logout', (context) => {
  const { request, response } = context;
  const cookieHeader = request.headers['cookie'];
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
      const [k,v] = c.split('=').map(s=>s && s.trim()); if (k) acc[k]=v; return acc;
    }, {});
    const sessionId = cookies.sessionId;
    if (sessionId) {
      sessions.delete(sessionId);
    }
  }
  response.writeHead(302, { 'Location': '/login', 'Set-Cookie': 'sessionId=; Max-Age=0; Path=/' });
  response.end();
});

router.post('/productos/:id/upload', async (context) => {
  const { request, response, params, body } = context;
  const id = parseInt(params.id);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    response.writeHead(404, { 'Content-Type': 'text/html' });
    response.end('Producto no encontrado');
    return;
  }

  // Validar sesión - sólo usuarios logueados
  if (!context.user) {
    response.writeHead(401, { 'Content-Type': 'text/html' });
    response.end('No autorizado. Inicia sesión para subir imágenes.');
    return;
  }

  const file = body.files.productImage;
  if (!file) {
    response.writeHead(400, { 'Content-Type': 'text/html' });
    response.end('No se ha subido ningún archivo');
    return;
  }

  // Validar tipo de archivo básico
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.contentType)) {
    response.writeHead(400, { 'Content-Type': 'text/html' });
    response.end('Tipo de archivo no permitido');
    return;
  }

  // Normalizar y proteger el nombre de archivo
  const safeFileName = `${Date.now()}-${path.basename(file.filename)}`;
  const uploadPath = path.join(__dirname, 'public', 'images', safeFileName);
  
  try {
    await fs.promises.writeFile(uploadPath, file.data);
    producto.imagen_url = safeFileName;
    
    const productosPath = path.join(__dirname, 'data', 'productos.json');
    await fs.promises.writeFile(productosPath, JSON.stringify(productos, null, 2), 'utf-8');
    
    clearCache(); // Limpiar caché

    response.writeHead(302, { 'Location': `/productos/${id}` });
    response.end();
  } catch (error) {
    console.error('Error al guardar el archivo:', error);
    response.writeHead(500, { 'Content-Type': 'text/html' });
    response.end('Error interno al guardar la imagen');
  }
});

router.post('/productos/:id/comentarios', async (context) => {
  const { request, response, params, body } = context;
  const id = parseInt(params.id);
  const producto = productos.find(p => p.id === id);

  if (!producto) {
    response.writeHead(404, { 'Content-Type': 'text/html' });
    response.end('Producto no encontrado');
    return;
  }

  // Validar sesión - sólo usuarios logueados
  if (!context.user) {
    response.writeHead(401, { 'Content-Type': 'text/html' });
    response.end('No autorizado. Inicia sesión para subir imágenes.');
    return;
  }

  // Validación básica de campos
  const errors = [];
  if (!body.fields || !body.fields.user_id) errors.push('Debes iniciar sesión');
  if (!body.fields || !body.fields.puntuacion) errors.push('Falta la puntuación');
  if (!body.fields || !body.fields.nombre) errors.push('Falta el nombre');
  if (!body.fields || !body.fields.comentario) errors.push('Falta el comentario');

  if (errors.length > 0) {
    response.writeHead(400, { 'Content-Type': 'text/html' });
    response.end('Datos incompletos o no válidos:\n' + errors.join('\n'));
    return;
  }
  const fecha = new Date();
  body.fields.fecha = `${fecha.getFullYear()}-${fecha.getMonth()+1}-${fecha.getDate()}`


  // Construir el objeto comentario que se guardará
  const comentario = {
    autor: body.fields.user_id,
    nombre: body.fields.nombre,
    puntuacion: parseInt(body.fields.puntuacion, 10) || 0,
    comentario: body.fields.comentario,
    fecha: body.fields.fecha || new Date().toISOString()
  };

  // Asegurar que el producto tenga un array de comentarios y anexar el nuevo comentario
  producto.comentarios = producto.comentarios || [];
  producto.comentarios.push(comentario);

  // Persistir los cambios en data/productos.json
  try {
    const productosPath = path.join(__dirname, 'data', 'productos.json');
    await fs.promises.writeFile(productosPath, JSON.stringify(productos, null, 2), 'utf-8');    
    clearCache(); // Limpiar caché
  } catch (err) {
    console.error('Error al guardar comentario en disco:', err);
    response.writeHead(500, { 'Content-Type': 'text/html' });
    response.end('Error interno al guardar el comentario');
    return;
  }

  console.log('----->comentario guardado:', comentario);
  response.writeHead(302, { 'Location': `/productos/${id}` });
  response.end();
});


// Crear servidor
const servidor = http.createServer(async (request, response) => {
  const { method } = request;
  const parsedUrl = url.parse(request.url, true);
  const { pathname } = parsedUrl;

  try {
    // Intentar servir archivo estático primero
    const archivoServido = await staticServer.serve(request, response);
    if (archivoServido) return;

    // Buscar ruta en el router
    const routeInfo = router.findRoute(method, pathname);
    debugger;
    if (routeInfo) {
      await router.execute(request, response, routeInfo);
    } else {
      // Página 404 (sin contexto de usuario)
      const html = await templates.render('404', {
        titulo: 'Página no encontrada',
        mensaje: `La ruta ${pathname} no existe en este servidor.`,
        user: null,
        isAuthenticated: false,
        isGuest: true
      });
      response.writeHead(404, { 'Content-Type': 'text/html' });
      response.end(html);
    }

  } catch (error) {
    console.error('Error en el servidor:', error);

    // Página de error (sin contexto de usuario)
    const html = await templates.render('error', {
      titulo: 'Error del servidor',
      mensaje: 'Ha ocurrido un error interno. Por favor, inténtalo de nuevo más tarde.',
      error: process.env.NODE_ENV === 'development' ? error.message : '',
      user: null,
      isAuthenticated: false,
      isGuest: true
    });

    response.writeHead(500, { 'Content-Type': 'text/html' });
    response.end(html);
  }
});

// Inicialización
async function iniciarServidor() {
  try {
    // Precargar archivos críticos
    await staticServer.preload(['css/styles.css', 'js/app.js']);

    // Iniciar servidor
    const PUERTO = process.env.PORT || 3000;
    servidor.listen(PUERTO, () => {
      console.log(`🚀 Servidor web completo ejecutándose en http://localhost:${PUERTO}`);
      console.log(`📄 Página principal: http://localhost:${PUERTO}`);
      console.log(`🛍️  Productos: http://localhost:${PUERTO}/productos`);
      console.log(`📡 API: http://localhost:${PUERTO}/api/productos`);
    });

  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando servidor...');
  servidor.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Iniciar servidor
iniciarServidor();