// Aplica el tema (claro/oscuro) antes del primer pintado, para evitar el
// parpadeo de cambiar de tema recién cuando React monta. Misma lógica de
// resolución que src/features/theme/context/ThemeContext.jsx (mantener en
// sync). Vive como archivo propio — no inline — porque la CSP de
// producción es `script-src 'self'` sin unsafe-inline (docs/14).
;(function () {
  try {
    var preferencia = localStorage.getItem('sisga_tema') || 'automatico'
    var prefiereOscuroSO = window.matchMedia('(prefers-color-scheme: dark)').matches
    var esOscuro = preferencia === 'oscuro' || (preferencia === 'automatico' && prefiereOscuroSO)
    document.documentElement.setAttribute('data-tema', esOscuro ? 'oscuro' : 'claro')
  } catch {
    // localStorage puede fallar (modo privado, etc.): se queda con el claro por defecto.
  }
})()
