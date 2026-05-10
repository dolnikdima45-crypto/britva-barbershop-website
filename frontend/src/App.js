import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home'); // Стан для вкладок: 'home' або 'booking'
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [view, setView] = useState('client'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '+380', comment: '' });

  const [absences, setAbsences] = useState([]);
  const [newAbsence, setNewAbsence] = useState({ barber_id: '', start_date: '', end_date: '', reason: '' });


useEffect(() => {
  
    axios.get('http://localhost:5000/api/absences').then(res => setAbsences(res.data));
}, [view]);

// Функція для додавання відсутності
const handleAddAbsence = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/absences', newAbsence)
        .then(() => {
            alert("Статус майстра оновлено");
            axios.get('http://localhost:5000/api/absences').then(res => setAbsences(res.data));
        });
};
// Функція для видалення відсутності
const handleDeleteAbsence = (id) => {
    axios.delete(`http://localhost:5000/api/absences/${id}`)
        .then(() => {
            setAbsences(prev => prev.filter(abs => abs.id !== id));
        })
        .catch(err => {
            console.error(err);
            alert("Помилка при видаленні. Перевірте, чи запущено сервер!");
        });
};
  useEffect(() => {
    axios.get('http://localhost:5000/api/barbers').then(res => setBarbers(res.data));
    axios.get('http://localhost:5000/api/services').then(res => setServices(res.data));
    axios.get('http://localhost:5000/api/appointments').then(res => setAppointments(res.data));
  }, [view]);

  const fetchAppointments = () => {
    axios.get('http://localhost:5000/api/appointments').then(res => setAppointments(res.data));
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    const filteredName = val.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s]/g, '');
    setFormData({ ...formData, name: filteredName });
  };

  const handlePhoneChange = (e) => {
    const input = e.target.value;
    if (!input.startsWith('+380')) return;
    const digits = input.slice(4).replace(/\D/g, '');
    if (digits.length <= 9) setFormData({ ...formData, phone: '+380' + digits });
  };

  const handleBooking = (e) => {
    e.preventDefault();
    
    // 1. Отримуємо об'єкт обраної послуги, щоб знати її тривалість
    const service = services.find(s => s.id === parseInt(selectedService));
    if (!service) return;

    // Визначаємо тривалість у хвилинах
    let durationMinutes = 60;
    if (service.duration.includes('1.5')) durationMinutes = 90;
    else if (service.duration.includes('30')) durationMinutes = 30;
    else if (service.duration.includes('45')) durationMinutes = 45;

    const startTime = new Date(selectedDate);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
    
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    const endMinutes = endTime.getMinutes();

    // 2. ПЕРЕВІРКА: чи в межах робочого графіка (09:00 - 17:00)
    if (startHour < 9) {
      alert("Ми відкриваємось о 09:00. Оберіть інший час.");
      return;
    }

    // Перевіряємо, чи не виходить час завершення за 17:00
    if (endHour > 17 || (endHour === 17 && endMinutes > 0)) {
      alert(`Ця послуга триває ${service.duration}. Майстер не встигне закінчити до закриття (17:00). Оберіть час раніше.`);
      return;
    }

    if (formData.name.trim().length < 2) {
      alert("Будь ласка, введіть коректне ім'я");
      return;
    }

    // 3. Відправка запиту на бекенд (якщо перевірки пройдені)
    axios.post('http://localhost:5000/api/appointments', {
      client_name: formData.name,
      client_phone: formData.phone,
      barber_id: selectedBarber.id,
      service_id: selectedService,
      appointment_date: selectedDate,
      client_comment: formData.comment
    })
    .then(() => {
      alert("Ви успішно записані!");
      setSelectedBarber(null);
      setFormData({ name: '', phone: '+380', comment: '' });
      fetchAppointments();
    })
    .catch(err => alert(err.response?.data?.message || "Помилка"));
  };

  return (
    <div className="App">
      {/* ВЕРХНЯ НАВІГАЦІЯ */}
      <header className="navbar">
        <div className="logo">BRITVA</div>
        <nav className="nav-links">
          <button className={activeTab === 'home' ? 'active' : ''} onClick={() => {setActiveTab('home'); setView('client')}}>Головна</button>
          <button className={activeTab === 'booking' ? 'active' : ''} onClick={() => {setActiveTab('booking'); setView('client')}}>Записатись</button>
        </nav>
        <button className="admin-btn" onClick={() => {
          if (isAuthenticated) setView(view === 'admin' ? 'client' : 'admin');
          else setView('login');
        }}>
          {view === 'admin' ? 'Вийти з адмінки' : 'Admin'}
        </button>
      </header>

      {/* ВКЛАДКА: ГОЛОВНА */}
      {activeTab === 'home' && view === 'client' && (
        <div className="home-page">
          <section className="hero-section">
            <h1>БІЛЬШЕ НІЖ ПРОСТО СТРИЖКА</h1>
            <p>Ми створюємо стиль з 2018 року</p>
            <button className="book-btn-hero" onClick={() => setActiveTab('booking')}>Забронювати візит</button>
          </section>

          <section className="info-grid">
            <div className="info-card">
              <h3>Наша Адреса</h3>
              <p>м. Полтава, вул. Велика Тирнівська, 42</p>
              <p>Поблизу Торгівельний центр "Київ"</p>
            </div>
            <div className="info-card">
              <h3>Графік роботи</h3>
              <p>Щодня: 09:00 — 17:00</p>
              <p>Без вихідних та перерв</p>
            </div>
            <div className="info-card">
              <h3>Контакти</h3>
              <p>+38 (044) 123-45-67</p>
              <p>britva.barber@gmail.com</p>
            </div>
          </section>

          <section className="about-section">
            <h2>Про BRITVA BARBERSHOP</h2>
            <div className="about-content">
              <p>Ми відкрили свої двері 14 жовтня 2018 року. Починаючи з двох крісел, ми виросли в провідний простір чоловічого стилю. Наша філософія — це увага до деталей та повага до традицій класичного гоління.</p>
              <div className="facts-list">
                <div className="fact-item"><strong>15,000+</strong> задоволених клієнтів</div>
                <div className="fact-item"><strong>100%</strong> стерильність інструментів</div>
                <div className="fact-item"><strong>Краща кава</strong> та міцні напої для гостей</div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ВКЛАДКА: ЗАПИСАТИСЬ */}
      {activeTab === 'booking' && view === 'client' && (
        <div className="booking-page">
          <h1 className="main-title">Оберіть свого майстра</h1>
          <div className="barber-container">
            {barbers.map(barber => (
              <div key={barber.id} className="barber-card">
                <img src={barber.photo_url} alt={barber.name} />
                <div className="exp-badge">{barber.experience}</div>
                <h3>{barber.name}</h3>
                <p className="rank-text">{barber.rank}</p>
                <p className="spec-text">{barber.specialization}</p>
                <button className="book-btn" onClick={() => setSelectedBarber(barber)}>Обрати</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО */}
      {selectedBarber && (
        <div className="modal">
          <div className="modal-content booking-modal">
            <div className="booking-flex">
              <div className="booking-form-side">
                <h2>Запис до: {selectedBarber.name}</h2>
                <form onSubmit={handleBooking}>
                  <input type="text" placeholder="Ваше ім'я" required value={formData.name} onChange={handleNameChange} />
                  <input type="text" placeholder="Телефон" required value={formData.phone} onChange={handlePhoneChange} />
                  <select required className="service-select" onChange={(e) => setSelectedService(e.target.value)}>
                    <option value="">Оберіть послугу</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration})</option>)}
                  </select>
                  <label className="input-label">Дата та час:</label>
                  <input type="datetime-local" required className="date-input" min={new Date().toISOString().slice(0, 16)} onChange={(e) => setSelectedDate(e.target.value)} />
                  <textarea placeholder="Побажання..." className="comment-textarea" value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})}></textarea>
                  <button type="submit" className="confirm-btn">Підтвердити</button>
                  <button type="button" className="cancel-btn" onClick={() => setSelectedBarber(null)}>Закрити</button>
                </form>
              </div>
              <div className="busy-times-side">
                <h3>Зайнято:</h3>
                <div className="times-list">
                  {appointments.filter(app => app.barber_id === selectedBarber.id && new Date(app.appointment_date) > new Date()).map(app => (
                    <div key={app.id} className="busy-slot">{new Date(app.appointment_date).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* АДМІНКА */}
      {view === 'login' && (
  <div className="login-container">
    <div className="modal-content">
      <h2>Вхід до панелі керування</h2>
      <form onSubmit={(e) => { 
        e.preventDefault(); 
        if (passwordInput === '123456789') {
          setIsAuthenticated(true); 
          setView('admin');
          setPasswordInput(''); 
        } else {
          alert("Помилка доступу: Невірний пароль адміністратора!"); 
          setPasswordInput(''); 
        } 
      }}>
        <input 
          type="password" 
          placeholder="Введіть пароль" 
          value={passwordInput} 
          onChange={e => setPasswordInput(e.target.value)} 
          required
        />
        <button type="submit" className="confirm-btn">Увійти</button>
        <button type="button" className="cancel-btn" onClick={() => setView('client')}>Скасувати</button>
      </form>
    </div>
  </div>
)}
      {view === 'admin' && isAuthenticated && (
    <div className="admin-panel">
        {/* Існуюча таблиця записів... */}
        
        <h2 style={{marginTop: '40px'}}>Керування графіком майстрів</h2>
        <div className="absence-manager">
            <form onSubmit={handleAddAbsence} className="absence-form">
                <select required onChange={e => setNewAbsence({...newAbsence, barber_id: e.target.value})}>
                    <option value="">Оберіть майстра</option>
                    {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input type="datetime-local" required onChange={e => setNewAbsence({...newAbsence, start_date: e.target.value})} />
                <input type="datetime-local" required onChange={e => setNewAbsence({...newAbsence, end_date: e.target.value})} />
                <input type="text" placeholder="Причина (відпустка, лікарняний)" onChange={e => setNewAbsence({...newAbsence, reason: e.target.value})} />
                <button type="submit">Додати неробочий час</button>
            </form>

            <table className="admin-table">
                <thead>
                    <tr><th>Майстер</th><th>Початок</th><th>Кінець</th><th>Причина</th><th>Дія</th></tr>
                </thead>
                <tbody>
                    {absences.map(abs => (
                        <tr key={abs.id}>
                            <td>{abs.barber_name}</td>
                            <td>{new Date(abs.start_date).toLocaleString()}</td>
                            <td>{new Date(abs.end_date).toLocaleString()}</td>
                            <td>{abs.reason}</td>
                            <td><button className="delete-btn-table" onClick={() => handleDeleteAbsence(abs.id)}> Видалити </button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)}
    </div>
  );
}

export default App;