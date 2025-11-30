// test/unit/router.test.js

const Router = require('../../router');

describe('Unit Tests for Router', () => {
  let router;

  // Antes de cada prueba, creamos una nueva instancia del router
  // para asegurar que las pruebas estén aisladas entre sí.
  beforeEach(() => {
    router = new Router();
  });

  it('should instantiate a new router correctly', () => {
    expect(router.routes).toEqual({});
    expect(router.middlewares).toEqual([]);
  });

  describe('Route Registration', () => {
    it('should register a new GET route correctly', () => {
      const handler = () => {};
      router.get('/test', handler);

      expect(router.routes['GET']).toHaveLength(1);
      const route = router.routes['GET'][0];
      expect(route.originalPath).toBe('/test');
      expect(route.handlers).toContain(handler);
      expect(route.regex).toEqual(/^\/test$/);
    });

    it('should register a new POST route correctly', () => {
        const handler = () => {};
        router.post('/submit', handler);
  
        expect(router.routes['POST']).toHaveLength(1);
        const route = router.routes['POST'][0];
        expect(route.originalPath).toBe('/submit');
        expect(route.handlers).toContain(handler);
    });

    it('should convert a parameterized path to a regex', () => {
      router.get('/users/:id/posts/:postId', () => {});
      const route = router.routes['GET'][0];

      expect(route.regex).toEqual(/^\/users\/([^/]+)\/posts\/([^/]+)$/);
      expect(route.paramNames).toEqual(['id', 'postId']);
    });
  });

  describe('Route Finding', () => {
    it('should find a simple, non-parameterized route', () => {
      router.get('/', () => {});
      const routeInfo = router.findRoute('GET', '/');

      expect(routeInfo).not.toBeNull();
      expect(routeInfo.route.originalPath).toBe('/');
      expect(routeInfo.params).toEqual({});
    });

    it('should return null if method does not match', () => {
        router.get('/', () => {});
        const routeInfo = router.findRoute('POST', '/');
        expect(routeInfo).toBeNull();
    });

    it('should return null if path does not match', () => {
        router.get('/', () => {});
        const routeInfo = router.findRoute('GET', '/non-existent');
        expect(routeInfo).toBeNull();
    });

    it('should find a parameterized route and extract parameters', () => {
        router.get('/products/:id', () => {});
        const routeInfo = router.findRoute('GET', '/products/123');

        expect(routeInfo).not.toBeNull();
        expect(routeInfo.route.originalPath).toBe('/products/:id');
        expect(routeInfo.params).toEqual({ id: '123' });
    });

    it('should find a route with multiple parameters', () => {
        router.get('/users/:userId/orders/:orderId', () => {});
        const routeInfo = router.findRoute('GET', '/users/abc/orders/456');

        expect(routeInfo).not.toBeNull();
        expect(routeInfo.params).toEqual({ userId: 'abc', orderId: '456' });
    });

    it('should not match a route with missing parameters', () => {
        router.get('/users/:id/posts', () => {});
        const routeInfo = router.findRoute('GET', '/users/');
        expect(routeInfo).toBeNull();
    });
  });

  describe('Middleware', () => {
    it('should register a global middleware correctly', () => {
        const middleware = (context) => {};
        router.use(middleware);
        expect(router.middlewares).toHaveLength(1);
        expect(router.middlewares).toContain(middleware);
    });
  });

});
