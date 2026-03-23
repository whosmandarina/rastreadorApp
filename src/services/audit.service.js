const db = require('../config/db');

/**
 * Registra una acción en la tabla de auditoría.
 * No debe bloquear el flujo principal, por lo que se ejecuta y no se espera (fire and forget).
 *
 * @param {object} logData - Datos para el log de auditoría.
 * @param {number} logData.id_user_action - El ID del usuario que realiza la acción.
 * @param {string} logData.action_type - El tipo de acción (ej: 'USER_UPDATE').
 * @param {string} [logData.target_entity] - La entidad afectada (ej: 'Users').
 * @param {number} [logData.target_id] - El ID del registro afectado.
 * @param {string} logData.details - Descripción de la acción.
 */
const logAction = (logData) => {
  // Validar que tenemos los datos mínimos
  if (!logData.action_type || !logData.details) {
    console.error(
      'AUDIT LOG ERROR: Faltan action_type o details para registrar la auditoría.',
    );
    return;
  }

  const { id_user_action, action_type, target_entity, target_id, details } =
    logData;

  db.query(
    'INSERT INTO Audit_Logs (id_user_action, action_type, target_entity, target_id, details) VALUES (?, ?, ?, ?, ?)',
    [
      id_user_action || null,
      action_type,
      target_entity || null,
      target_id || null,
      details,
    ],
  ).catch((err) => {
    // Si la auditoría falla, solo lo mostramos en consola para no detener la aplicación.
    console.error('AUDIT LOG FAILED:', err.message);
  });
};

module.exports = { logAction };
