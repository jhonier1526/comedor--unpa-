// src/notificacion.js
// pide permiso para enviar notificaciones y envía una notificación si el permiso es concedido

export async function pedirPermiso() {
  if (!('Notification' in window)) return false;
  const permiso = await Notification.requestPermission();
  return permiso === 'granted';
}

export function enviarNotificacion(titulo, mensaje, icono = '/vite.svg') {
  if (Notification.permission !== 'granted') return;
  new Notification(titulo, {
    body: mensaje,
    icon: icono,
    badge: icono,
    vibrate: [200, 100, 200],
  });
}