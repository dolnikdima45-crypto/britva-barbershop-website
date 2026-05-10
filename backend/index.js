const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const moment = require('moment');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'britva_db'
});

db.connect(err => {
    if (err) console.error('Помилка БД: ' + err.message);
    else console.log('Підключено до MySQL!');
});

app.get('/api/barbers', (req, res) => {
    db.query('SELECT * FROM barbers', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/api/services', (req, res) => {
    db.query('SELECT * FROM services', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/appointments', (req, res) => {
    const { client_name, client_phone, barber_id, service_id, appointment_date, client_comment } = req.body;

    db.query('SELECT duration FROM services WHERE id = ?', [service_id], (err, sResult) => {
        if (err || sResult.length === 0) return res.status(500).json({message: "Послугу не знайдено"});
        
        let durationMinutes = 60;
        const dStr = sResult[0].duration;
        if (dStr.includes('1.5')) durationMinutes = 90;
        else if (dStr.includes('30')) durationMinutes = 30;
        else if (dStr.includes('45')) durationMinutes = 45;

        const start = moment(appointment_date);
        const end = moment(appointment_date).add(durationMinutes, 'minutes');

        const checkQuery = `
            SELECT a.appointment_date, s.duration 
            FROM appointments a
            JOIN services s ON a.service_id = s.id
            WHERE a.barber_id = ? 
            AND a.appointment_date >= DATE_SUB(?, INTERVAL 2 HOUR) 
            AND a.appointment_date <= DATE_ADD(?, INTERVAL 2 HOUR)
        `;

        db.query(checkQuery, [barber_id, appointment_date, appointment_date], (err, existing) => {
            if (err) return res.status(500).json(err);

         
            const absenceQuery = 'SELECT * FROM barber_absences WHERE barber_id = ? AND ? < end_date AND ? > start_date';
            db.query(absenceQuery, [barber_id, end.format('YYYY-MM-DD HH:mm:ss'), start.format('YYYY-MM-DD HH:mm:ss')], (err, absences) => {
            if (absences.length > 0) {
            return res.status(400).json({ message: `Майстер недоступний у цей час (Причина: ${absences[0].reason})` });
    }
    
    
});
            const isOverlap = existing.some(app => {
                const exStart = moment(app.appointment_date);
                let exDur = 60;
                if (app.duration.includes('1.5')) exDur = 90;
                else if (app.duration.includes('30')) exDur = 30;
                const exEnd = moment(app.appointment_date).add(exDur, 'minutes');

                return (start.isBefore(exEnd) && end.isAfter(exStart));
            });

            if (isOverlap) {
                return res.status(400).json({ message: "Цей час уже зайнятий майстром!" });
            }

            const query = 'INSERT INTO appointments (client_name, client_phone, barber_id, service_id, appointment_date, client_comment) VALUES (?, ?, ?, ?, ?, ?)';
            db.query(query, [client_name, client_phone, barber_id, service_id, appointment_date, client_comment], (err, result) => {
                if (err) return res.status(500).json(err);
                res.json({ message: 'Записано!', id: result.insertId });
            });
        });
    });
});

app.get('/api/appointments', (req, res) => {
    const query = `
        SELECT appointments.*, barbers.name as barber_name, services.name as service_name 
        FROM appointments 
        JOIN barbers ON appointments.barber_id = barbers.id
        LEFT JOIN services ON appointments.service_id = services.id
        ORDER BY appointment_date ASC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.delete('/api/absences/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM barber_absences WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }
        res.json({ message: 'Видалено успішно' });
    });
});
// Отримати всі періоди відсутності
app.get('/api/absences', (req, res) => {
    const query = `
        SELECT barber_absences.*, barbers.name as barber_name 
        FROM barber_absences 
        JOIN barbers ON barber_absences.barber_id = barbers.id
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Додати нову відсутність
app.post('/api/absences', (req, res) => {
    const { barber_id, start_date, end_date, reason } = req.body;
    const query = 'INSERT INTO barber_absences (barber_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)';
    db.query(query, [barber_id, start_date, end_date, reason], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Відсутність додана', id: result.insertId });
    });
});

// Видалити відсутність
app.delete('/api/absences/:id', (req, res) => {
    db.query('DELETE FROM barber_absences WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Видалено' });
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Бекенд на http://localhost:${PORT}`));
