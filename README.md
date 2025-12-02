### Ejercicio: Extiende el servidor web agregando: 
- sistema de autenticación básico con sesiones, 
- subida de archivos para productos, 
- sistema de comentarios en productos, 
- caché de respuestas API, y 
- métricas de rendimiento del servidor. 
- Implementa también tests básicos usando un framework de testing.

## Puesta en marcha

### Para ejecutar la aplicación:

```bash
node server.js
```

### Para ejecutar los tests:

1.  En el archivo `server.js`, comenta la línea `iniciarServidor();`.
2.  En el mismo archivo, descomenta la línea `module.exports = servidor;`.
3.  Ejecuta el siguiente comando en tu terminal:

```bash
npm test
```
