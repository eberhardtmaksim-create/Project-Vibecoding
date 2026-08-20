// ===== STARFIELD =====
(function initStarfield() {
    const canvas = document.getElementById('starfield');
    const ctx = canvas.getContext('2d');
    let stars = [];
    let shootingStars = [];
    let w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    function createStars(count) {
        stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 1.5 + 0.3,
                alpha: Math.random(),
                dAlpha: (Math.random() - 0.5) * 0.01
            });
        }
    }

    function spawnShootingStar() {
        const startX = Math.random() * w * 0.7;
        const startY = Math.random() * h * 0.4;
        const angle = Math.PI / 6 + Math.random() * Math.PI / 6;
        const speed = 6 + Math.random() * 6;
        shootingStars.push({
            x: startX,
            y: startY,
            length: 60 + Math.random() * 80,
            speed: speed,
            angle: angle,
            alpha: 1,
            trail: []
        });
    }

    function drawStars() {
        for (const s of stars) {
            s.alpha += s.dAlpha;
            if (s.alpha > 1 || s.alpha < 0.1) s.dAlpha *= -1;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
            ctx.fill();
        }
    }

    function drawShootingStars() {
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const s = shootingStars[i];
            s.x += Math.cos(s.angle) * s.speed;
            s.y += Math.sin(s.angle) * s.speed;
            s.alpha -= 0.008;

            s.trail.push({ x: s.x, y: s.y, alpha: s.alpha });
            if (s.trail.length > s.length) s.trail.shift();

            for (let j = 0; j < s.trail.length; j++) {
                const t = s.trail[j];
                const progress = j / s.trail.length;
                ctx.beginPath();
                ctx.arc(t.x, t.y, 1.5 * progress, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${t.alpha * progress * 0.7})`;
                ctx.fill();
            }

            const head = s.trail[s.trail.length - 1];
            if (head) {
                ctx.beginPath();
                ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2);
                const glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 12);
                glow.addColorStop(0, `rgba(200, 200, 255, ${s.alpha})`);
                glow.addColorStop(1, 'rgba(200, 200, 255, 0)');
                ctx.fillStyle = glow;
                ctx.fill();
            }

            if (s.alpha <= 0 || s.x > w + 100 || s.y > h + 100) {
                shootingStars.splice(i, 1);
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#05051a');
        grad.addColorStop(0.5, '#0a0a2e');
        grad.addColorStop(1, '#0f0a1e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        drawStars();
        drawShootingStars();
        requestAnimationFrame(animate);
    }

    resize();
    createStars(300);
    animate();

    window.addEventListener('resize', () => {
        resize();
        createStars(300);
    });

    setInterval(() => {
        if (Math.random() < 0.6) spawnShootingStar();
    }, 2000);
})();

// ===== CLOCK & DATE =====
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date').textContent = now.toLocaleDateString('de-DE', options);
}

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    if (hour < 6) greeting = 'Gute Nacht!';
    else if (hour < 12) greeting = 'Guten Morgen!';
    else if (hour < 18) greeting = 'Guten Tag!';
    else greeting = 'Guten Abend!';
    document.getElementById('greeting').textContent = greeting;
}

// ===== WEATHER =====
const WEATHER_ICONS = {
    'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️', 'Drizzle': '🌦️',
    'Thunderstorm': '⛈️', 'Snow': '❄️', 'Mist': '🌫️', 'Fog': '🌫️',
    
};

async function fetchWeather() {
    const el = document.getElementById('weather');
    try {
        const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        const { latitude, longitude } = pos.coords;
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
        );
        const data = await res.json();
        const current = data.current;

        const weatherCode = current.weather_code;
        const condition = getWeatherCondition(weatherCode);
        const icon = WEATHER_ICONS[condition] || '🌤️';

        el.innerHTML = `
            <div class="weather-main">
                <span class="weather-icon">${icon}</span>
                <span class="weather-temp">${Math.round(current.temperature_2m)}°C</span>
            </div>
            <div class="weather-desc">${condition}</div>
            <div class="weather-details">
                <span>💧 ${current.relative_humidity_2m}%</span>
                <span>💨 ${Math.round(current.wind_speed_10m)} km/h</span>
            </div>
        `;
    } catch (err) {
        el.innerHTML = `
            <div class="weather-error">Wetter nicht verfügbar</div>
            <div style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 8px;">
                Standortzugriff erforderlich für lokale Wetterdaten.
            </div>
        `;
    }
}

function getWeatherCondition(code) {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Clouds';
    if (code <= 49) return 'Fog';
    if (code <= 59) return 'Drizzle';
    if (code <= 69) return 'Rain';
    if (code <= 79) return 'Snow';
    if (code <= 82) return 'Rain';
    if (code <= 86) return 'Snow';
    if (code <= 99) return 'Thunderstorm';
    return 'Clouds';
}

// ===== TO-DO LIST =====
let todos = JSON.parse(localStorage.getItem('dashboard-todos')) || [];

function renderTodos() {
    const list = document.getElementById('todoList');
    list.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item${todo.done ? ' done' : ''}`;
        li.innerHTML = `
            <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="toggleTodo(${index})" />
            <span>${escapeHtml(todo.text)}</span>
            <button class="delete-btn" onclick="deleteTodo(${index})">✕</button>
        `;
        list.appendChild(li);
    });
}

function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text, done: false });
    localStorage.setItem('dashboard-todos', JSON.stringify(todos));
    input.value = '';
    renderTodos();
}

function toggleTodo(index) {
    todos[index].done = !todos[index].done;
    localStorage.setItem('dashboard-todos', JSON.stringify(todos));
    renderTodos();
}

function deleteTodo(index) {
    todos.splice(index, 1);
    localStorage.setItem('dashboard-todos', JSON.stringify(todos));
    renderTodos();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.getElementById('addTodo').addEventListener('click', addTodo);
document.getElementById('todoInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

// ===== NOTES =====
function loadNotes() {
    document.getElementById('notes').value = localStorage.getItem('dashboard-notes') || '';
}

document.getElementById('saveNotes').addEventListener('click', () => {
    localStorage.setItem('dashboard-notes', document.getElementById('notes').value);
    const btn = document.getElementById('saveNotes');
    btn.textContent = '✓ Gespeichert';
    setTimeout(() => { btn.textContent = 'Speichern'; }, 1500);
});

// ===== NEWS =====
async function fetchNews() {
    const el = document.getElementById('news');
    try {
        const res = await fetch('https://newsapi.org/v2/top-headlines?country=de&pageSize=8&apiKey=demo');
        if (res.ok) {
            const data = await res.json();
            if (data.articles && data.articles.length > 0) {
                el.innerHTML = data.articles
                    .filter(a => a.title && a.title !== '[Removed]')
                    .slice(0, 8)
                    .map(article => `
                        <div class="news-item">
                            <a href="${article.url}" target="_blank" rel="noopener">${escapeHtml(article.title)}</a>
                            ${article.urlToImage ? `<img class="news-img" src="${article.urlToImage}" alt="" onerror="this.style.display='none'" />` : ''}
                            ${article.description ? `<div class="news-desc">${escapeHtml(article.description).substring(0, 150)}...</div>` : ''}
                            <div class="news-meta">${article.source?.name || ''} ${article.publishedAt ? '· ' + new Date(article.publishedAt).toLocaleDateString('de-DE') : ''}</div>
                        </div>
                    `).join('');
                return;
            }
        }
    } catch (e) {}

    el.innerHTML = `
        <div style="color: var(--text-secondary); text-align: center; padding: 20px;">
            Nachrichten konnten nicht geladen werden.<br/>
            <small>Du kannst einen eigenen API-Key bei <a href="https://newsapi.org" target="_blank" style="color: var(--accent);">newsapi.org</a> eintragen.</small>
        </div>
    `;
}

// ===== INIT =====
updateClock();
updateGreeting();
setInterval(updateClock, 1000);
setInterval(updateGreeting, 60000);

renderTodos();
loadNotes();
fetchWeather();
fetchNews();

