// src/notificacion.js
// pide permiso para enviar notificaciones y envía una notificación si el permiso es concedido

export async function pedirPermiso() {
  // ✅ Seguro para iPhone: cubre el caso en que Notification no existe
  // en absoluto (typeof) y el caso en que existe como propiedad pero
  // no es funcional (in window) — Safari/iOS varía según el contexto.
  if (typeof Notification === 'undefined') return false;
  if (!('Notification' in window)) return false;

  const permiso = await Notification.requestPermission();
  return permiso === 'granted';
}

export function enviarNotificacion(titulo, mensaje, icono = '/vite.svg') {
  if (typeof Notification === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  new Notification(titulo, {
    body: mensaje,
    icon: icono,
    badge: icono,
    vibrate: [200, 100, 200],
  });
}