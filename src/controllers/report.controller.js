const db = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const geolib = require('geolib');

// Obtener ruta (puntos de ubicación) en un rango de fechas
exports.getRoute = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Se requieren startDate y endDate' });
        }

        const [locations] = await db.query(
            'SELECT * FROM Locations WHERE id_user = ? AND timestamp_captura BETWEEN ? AND ? ORDER BY timestamp_captura ASC',
            [userId, new Date(startDate), new Date(endDate)]
        );

        res.json(locations);
    } catch (error) {
        console.error('Error obteniendo ruta:', error);
        res.status(500).json({ message: 'Error al obtener la ruta' });
    }
};

// Obtener estadísticas (Velocidad promedio, tiempos de parada)
exports.getStats = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Se requieren startDate y endDate' });
        }

        const [locations] = await db.query(
            'SELECT latitud, longitud, velocidad, timestamp_captura FROM Locations WHERE id_user = ? AND timestamp_captura BETWEEN ? AND ? ORDER BY timestamp_captura ASC',
            [userId, new Date(startDate), new Date(endDate)]
        );

        if (locations.length === 0) {
            return res.json({ velocidad_promedio: 0, paradas: [], tiempo_total_parado_minutos: 0 });
        }

        let totalSpeed = 0;
        let speedCount = 0;
        let paradas = [];
        let posibleParada = null;

        for (let i = 0; i < locations.length; i++) {
            const loc = locations[i];
            
            // Promedio de velocidad
            if (loc.velocidad !== null && loc.velocidad > 0) {
                totalSpeed += loc.velocidad;
                speedCount++;
            }

            // Lógica simple para detectar paradas: Velocidad < 2 km/h o distancia entre puntos muy corta durante un tiempo prolongado
            // Aquí simplificaremos asumiendo que si la velocidad reportada es < 2, está parado.
            const vel = loc.velocidad || 0;
            if (vel < 2) {
                if (!posibleParada) {
                    posibleParada = { start: loc.timestamp_captura, end: loc.timestamp_captura, lat: loc.latitud, lng: loc.longitud };
                } else {
                    posibleParada.end = loc.timestamp_captura;
                }
            } else {
                if (posibleParada) {
                    const duracionMinutos = (new Date(posibleParada.end) - new Date(posibleParada.start)) / 1000 / 60;
                    if (duracionMinutos >= 3) { // Consideramos parada si estuvo más de 3 minutos
                        paradas.push({ ...posibleParada, duracion_minutos: duracionMinutos });
                    }
                    posibleParada = null;
                }
            }
        }

        // Si terminó el periodo y seguía parado
        if (posibleParada) {
            const duracionMinutos = (new Date(posibleParada.end) - new Date(posibleParada.start)) / 1000 / 60;
            if (duracionMinutos >= 3) {
                paradas.push({ ...posibleParada, duracion_minutos: duracionMinutos });
            }
        }

        const velocidad_promedio = speedCount > 0 ? (totalSpeed / speedCount) : 0;
        const tiempo_total_parado = paradas.reduce((acc, p) => acc + p.duracion_minutos, 0);

        res.json({
            velocidad_promedio: velocidad_promedio.toFixed(2),
            tiempo_total_parado_minutos: tiempo_total_parado.toFixed(2),
            paradas
        });

    } catch (error) {
        console.error('Error calculando stats:', error);
        res.status(500).json({ message: 'Error al calcular estadísticas' });
    }
};

// Exportar PDF
exports.exportPDF = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        // Obtener info básica del usuario para el reporte
        const [users] = await db.query('SELECT nombre, correo FROM Users WHERE id_user = ?', [userId]);
        const user = users[0];

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const doc = new PDFDocument();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Reporte_${user.nombre.replace(/ /g, '_')}.pdf`);
        
        doc.pipe(res);

        doc.fontSize(20).text(`Reporte de Actividad: ${user.nombre}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Correo: ${user.correo}`);
        doc.text(`Periodo: ${new Date(startDate).toLocaleString()} al ${new Date(endDate).toLocaleString()}`);
        doc.moveDown();
        
        doc.text('Este es un reporte generado automáticamente por el sistema de rastreo.', { align: 'justify' });
        // Aquí se podrían añadir tablas con las alertas o resúmenes de paradas.
        // Para simplificar, finalizamos el documento.
        
        doc.end();

    } catch (error) {
        console.error('Error generando PDF:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Error generando PDF' });
    }
};

// Exportar Excel
exports.exportExcel = async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        const [locations] = await db.query(
            'SELECT latitud, longitud, velocidad, bateria, timestamp_captura FROM Locations WHERE id_user = ? AND timestamp_captura BETWEEN ? AND ? ORDER BY timestamp_captura ASC',
            [userId, new Date(startDate), new Date(endDate)]
        );

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Ruta Recorrida');

        sheet.columns = [
            { header: 'Fecha y Hora', key: 'timestamp', width: 25 },
            { header: 'Latitud', key: 'lat', width: 15 },
            { header: 'Longitud', key: 'lng', width: 15 },
            { header: 'Velocidad (km/h)', key: 'vel', width: 18 },
            { header: 'Batería (%)', key: 'bat', width: 15 },
        ];

        locations.forEach(loc => {
            sheet.addRow({
                timestamp: new Date(loc.timestamp_captura).toLocaleString(),
                lat: loc.latitud,
                lng: loc.longitud,
                vel: loc.velocidad || 0,
                bat: loc.bateria || 'N/A'
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Ruta_${userId}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generando Excel:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Error generando Excel' });
    }
};
