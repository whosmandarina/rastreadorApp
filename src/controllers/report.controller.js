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
            if (loc.velocidad !== null && loc.velocidad > 0) {
                totalSpeed += loc.velocidad;
                speedCount++;
            }
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
                    if (duracionMinutos >= 3) {
                        paradas.push({ ...posibleParada, duracion_minutos: duracionMinutos });
                    }
                    posibleParada = null;
                }
            }
        }

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

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Se requieren startDate y endDate' });
        }

        const [users] = await db.query('SELECT nombre, correo FROM Users WHERE id_user = ?', [userId]);
        const user = users[0];
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Obtener ubicaciones igual que el Excel
        const [locations] = await db.query(
            'SELECT latitud, longitud, velocidad, bateria, timestamp_captura FROM Locations WHERE id_user = ? AND timestamp_captura BETWEEN ? AND ? ORDER BY timestamp_captura ASC',
            [userId, new Date(startDate), new Date(endDate)]
        );

        // Calcular stats para el resumen
        let totalSpeed = 0, speedCount = 0, paradas = [], posibleParada = null;
        for (const loc of locations) {
            if (loc.velocidad > 0) { totalSpeed += loc.velocidad; speedCount++; }
            if ((loc.velocidad || 0) < 2) {
                if (!posibleParada) posibleParada = { start: loc.timestamp_captura, end: loc.timestamp_captura };
                else posibleParada.end = loc.timestamp_captura;
            } else {
                if (posibleParada) {
                    const dur = (new Date(posibleParada.end) - new Date(posibleParada.start)) / 60000;
                    if (dur >= 3) paradas.push({ ...posibleParada, duracion_minutos: dur.toFixed(1) });
                    posibleParada = null;
                }
            }
        }
        if (posibleParada) {
            const dur = (new Date(posibleParada.end) - new Date(posibleParada.start)) / 60000;
            if (dur >= 3) paradas.push({ ...posibleParada, duracion_minutos: dur.toFixed(1) });
        }
        const velocidadPromedio = speedCount > 0 ? (totalSpeed / speedCount).toFixed(1) : '0.0';
        const tiempoParado = paradas.reduce((a, p) => a + parseFloat(p.duracion_minutos), 0).toFixed(1);

        // ── Construir PDF ──
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Reporte_${user.nombre.replace(/ /g, '_')}.pdf`);
        doc.pipe(res);

        // ── Encabezado ──
        doc.rect(0, 0, doc.page.width, 80).fill('#02182b');
        doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold')
            .text('REPORTE DE ACTIVIDAD', 40, 25, { align: 'center' });
        doc.fillColor('#9dd9d2').fontSize(11)
            .text('Sistema de Rastreo', 40, 50, { align: 'center' });
        doc.moveDown(3);

        // ── Info del usuario ──
        doc.fillColor('#02182b').fontSize(13).font('Helvetica-Bold').text('Información del Usuario');
        doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#daeeed').lineWidth(1).stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').fillColor('#3a5a6e')
            .text(`Nombre:   ${user.nombre}`)
            .text(`Correo:   ${user.correo}`)
            .text(`Período:  ${new Date(startDate).toLocaleString('es-MX')} — ${new Date(endDate).toLocaleString('es-MX')}`);
        doc.moveDown(1.5);

        // ── Resumen estadístico ──
        doc.fillColor('#02182b').fontSize(13).font('Helvetica-Bold').text('Resumen del Período');
        doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#daeeed').lineWidth(1).stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').fillColor('#3a5a6e')
            .text(`Total de puntos registrados:   ${locations.length}`)
            .text(`Velocidad promedio:            ${velocidadPromedio} km/h`)
            .text(`Tiempo total detenido:         ${tiempoParado} minutos`)
            .text(`Paradas detectadas (≥3 min):   ${paradas.length}`);
        doc.moveDown(1.5);

        // ── Paradas ──
        if (paradas.length > 0) {
            doc.fillColor('#02182b').fontSize(13).font('Helvetica-Bold').text('Paradas Detectadas');
            doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#daeeed').lineWidth(1).stroke();
            doc.moveDown(0.5);
            paradas.forEach((p, i) => {
                doc.fontSize(10).font('Helvetica').fillColor('#3a5a6e')
                    .text(`${i + 1}.  Inicio: ${new Date(p.start).toLocaleString('es-MX')}   →   Fin: ${new Date(p.end).toLocaleString('es-MX')}   (${p.duracion_minutos} min)`);
            });
            doc.moveDown(1.5);
        }

        // ── Tabla de ubicaciones ──
        doc.fillColor('#02182b').fontSize(13).font('Helvetica-Bold').text('Historial de Ubicaciones');
        doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#daeeed').lineWidth(1).stroke();
        doc.moveDown(0.5);

        if (locations.length === 0) {
            doc.fontSize(11).font('Helvetica').fillColor('#6b8a9a')
                .text('No se registraron ubicaciones en este período.');
        } else {
            // Encabezados de tabla
            const tableTop = doc.y;
            const colWidths = [140, 80, 85, 80, 70];
            const colX = [40, 180, 260, 345, 425];
            const headers = ['Fecha y Hora', 'Latitud', 'Longitud', 'Velocidad', 'Batería'];

            doc.rect(40, tableTop, doc.page.width - 80, 18).fill('#249a98');
            headers.forEach((h, i) => {
                doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
                    .text(h, colX[i], tableTop + 4, { width: colWidths[i], align: 'left' });
            });
            doc.y = tableTop + 22;

            // Filas — máximo 200 para no exceder el PDF
            const maxRows = Math.min(locations.length, 200);
            for (let i = 0; i < maxRows; i++) {
                const loc = locations[i];
                const rowY = doc.y;
                const bg = i % 2 === 0 ? '#f0f8f8' : '#ffffff';
                doc.rect(40, rowY, doc.page.width - 80, 16).fill(bg);

                const rowData = [
                    new Date(loc.timestamp_captura).toLocaleString('es-MX'),
                    parseFloat(loc.latitud).toFixed(6),
                    parseFloat(loc.longitud).toFixed(6),
                    `${loc.velocidad || 0} km/h`,
                    `${loc.bateria || 'N/A'}%`,
                ];
                rowData.forEach((val, j) => {
                    doc.fillColor('#3a5a6e').fontSize(8).font('Helvetica')
                        .text(val, colX[j], rowY + 3, { width: colWidths[j], align: 'left' });
                });
                doc.y = rowY + 16;

                // Nueva página si se acaba el espacio
                if (doc.y > doc.page.height - 60) {
                    doc.addPage();
                    doc.y = 40;
                }
            }

            if (locations.length > 200) {
                doc.moveDown(0.5);
                doc.fontSize(9).fillColor('#6b8a9a')
                    .text(`* Se muestran los primeros 200 de ${locations.length} registros. Descarga el Excel para el historial completo.`);
            }
        }

        // ── Pie de página ──
        doc.moveDown(2);
        doc.fontSize(9).fillColor('#6b8a9a').font('Helvetica')
            .text(`Generado el ${new Date().toLocaleString('es-MX')} — Sistema de Rastreo`, { align: 'center' });

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