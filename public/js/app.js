document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Aplicación web cargada');

  // Funcionalidad básica del frontend
  const botonesProductos = document.querySelectorAll('.producto-card a');
  
  botonesProductos.forEach(boton => {
    boton.addEventListener('click', function(e) {
      console.log('Navegando a:', this.href);
    });
  });

  // Mostrar mensaje de bienvenida
  if (window.location.pathname === '/') {
    setTimeout(() => {
      console.log('🎉 ¡Bienvenido a Mi Tienda!');
    }, 1000);
  }

  // Lazy loading básico para imágenes (simulado)
  const imagenes = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });

  imagenes.forEach(img => imageObserver.observe(img));

  

    // --- Lógica de Autenticación ---

  

    const loginForm = document.getElementById('login-form');

    if (loginForm) {

      loginForm.addEventListener('submit', async (e) => {

        e.preventDefault();

        

        const username = loginForm.username.value;

        const password = loginForm.password.value;

  

        try {

          const response = await fetch('/api/login', {

            method: 'POST',

            headers: {

              'Content-Type': 'application/json'

            },
            credentials: 'same-origin',
            body: JSON.stringify({ username, password })

          });

  

          const data = await response.json();

  

          if (response.ok) {

            // Guardar usuario en localStorage

            localStorage.setItem('currentUser', JSON.stringify(data.user));

            

            // Redirigir o actualizar UI

            window.location.href = '/'; 

          } else {

            alert(data.error || 'Error al iniciar sesión');

          }

        } catch (error) {

          console.error('Error en el login:', error);

          alert('Hubo un problema de conexión. Inténtalo de nuevo.');

        }

      });

    }

  

    // --- Verificación de Sesión ---

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    const navLogin = document.querySelector('nav a[href="/login"]') || document.getElementById('logout-link');

  

    if (currentUser && navLogin) {

      // Cambiar "Login" por "Logout"

      navLogin.textContent = 'Logout';

      navLogin.href = '#'; // Evitar navegación

      

      // Añadir saludo

      const welcomeMessage = document.createElement('li');

      welcomeMessage.textContent = `Hola, ${currentUser.nombre}`;

      navLogin.parentElement.insertAdjacentElement('beforebegin', welcomeMessage);

  

      

  

            navLogin.addEventListener('click', async (e) => {

  

              e.preventDefault();
              try {
                await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
              } catch (err) {
                console.warn('Logout API falló:', err);
              }

  

              // Limpiar localStorage

  

              localStorage.removeItem('currentUser');

  

              // Redirigir a la página de login

  

              window.location.href = '/login';

  

            });

  

          }

  

      

  

          // --- Lógica para mostrar/ocultar formulario de subida ---

  

          const uploadForm = document.querySelector('.upload-form');

  

          if (uploadForm && currentUser) {

  

              uploadForm.style.display = 'block';

  

          } else if (uploadForm) {

  

              uploadForm.style.display = 'none';

  

          }

  

      });

  

      

  