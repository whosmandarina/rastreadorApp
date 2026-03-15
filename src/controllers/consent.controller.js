const db = require('../config/db');

// Registrar el consentimiento de un usuario
exports.recordConsent = async (req, res) => {
    try {
        const { id_user, ip_address, user_agent } = req.body;

        // Si el usuario autenticado está intentando aceptar el consentimiento por sí mismo, 
        // usamos su propio ID desde el token en caso de que no mande `id_user` explícitamente.
        const userId = id_user || req.user.id;

        await db.query(
            'INSERT INTO Consents (id_user, accepted_at, ip_address, user_agent) VALUES (?, NOW(), ?, ?)',
            [userId, ip_address || req.ip, user_agent || req.headers['user-agent']]
        );

        res.status(201).json({ message: 'Consentimiento registrado exitosamente' });
    } catch (error) {
        console.error('Error al registrar consentimiento:', error);
        res.status(500).json({ message: 'Error al registrar consentimiento' });
    }
};

// Obtener el estado del consentimiento de un usuario
exports.getConsentByUser = async (req, res) => {
    try {
        const { id_user } = req.params;

        // Solo Admin, Supervisor asignado, o el propio usuario deberían ver esto (validación básica)
        if (req.user.rol === 'USER' && req.user.id !== parseInt(id_user)) {
            return res.status(403).json({ message: 'No puedes ver el consentimiento de otro usuario' });
        }

        const [consents] = await db.query(
            'SELECT * FROM Consents WHERE id_user = ? ORDER BY accepted_at DESC LIMIT 1',
            [id_user]
        );

        if (consents.length === 0) {
            return res.status(404).json({ message: 'No se encontraron registros de consentimiento para este usuario', hasConsent: false });
        }

        res.json(consents[0]);
    } catch (error) {
        console.error('Error obteniendo consentimiento:', error);
        res.status(500).json({ message: 'Error al obtener consentimiento' });
    }
};

// Revocar consentimiento explícitamente (En este esquema, simplemente no habría un registro "aceptado", 
// pero podríamos manejarlo eliminando el registro o con un flag. 
// Dado el esquema actual, asumimos que si no hay registro reciente, no hay consentimiento o 
// podemos implementar una lógica de eliminación si es necesario.)
exports.revokeConsent = async (req, res) => {
    try {
        const userId = req.user.id; // El propio usuario lo revoca

        await db.query(
            'DELETE FROM Consents WHERE id_user = ?',
            [userId]
        );

        res.json({ message: 'Consentimiento revocado (eliminado) exitosamente' });
    } catch (error) {
        console.error('Error al revocar consentimiento:', error);
        res.status(500).json({ message: 'Error al revocar consentimiento' });
    }
};
