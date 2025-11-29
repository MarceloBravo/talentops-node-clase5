console.log('📦 /static/js/app.js cargado');

function initApp() {
  console.log('🚀 Aplicación web cargada');

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

  // --- Lógica de Logout robusta (delegación de eventos) ---
  // Comprobar si el anchor de logout está presente en el DOM
  const logoutAnchor = document.getElementById('logout-link');
  console.log('🔎 logout-link presente:', !!logoutAnchor, logoutAnchor);

  // Si existe el anchor directamente, adjuntar un listener local como respaldo
  if (logoutAnchor) {
    logoutAnchor.addEventListener('click', async function(e) {
      e.preventDefault();
      console.log('🔔 logoutLink handler fired (direct listener)');
      try {
        const response = await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
        if (response.ok) {
          window.location.replace('/login');
        } else {
          alert('Error al cerrar sesión');
        }
      } catch (error) {
        console.error('Error en el logout (direct listener):', error);
      }
    });
  }
  // Registrar información útil por si un overlay o estilo bloquea el click
  function logLogoutState() {
    const a = document.getElementById('logout-link');
    if (!a) return console.log('🔍 logLogoutState: no existe logout-link');
    const rect = a.getBoundingClientRect();
    const style = window.getComputedStyle(a);
    console.log('🔍 logLogoutState: rect=', rect, 'pointer-events=', style.pointerEvents, 'display=', style.display, 'visibility=', style.visibility, 'opacity=', style.opacity);
    const elAtPoint = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    console.log('🔍 Element at logout center:', elAtPoint);
  }
  logLogoutState();
  // Capturing phase listener para asegurar que no se pierda el evento por stopPropagation
  document.addEventListener('click', async function(e) {
    const target = e.target;
    console.log('📌 Click detectado en:', target && (target.id || target.tagName || target.className));
    const logoutAnchor = target && (target.closest ? target.closest('#logout-link') : (target.id === 'logout-link' ? target : null));
    if (logoutAnchor) {
      e.preventDefault();
      console.log('🔔 logoutLink handler fired (delegated listener)');
      try {
        const response = await fetch('/api/logout', { method: 'POST' });
        if (response.ok) {
          window.location.replace('/login');
        } else {
          alert('Error al cerrar sesión');
        }
      } catch (error) {
        console.error('Error en el logout:', error);
        alert('Hubo un problema de conexión al cerrar sesión.');
      }
    }
  });
  // Agregar también listener en fase captura para probar
  document.addEventListener('click', function(e) {
    const logoutAnchorCapture = e.target && (e.target.closest ? e.target.closest('#logout-link') : null);
    if (logoutAnchorCapture) {
      console.log('🔍 Capturing phase: logout clicked', e.eventPhase);
    }
  }, true);

  // Agregar listeners pointer/mousedown para identificar si existe algún overlay que captura el click
  document.addEventListener('pointerdown', function(e) {
    console.log('🖱️ pointerdown event: target=', e.target, 'coords=', e.clientX, e.clientY);
    const capture = e.target && (e.target.closest ? e.target.closest('#logout-link') : null);
    if (capture) console.log('✋ pointerdown en logout', e);
  }, true);
  document.addEventListener('mousedown', function(e) {
    console.log('🖲️ mousedown event: target=', e.target, 'coords=', e.clientX, e.clientY);
    const capture = e.target && (e.target.closest ? e.target.closest('#logout-link') : null);
    if (capture) console.log('✋ mousedown en logout', e);
  }, true);

  // Observador de mutaciones para detectar si el logout-link se añade dinámicamente
  const mo = new MutationObserver((mutationsList) => {
    for (const m of mutationsList) {
      if (m.type === 'childList' || m.type === 'subtree') {
        const found = document.getElementById('logout-link');
        if (found) {
          console.log('🛰️ MutationObserver: logout-link añadido dinámicamente', found);
          try { logLogoutState(); } catch (err) { console.error('⚠️ Error in logLogoutState', err); }
          // Attach direct listener if not present
          if (!found.__logoutHandlerAttached) {
            found.__logoutHandlerAttached = true;
            found.addEventListener('click', async function(e) {
              e.preventDefault();
              console.log('🔔 logoutLink handler fired (direct listener - from mutation observer)');
              try {
                const response = await fetch('/api/logout', { method: 'POST' });
                if (response.ok) {
                  window.location.replace('/login');
                } else { alert('Error al cerrar sesión'); }
              } catch (error) { console.error('Error en logout (mutation observer):', error); }
            });
          }
        }
      }
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

// Ejecutar initApp inmediatamente si el DOM ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}