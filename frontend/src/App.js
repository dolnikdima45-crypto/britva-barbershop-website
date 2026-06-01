import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // Навігація та вкладки
  const [activeTab, setActiveTab] = useState('home'); // 'home' або 'booking'
  const [view, setView] = useState('client'); // 'client', 'auth', 'admin'
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Дані з БД
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [absences, setAbsences] = useState([]);

  // Дані поточної сесії користувача
  const [currentUser, setCurrentUser] = useState(null); 
  const [authLogin, setAuthLogin] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  
  // Стан бронювання візиту
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '+380', comment: '' });

  // Стан адмін-панелі для блокування
  const [newAbsence, setNewAbsence] = useState({ barber_id: '', start_date: '', end_date: '', reason: '' });

  // Завантаження базових даних
  useEffect(() => {
    axios.get('http://localhost:5000/api/barbers').then(res => setBarbers(res.data));
    axios.get('http://localhost:5000/api/services').then(res => setServices(res.data));
    axios.get('http://localhost:5000/api/appointments').then(res => setAppointments(res.data));
    axios.get('http://localhost:5000/api/absences').then(res => setAbsences(res.data));
  }, [view]);

  const fetchAppointments = () => {
    axios.get('http://localhost:5000/api/appointments').then(res => setAppointments(res.data));
  };

  const fetchAbsences = () => {
    axios.get('http://localhost:5000/api/absences').then(res => setAbsences(res.data));
  };

  // Валідатори введення інформації
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

  // Логіка Входу та Реєстрації
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (isRegisterMode) {
      axios.post('http://localhost:5000/api/register', { username: authLogin, password: authPassword })
        .then(res => {
          alert(res.data.message);
          setIsRegisterMode(false);
        })
        .catch(err => alert(err.response?.data?.message || "Помилка реєстрації"));
    } else {
      axios.post('http://localhost:5000/api/login', { username: authLogin, password: authPassword })
        .then(res => {
          if (res.data.success) {
            const loggedUser = res.data.user;
            setCurrentUser(loggedUser);
            if (loggedUser.role === 'admin') setView('admin');
            else setView('client');
            setAuthLogin('');
            setAuthPassword('');
          }
        })
        .catch(err => alert(err.response?.data?.message || "Невірний логін або пароль"));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('client');
    setActiveTab('home');
  };

  // Клієнтська логіка створення запису
  const handleBooking = (e) => {
    e.preventDefault();
    const service = services.find(s => s.id === parseInt(selectedService));
    if (!service) return;

    let durationMinutes = 60;
    if (service.duration.includes('1.5')) durationMinutes = 90;
    else if (service.duration.includes('30')) durationMinutes = 30;
    else if (service.duration.includes('45')) durationMinutes = 45;

    const startTime = new Date(selectedDate);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
    
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    const endMinutes = endTime.getMinutes();

    if (startHour < 9) {
      alert("Наш простір відкривається о 09:00. Будь ласка, оберіть інший час візиту.");
      return;
    }

    if (endHour > 17 || (endHour === 17 && endMinutes > 0)) {
      alert(`Обрана послуга триває ${service.duration}. Майстер не встигне завершити роботу до закриття барбершопу (17:00). Будь ласка, оберіть більш ранній час.`);
      return;
    }

    if (formData.name.trim().length < 2) {
      alert("Будь ласка, введіть коректне ім'я для підтвердження резерву.");
      return;
    }

    axios.post('http://localhost:5000/api/appointments', {
      client_name: formData.name,
      client_phone: formData.phone,
      barber_id: selectedBarber.id,
      service_id: selectedService,
      appointment_date: selectedDate,
      client_comment: formData.comment
    })
    .then(() => {
      alert("Ваш візит успішно заброньовано! Чекаємо на вас.");
      setSelectedBarber(null);
      setFormData({ name: '', phone: '+380', comment: '' });
      setSelectedService('');
      setSelectedDate('');
      fetchAppointments();
    })
    .catch(err => alert(err.response?.data?.message || "Помилка при створенні запису. Спробуйте ще раз."));
  };

  // АДМІН: РУЧНЕ ВИДАЛЕННЯ ЗАПИСУ КЛІЄНТА
  const handleDeleteAppointment = (id) => {
    if (window.confirm("Ви впевнені, що хочете видалити цей запис клієнта?")) {
      axios.delete(`http://localhost:5000/api/appointments/${id}`)
        .then(() => {
          setAppointments(prev => prev.filter(app => app.id !== id));
          alert("Запис видалено з бази");
        })
        .catch(err => alert("Помилка при видаленні запису"));
    }
  };

  // Адмін: Додавання відсутності майстра
  const handleAddAbsence = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/absences', newAbsence)
        .then(() => {
            alert("Статус майстра оновлено");
            fetchAbsences();
            setNewAbsence({ barber_id: '', start_date: '', end_date: '', reason: '' });
        })
        .catch(err => alert("Помилка при додаванні відсутності"));
  };

  // Адмін: Видалення відсутності майстра
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

  return (
    <div className="App">
      {/* ВЕРХНЯ НАВІГАЦІЯ */}
      <header className="navbar">
        <div className="logo" onClick={() => { setActiveTab('home'); setView('client'); }}>BRITVA</div>
        <nav className="nav-links">
          <button className={activeTab === 'home' && view === 'client' ? 'active' : ''} onClick={() => { setActiveTab('home'); setView('client'); }}>Головна</button>
          <button className={activeTab === 'booking' && view === 'client' ? 'active' : ''} onClick={() => { setActiveTab('booking'); setView('client'); }}>Онлайн-запис</button>
        </nav>
        
        <div className="auth-zone-header">
          {currentUser ? (
            <div className="user-logged-zone">
              <span className="user-greeting">Вітаємо, <strong>{currentUser.username}</strong>!</span>
              {currentUser.role === 'admin' && (
                <button onClick={() => setView(view === 'admin' ? 'client' : 'admin')} className="admin-badge-btn">
                  {view === 'admin' ? 'До сайту' : 'Панель керування'}
                </button>
              )}
              <button onClick={handleLogout} className="logout-btn">Вийти</button>
            </div>
          ) : (
            <button className="admin-btn" onClick={() => setView('auth')}>
              Особистий кабінет
            </button>
          )}
        </div>
      </header>

      {/* ВКЛАДКА: ГОЛОВНА (ОНОВЛЕНИЙ КОПІРАЙТИНГ) */}
      {activeTab === 'home' && view === 'client' && (
        <div className="home-page">
          <section className="hero-section">
            <h1>БІЛЬШЕ НІЖ ПРОСТО СТРИЖКА</h1>
            <p>Створюємо бездоганний чоловічий стиль та культуру догляду з 2018 року</p>
            <button className="book-btn-hero" onClick={() => setActiveTab('booking')}>Забронювати візит</button>
          </section>

          <section className="info-grid">
            <div className="info-card">
              <h3>Локація простору</h3>
              <p>м. Полтава, вул. Велика Тирнівська, 42</p>
              <p>Зручна парковка поблизу ТЦ "Київ"</p>
            </div>
            <div className="info-card">
              <h3>Час роботи</h3>
              <p>Щодня: 09:00 — 17:00</p>
              <p>Працюємо без вихідних та перерв</p>
            </div>
            <div className="info-card">
              <h3>Прямий зв'язок</h3>
              <p>+38 (044) 123-45-67</p>
              <p>britva.barber@gmail.com</p>
            </div>
          </section>

          <section className="about-section">
            <h2>Про концепцію BRITVA BARBERSHOP</h2>
            <div className="about-content">
              <p>Ми відкрили свої двері 14 жовтня 2018 року. Почавши шлях усього з двох крісел, наш простір трансформувався в провідний клуб чоловічого стилю. Філософія BRITVA — це безкомпромісна увага до деталей, збереження традицій класичного небезпечного гоління та створення преміального сервісу для кожного гостя.</p>
              <div className="facts-list">
                <div className="fact-item"><strong>15,000+</strong> задоволених чоловіків</div>
                <div className="fact-item"><strong>100%</strong> медична стерильність інструментів</div>
                <div className="fact-item"><strong>Premium-бар</strong> свіжозмелена кава та міцні напої</div>
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
                <div className="exp-badge">Стаж: {barber.experience}</div>
                <h3>{barber.name}</h3>
                <p className="rank-text">{barber.rank}</p>
                <p className="spec-text">{barber.specialization}</p>
                <button className="book-btn" onClick={() => setSelectedBarber(barber)}>Обрати майстра</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* МОДАЛЬНЕ ВІКНО З ФОРМОЮ */}
      {selectedBarber && view === 'client' && (
        <div className="modal">
          <div className="modal-content booking-modal">
            <div className="booking-flex">
              <div className="booking-form-side">
                <h2>Ваш візит до: {selectedBarber.name}</h2>
                <form onSubmit={handleBooking}>
                  <input type="text" placeholder="Введіть ваше ім'я" required value={formData.name} onChange={handleNameChange} />
                  <input type="text" placeholder="Номер телефону" required value={formData.phone} onChange={handlePhoneChange} />
                  
                  <select required className="service-select" value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                    <option value="">Виберіть необхідну послугу</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price} грн — {s.duration})</option>)}
                  </select>
                  
                  <label className="input-label">Бажана дата та час початку візиту:</label>
                  <input type="datetime-local" required className="date-input" min={new Date().toISOString().slice(0, 16)} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                  
                  <textarea placeholder="Особливі побажання до майстра або коментар..." className="comment-textarea" value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})}></textarea>
                  
                  <div className="modal-actions" style={{display: 'flex', gap: '10px'}}>
                    <button type="submit" className="confirm-btn">Підтвердити запис</button>
                    <button type="button" className="cancel-btn" onClick={() => setSelectedBarber(null)}>Скасувати</button>
                  </div>
                </form>
              </div>

              <div className="busy-times-side">
                <h3>Зайняті слоти:</h3>
                <div className="times-list">
                  {appointments.filter(app => app.barber_id === selectedBarber.id && new Date(app.appointment_date) > new Date()).map(app => (
                    <div key={app.id} className="busy-slot">
                      {new Date(app.appointment_date).toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ЕКРАН АВТЕНТИФІКАЦІЇ */}
      {view === 'auth' && (
        <div className="login-container">
          <div className="modal-content admin-login-card">
            <h2>{isRegisterMode ? "Реєстрація нового клієнта" : "Авторизація у системі"}</h2>
            <form onSubmit={handleAuthSubmit}>
              <div className="form-group">
                <label>Ваш персональний логін:</label>
                <input type="text" placeholder="Введіть унікальний логін" value={authLogin} onChange={e => setAuthLogin(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Пароль доступу:</label>
                <input type="password" placeholder="Введіть надійний пароль" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required />
              </div>

              <div className="login-buttons">
                <button type="submit" className="confirm-btn">{isRegisterMode ? "Створити профіль" : "Увійти в кабінет"}</button>
                <button type="button" className="cancel-btn" onClick={() => setView('client')}>Повернутись</button>
              </div>
              
              <p className="toggle-auth-mode" onClick={() => setIsRegisterMode(!isRegisterMode)} style={{cursor: 'pointer', marginTop: '15px', color: '#cca353', textAlign: 'center'}}>
                {isRegisterMode ? "Вже є зареєстрований профіль? Авторизуватись" : "Вперше у нас? Створити новий акаунт"}
              </p>
            </form>
          </div>
        </div>
      )}

      {/* ПАНЕЛЬ АДМІНІСТРАТОРА */}
      {view === 'admin' && currentUser?.role === 'admin' && (
        <main className="admin-main" style={{padding: '40px', color: '#fff'}}>
          <h2>Електронний журнал записів клієнтів</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Клієнт</th>
                <th>Телефон</th>
                <th>Майстер</th>
                <th>Послуга</th>
                <th>Дата/Час візиту</th>
                <th>Коментар</th>
                <th>Керування</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(app => (
                <tr key={app.id}>
                  <td>{app.client_name}</td>
                  <td>{app.client_phone}</td>
                  <td>{app.barber_name}</td>
                  <td>{app.service_name}</td>
                  <td>{new Date(app.appointment_date).toLocaleString()}</td>
                  <td>{app.client_comment}</td>
                  <td>
                    <button className="cancel-btn" style={{padding: '5px 10px', fontSize: '12px'}} onClick={() => handleDeleteAppointment(app.id)}>
                      Анулювати
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 style={{marginTop: '40px'}}>Менеджмент робочого часу (Блокування графіку майстрів)</h2>
          <div className="absence-manager">
            <form onSubmit={handleAddAbsence} className="absence-form" style={{marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
              <select required value={newAbsence.barber_id} onChange={e => setNewAbsence({...newAbsence, barber_id: e.target.value})}>
                <option value="">Оберіть майстра</option>
                {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input type="datetime-local" required value={newAbsence.start_date} onChange={e => setNewAbsence({...newAbsence, start_date: e.target.value})} />
              <input type="datetime-local" required value={newAbsence.end_date} onChange={e => setNewAbsence({...newAbsence, end_date: e.target.value})} />
              <input type="text" placeholder="Обґрунтування (відпустка, лікарняний, навчання)" value={newAbsence.reason} onChange={e => setNewAbsence({...newAbsence, reason: e.target.value})} />
              <button type="submit" className="confirm-btn">Заблокувати години</button>
            </form>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Майстер</th>
                  <th>Початок періоду</th>
                  <th>Кінець періоду</th>
                  <th>Офіційна причина</th>
                  <th>Дія</th>
                </tr>
              </thead>
              <tbody>
                {absences.map(abs => (
                  <tr key={abs.id}>
                    <td>{abs.barber_name}</td>
                    <td>{new Date(abs.start_date).toLocaleString()}</td>
                    <td>{new Date(abs.end_date).toLocaleString()}</td>
                    <td>{abs.reason}</td>
                    <td>
                      <button className="cancel-btn" style={{padding: '5px 10px'}} onClick={() => handleDeleteAbsence(abs.id)}>Зняти блок</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;