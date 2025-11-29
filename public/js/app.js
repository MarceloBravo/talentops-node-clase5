
function initApp() {

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

        if (response.ok) {
          window.location.href = '/'; 
        } else {
          const data = await response.json();
          alert(data.error || 'Error al iniciar sesión');
        }
      } catch (error) {
        console.error('Error en el login:', error);
        alert('Hubo un problema de conexión. Inténtalo de nuevo.');
      }
    });
  }

  // --- Lógica de Logout (delegated listener) ---
  // Capturing phase listener para asegurar que no se pierda el evento por stopPropagation
  document.addEventListener('click', async function(e) {
    const target = e.target;
    const logoutAnchor = target && (target.closest ? target.closest('#logout-link') : (target.id === 'logout-link' ? target : null));
    if (logoutAnchor) {
      e.preventDefault();
      try {
        const response = await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
        if (response.ok) {
          window.location.replace('/login');
        } else {
          alert('Error al cerrar sesión');
        }
      } catch (error) {
        alert('Hubo un problema de conexión al cerrar sesión.');
      }
    }
  });
  
  // End of logout logic
}

// Ejecutar initApp inmediatamente si el DOM ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}