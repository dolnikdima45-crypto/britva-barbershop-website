const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const moment = require('moment');

const app = express();

app.use(cors());
app.use(express.json());

const dbConfig = process.env.DATABASE_URL ? process.env.DATABASE_URL : {
    host: 'zephyr.proxy.rlwy.net',
    port: 38037,
    user: 'root',
    password: 'phQEGbODbmwaFTwhqJcQgyrvtKRtRiis',
    database: 'railway',
    multipleStatements: true,
    dateStrings: true
};

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
    if (err) {
        console.error('Помилка підключення до БД:', err);
        return;
    }
    console.log('Підключено до MySQL (britva_db)!');
    initDatabase();
});

function initDatabase() {
    const setupScript = `
    CREATE TABLE IF NOT EXISTS \`barbers\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) NOT NULL,
      \`rank\` varchar(100) DEFAULT NULL,
      \`bio\` text DEFAULT NULL,
      \`photo_url\` varchar(255) DEFAULT NULL,
      \`experience\` varchar(50) DEFAULT NULL,
      \`specialization\` varchar(255) DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS \`services\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) NOT NULL,
      \`price\` decimal(10,2) NOT NULL,
      \`duration\` varchar(50) DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`username\` varchar(50) NOT NULL,
      \`password\` varchar(255) NOT NULL,
      \`role\` varchar(10) DEFAULT 'client',
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`username\` (\`username\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS \`appointments\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`client_name\` varchar(255) NOT NULL,
      \`client_phone\` varchar(20) NOT NULL,
      \`barber_id\` int(11) DEFAULT NULL,
      \`appointment_date\` datetime DEFAULT current_timestamp(),
      \`service_id\` int(11) DEFAULT NULL,
      \`client_comment\` text DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

    CREATE TABLE IF NOT EXISTS \`barber_absences\` (
      \`id\` int(11) NOT NULL AUTO_INCREMENT,
      \`barber_id\` int(11) DEFAULT NULL,
      \`start_date\` datetime DEFAULT NULL,
      \`end_date\` datetime DEFAULT NULL,
      \`reason\` varchar(255) DEFAULT NULL,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    db.query(setupScript, (err) => {
        if (err) return;
        
        db.query('SELECT COUNT(*) as count FROM barbers', (err, rows) => {
            if (!err && rows[0].count === 0) {
                const seedScript = `
                INSERT INTO \`barbers\` (\`id\`, \`name\`, \`rank\`, \`bio\`, \`photo_url\`, \`experience\`, \`specialization\`) VALUES
                (1, 'Олександр Степашко', 'Топ-барбер', 'Майстер класичної стрижки та небезпечного гоління. Досвід 7 років.', 'https://i.postimg.cc/D00qGYYN/photo-2026-05-10-20-47-07.jpg', '5 років', 'Експерт з догляду за бородою та класичних стрижок'),
                (2, 'Маркус Тейлор', 'Старший майстер', 'Король фейдів. Робить ідеальні переходи.', 'https://i.postimg.cc/63jZBf5V/photo-2026-05-10-20-47-06.jpg', '3 роки', 'Майстер сучасних технік фейду та Hair Tattoo'),
                (3, 'Микита Феничко', 'Барбер', 'Класичні стрижки та догляд за бородою.', 'https://i.postimg.cc/BvJPDVj8/photo-2026-05-10-20-47-03.jpg', '4 роки', 'Майстер подовжених стрижок та класичного гоління');

                INSERT INTO \`services\` (\`id\`, \`name\`, \`price\`, \`duration\`) VALUES
                (1, 'Чоловіча стрижка', 500.00, '1 год'),
                (2, 'Стрижка бороди', 300.00, '30 хв'),
                (3, 'Комплекс (Стрижка + Борода)', 700.00, '1.5 год'),
                (4, 'Королівське гоління', 400.00, '45 хв');

                INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`role\`) VALUES
                (1, 'admin', '123456789', 'admin'),
                (2, 'Dmytro', '12431243', 'client');
                `;
                
                db.query(seedScript);
            }
        });
    });
}

app.use((req, res, next) => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    db.query('DELETE FROM appointments WHERE appointment_date < ?', [now], (err, result) => {
        if (err) console.error("Помилка автоматичного видалення старих записів:", err);
        next();
    });
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Заповніть усі поля' });
    }

    const query = 'INSERT INTO users (username, password, role) VALUES (?, ?, "client")';
    db.query(query, [username.trim(), password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Користувач з таким логіном вже існує!' });
            }
            return res.status(500).json(err);
        }
        res.json({ message: 'Реєстрація успішна! Тепер ви можете увійти.' });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    const query = 'SELECT id, username, role FROM users WHERE username = ? AND password = ?';
    db.query(query, [username.trim(), password], (err, results) => {
        if (err) return res.status(500).json(err);
        
        if (results.length > 0) {
            res.json({ 
                success: true, 
                user: { 
                    id: results[0].id, 
                    username: results[0].username, 
                    role: results[0].role 
                } 
            });
        } else {
            res.status(401).json({ message: 'Невірний логін або пароль!' });
        }
    });
});

app.get('/api/appointments', (req, res) => {
    const query = `
        SELECT appointments.*, barbers.name as barber_name, services.name as service_name 
        FROM appointments 
        JOIN barbers ON appointments.barber_id = barbers.id
        JOIN services ON appointments.service_id = services.id
        ORDER BY appointment_date DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/appointments', (req, res) => {
    const { client_name, client_phone, barber_id, service_id, appointment_date, client_comment } = req.body;
    
    db.query('SELECT duration FROM services WHERE id = ?', [service_id], (err, sResult) => {
        if (err || sResult.length === 0) return res.status(500).json({ message: 'Послугу не знайдено' });
        
        let durationMinutes = 60;
        if (sResult[0].duration.includes('1.5')) durationMinutes = 90;
        else if (sResult[0].duration.includes('30')) durationMinutes = 30;
        else if (sResult[0].duration.includes('45')) durationMinutes = 45;

        const start = moment(appointment_date);
        const end = moment(appointment_date).add(durationMinutes, 'minutes');

        const absenceQuery = 'SELECT * FROM barber_absences WHERE barber_id = ? AND ? < end_date AND ? > start_date';
        db.query(absenceQuery, [barber_id, end.format('YYYY-MM-DD HH:mm:ss'), start.format('YYYY-MM-DD HH:mm:ss')], (err, absences) => {
            if (absences && absences.length > 0) {
                return res.status(400).json({ message: `Майстер недоступний у цей час (Причина: ${absences[0].reason})` });
            }
            
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

                const isOverlap = existing.some(app => {
                    const exStart = moment(app.appointment_date);
                    let exDur = 60;
                    if (app.duration.includes('1.5')) exDur = 90;
                    else if (app.duration.includes('30')) exDur = 30;
                    const exEnd = moment(app.appointment_date).add(exDur, 'minutes');

                    return (start.isBefore(exEnd) && end.isAfter(exStart));
                });

                if (isOverlap) {
                    return res.status(400).json({ message: 'Цей час у майстра вже зайнятий іншим клієнтом!' });
                }

                const insertQuery = 'INSERT INTO appointments (client_name, client_phone, barber_id, service_id, appointment_date, client_comment) VALUES (?, ?, ?, ?, ?, ?)';
                db.query(insertQuery, [client_name, client_phone, barber_id, service_id, appointment_date, client_comment], (err) => {
                    if (err) return res.status(500).json(err);
                    res.json({ message: 'Запис успішний' });
                });
            });
        });
    });
});

app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM appointments WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Запис успішно видалено" });
    });
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

app.get('/api/absences', (req, res) => {
    const query = 'SELECT ba.*, b.name as barber_name FROM barber_absences ba JOIN barbers b ON ba.barber_id = b.id';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/absences', (req, res) => {
    const { barber_id, start_date, end_date, reason } = req.body;
    const query = 'INSERT INTO barber_absences (barber_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)';
    db.query(query, [barber_id, start_date, end_date, reason], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId });
    });
});

app.delete('/api/absences/:id', (req, res) => {
    db.query('DELETE FROM barber_absences WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: 'Видалено' });
    });
});

app.listen(5000, () => {
    console.log('Бекенд сервер працює на порту 5000');
});