// routes/brigada.js
const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');

// -------------------------
// POST /brigada
// -------------------------
router.post('/brigada', async (req, res) => {
    const {
        nombre,
        cantidadactivos,
        celularcomandante,
        encargadologistica,
        celularlogistica,
        numerosemergencia,
        epp_ropa,
        botas,
        guantes,
        epp_equipo,
        herramientas,
        logistica_repuestos,
        alimentacion,
        logistica_campo,
        limpieza_personal,
        limpieza_general,
        medicamentos,
        rescate_animal
    } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('nombre', nombre)
            .input('cantidadactivos', cantidadactivos)
            .input('celularcomandante', celularcomandante)
            .input('encargadologistica', encargadologistica)
            .input('celularlogistica', celularlogistica)
            .input('numerosemergencia', numerosemergencia)
            .query(`
        INSERT INTO brigada (nombre, cantidadactivos, celularcomandante, encargadologistica, celularlogistica, numerosemergencia)
        OUTPUT INSERTED.id
        VALUES (@nombre, @cantidadactivos, @celularcomandante, @encargadologistica, @celularlogistica, @numerosemergencia)
      `);

        const brigadaId = result.recordset[0].id;

        const insertItems = async (tabla, items, campos) => {
            for (const item of items) {
                const req = pool.request().input('brigadaid', brigadaId);
                campos.forEach(campo => req.input(campo, item[campo] ?? null));
                await req.query(`
          INSERT INTO ${tabla} (brigadaid, ${campos.join(', ')})
          VALUES (@brigadaid, ${campos.map(c => `@${c}`).join(', ')})
        `);
            }
        };

        if (epp_ropa?.length) await insertItems('epp_ropa', epp_ropa, ['item', 'xs', 's', 'm', 'l', 'xl', 'observaciones']);
        if (botas?.length) await insertItems('botas', botas, ['talla37', 'talla38', 'talla39', 'talla40', 'talla41', 'talla42', 'talla43', 'otratalla']);
        if (guantes?.length) await insertItems('guantes', guantes, ['xs', 's', 'm', 'l', 'xl', 'xxl', 'otratalla']);
        if (epp_equipo?.length) await insertItems('epp_equipo', epp_equipo, ['item', 'cantidad', 'observaciones']);
        if (herramientas?.length) await insertItems('herramientas', herramientas, ['item', 'cantidad', 'observaciones']);
        if (logistica_repuestos?.length) await insertItems('logistica_repuestos', logistica_repuestos, ['item', 'costo', 'observaciones']);
        if (alimentacion?.length) await insertItems('alimentacion', alimentacion, ['item', 'cantidad', 'observaciones']);
        if (logistica_campo?.length) await insertItems('logistica_campo', logistica_campo, ['item', 'cantidad', 'observaciones']);
        if (limpieza_personal?.length) await insertItems('limpieza_personal', limpieza_personal, ['item', 'cantidad', 'observaciones']);
        if (limpieza_general?.length) await insertItems('limpieza_general', limpieza_general, ['item', 'cantidad', 'observaciones']);
        if (medicamentos?.length) await insertItems('medicamentos', medicamentos, ['item', 'cantidad', 'observaciones']);
        if (rescate_animal?.length) await insertItems('rescate_animal', rescate_animal, ['item', 'cantidad', 'observaciones']);

        res.status(201).json({ message: 'Brigada y datos registrados correctamente', brigadaId });
    } catch (error) {
        console.error('❌ Error al registrar brigada:', error);
        res.status(500).json({ error: 'Error al guardar los datos' });
    }
});

// -------------------------
// GET /brigada/get
// -------------------------
router.get('/brigadacoso', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM brigada');
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error('❌ Error al obtener brigadas:', err);
        res.status(500).json({ error: 'Error al obtener las brigadas' });
    }
});

module.exports = router;
