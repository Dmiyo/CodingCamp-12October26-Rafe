// =========================================
// TO-DO LIST LIFE - MAIN SCRIPT
// =========================================

document.addEventListener('DOMContentLoaded', function () {
    initClock();
    initGreeting();
    initTimer();
    initTasks();
    initQuickLinks();
    initThemeToggle();
});

// =========================================
// 1. CLOCK & DATE
// =========================================

function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    const dateEl = document.getElementById('date');

    if (clockEl) {
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        clockEl.textContent = `${h}:${m}:${s}`;
    }

    if (dateEl) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    }
}

// =========================================
// 2. GREETING
// =========================================

function initGreeting() {
    updateGreeting();
    setInterval(updateGreeting, 60000); // Update tiap menit
}

function updateGreeting() {
    const greetingEl = document.getElementById('greeting');
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let greeting;

    if (hour >= 0 && hour < 12) {
        greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 15) {
        greeting = 'Good Afternoon';
    } else if (hour >= 15 && hour < 18) {
        greeting = 'Good Evening';
    } else {
        greeting = 'Good Night';
    }

    greetingEl.textContent = greeting;
}

// =========================================
// 3. FOCUS TIMER (POMODORO)
// =========================================

let timerInterval = null;
let timerSeconds = 25 * 60; // 25 menit
let timerRunning = false;

function initTimer() {
    const startBtn = document.getElementById('btn-start');
    const stopBtn = document.getElementById('btn-stop');
    const resetBtn = document.getElementById('btn-reset');

    updateTimerDisplay();

    if (startBtn) {
        startBtn.addEventListener('click', startTimer);
    }
    if (stopBtn) {
        stopBtn.addEventListener('click', stopTimer);
    }
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTimer);
    }
}

function startTimer() {
    if (timerRunning || timerSeconds <= 0) return;
    timerRunning = true;

    timerInterval = setInterval(function () {
        if (timerSeconds <= 1) {
            timerSeconds = 0;
            updateTimerDisplay();
            stopTimer();
            playNotificationSound();
            return;
        }
        timerSeconds--;
        updateTimerDisplay();
    }, 1000);
}

function stopTimer() {
    timerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    timerSeconds = 25 * 60;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    if (!timerEl) return;

    const m = Math.floor(timerSeconds / 60);
    const s = timerSeconds % 60;
    timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function playNotificationSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = 800;
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 1);
    } catch (e) {
        console.warn('Audio not supported:', e);
    }
}

// =========================================
// 4. TASKS (TO-DO LIST)
// =========================================

function initTasks() {
    const addBtn = document.getElementById('btn-add-task');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');

    if (addBtn) {
        addBtn.addEventListener('click', addTask);
    }

    if (taskInput) {
        taskInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                addTask();
            }
        });
    }

    // Pasang event listener ke task yang sudah ada di HTML
    if (taskList) {
        attachTaskEvents(taskList);
    }
}

function addTask() {
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');

    if (!taskInput || !taskList) return;

    const text = taskInput.value.trim();
    if (text === '') return;

    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
        <label><input type="checkbox"> ${escapeHtml(text)}</label>
        <button class="btn btn-delete">Delete</button>
    `;

    taskList.appendChild(li);
    attachTaskEvents(taskList);
    taskInput.value = '';
    taskInput.focus();
}

function attachTaskEvents(taskList) {
    // Checkbox — tandai selesai
    taskList.querySelectorAll('.task-item input[type="checkbox"]').forEach(function (checkbox) {
        if (checkbox.dataset.bound === 'true') return;
        checkbox.dataset.bound = 'true';

        checkbox.addEventListener('change', function () {
            const label = this.closest('label');
            if (this.checked) {
                label.style.textDecoration = 'line-through';
                label.style.opacity = '0.5';
            } else {
                label.style.textDecoration = 'none';
                label.style.opacity = '1';
            }
        });
    });

    // Delete button — hapus tugas
    taskList.querySelectorAll('.btn-delete').forEach(function (btn) {
        if (btn.dataset.bound === 'true') return;
        btn.dataset.bound = 'true';

        btn.addEventListener('click', function () {
            const item = this.closest('.task-item');
            if (item) {
                item.remove();
            }
        });
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =========================================
// 5. QUICK LINKS
// =========================================

function initQuickLinks() {
    const addBtn = document.getElementById('btn-add-link');
    const nameInput = document.getElementById('link-name');
    const urlInput = document.getElementById('link-url');

    if (addBtn) {
        addBtn.addEventListener('click', addQuickLink);
    }

    if (urlInput) {
        urlInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                addQuickLink();
            }
        });
    }
}

function addQuickLink() {
    const nameInput = document.getElementById('link-name');
    const urlInput = document.getElementById('link-url');
    const linksList = document.getElementById('quick-links-list');

    if (!nameInput || !urlInput || !linksList) return;

    const name = nameInput.value.trim();
    let url = urlInput.value.trim();

    if (name === '' || url === '') return;

    // Tambahkan https:// jika belum ada
    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    const link = document.createElement('a');
    link.href = url;
    link.className = 'link-chip';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `🔗 ${name}`;

    linksList.appendChild(link);

    nameInput.value = '';
    urlInput.value = '';
    nameInput.focus();
}

// =========================================
// 6. THEME TOGGLE (DARK/LIGHT MODE)
// =========================================

function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    // Cek preferensi tersimpan
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        toggle.checked = true;
    }

    // Simpan preferensi saat toggle berubah
    toggle.addEventListener('change', function () {
        if (this.checked) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
}