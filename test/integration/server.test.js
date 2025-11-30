// test/integration/server.test.js

/*
// En server.js, se debe modificar el final del archivo para que exporte el servidor
// en lugar de iniciarlo directamente.

// COMENTAR ESTA LÍNEA AL FINAL DEL ARCHIVO server.js:
iniciarServidor();

// DESCOMENTAR ESTA LÍNEA AL FINAL DEL ARCHIVO server.js:
module.exports = servidor;
*/


const request = require('supertest');
// La siguiente línea dará error hasta que se modifique server.js
const server = require('../../server');

describe('Integration Tests for the Server', () => {

  describe('GET /', () => {
    it('should return 200 OK with HTML content', async () => {
      const response = await request(server).get('/');
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('Bienvenido a Mi Tienda');
    });
  });

  describe('GET /api/productos', () => {
    it('should return 200 OK with JSON content', async () => {
      const response = await request(server).get('/api/productos');
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return an object with a "productos" array', async () => {
        const response = await request(server).get('/api/productos');
        const body = response.body;
        expect(body).toHaveProperty('productos');
        expect(Array.isArray(body.productos)).toBe(true);
      });
  });

  describe('GET /a-route-that-does-not-exist', () => {
    it('should return 404 Not Found', async () => {
      const response = await request(server).get('/a-route-that-does-not-exist');
      expect(response.statusCode).toBe(404);
      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('Página no encontrada');
    });
  });

});
