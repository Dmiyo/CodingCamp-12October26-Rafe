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
    setInterval(updateGreeting, 60000); 
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
let timerSeconds = 25 * 60; 
let timerRunning = false;

function initTimer() {
    const startBtn = document.getElementById('btn-start');
    const stopBtn = document.getElementById('btn-stop');
    const resetBtn = document.getElementById('btn-reset');

    updateTimerDisplay();

    if (startBtn) startBtn.addEventListener('click', startTimer);
    if (stopBtn) stopBtn.addEventListener('click', stopTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);
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
// 4. TASKS (TO-DO LIST) & SORTING
// =========================================

function initTasks() {
    const addBtn = document.getElementById('btn-add-task');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');

    // 1. Suntikkan Dropdown Sort secara dinamis lewat JS (HTML tetap bersih)
    injectSortDropdown();

    if (addBtn) {
        addBtn.addEventListener('click', addTask);
    }

    if (taskInput) {
        taskInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') addTask();
        });
    }

    if (taskList) {
        attachTaskEvents(taskList);
    }
}

// Fungsi untuk membuat elemen <select> sort secara dinamis
function injectSortDropdown() {
    const tasksCard = document.querySelector('.tasks-card');
    const taskInputGroup = document.querySelector('.task-input-group');
    
    if (!tasksCard || !taskInputGroup) return;
    // Cegah duplikasi jika fungsi terpanggil 2x
    if (document.getElementById('sort-tasks')) return;

    const sortContainer = document.createElement('div');
    sortContainer.style.cssText = 'margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;';
    
    sortContainer.innerHTML = `
        <label for="sort-tasks" style="font-size: 0.85rem; color: var(--text-muted);">Urutkan:</label>
        <select id="sort-tasks" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); outline: none; backdrop-filter: blur(4px); font-size: 0.85rem; cursor: pointer;">
            <option value="default">Waktu Dibuat</option>
            <option value="alpha-asc">Nama (A-Z)</option>
            <option value="alpha-desc">Nama (Z-A)</option>
        </select>
    `;

    // Sisipkan setelah input group, sebelum list
    taskInputGroup.parentNode.insertBefore(sortContainer, taskInputGroup.nextSibling);

    // Event listener untuk sort
    document.getElementById('sort-tasks').addEventListener('change', function() {
        sortTasks(this.value);
    });
}

function addTask() {
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');

    if (!taskInput || !taskList) return;

    const text = taskInput.value.trim();
    if (text === '') return;

    // --- LOGIKA MENCEGAH DUPLIKAT (Pakai Alert) ---
    const existingTasks = Array.from(taskList.querySelectorAll('.task-item label'));
    const isDuplicate = existingTasks.some(label => {
        // Bersihkan teks dari spasi berlebih dan jadikan lowercase untuk perbandingan
        const taskText = label.textContent.trim().toLowerCase();
        return taskText === text.toLowerCase();
    });
    
    if (isDuplicate) {
        showCustomAlert('Tugas "' + text + '" sudah ada di dalam daftar!');
        taskInput.value = ''; 
        return; 
    }
    // ----------------------------------------------

    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
        <label><input type="checkbox"> ${escapeHtml(text)}</label>
        <button class="btn btn-delete">Delete</button>
    `;

    taskList.appendChild(li);
    attachTaskEvents(taskList);
    
    // Terapkan ulang sorting jika user sedang menggunakan filter sort tertentu
    const currentSort = document.getElementById('sort-tasks').value;
    if (currentSort !== 'default') {
        sortTasks(currentSort);
    }

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
            
            // Jika sort by status aktif, urutkan ulang saat status berubah
            const currentSort = document.getElementById('sort-tasks').value;
            if (currentSort === 'status') {
                sortTasks(currentSort);
            }
        });
    });

    // Delete button — hapus tugas
    taskList.querySelectorAll('.btn-delete').forEach(function (btn) {
        if (btn.dataset.bound === 'true') return;
        btn.dataset.bound = 'true';

        btn.addEventListener('click', function () {
            const item = this.closest('.task-item');
            if (item) item.remove();
        });
    });
}

function sortTasks(criteria) {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    const tasks = Array.from(taskList.querySelectorAll('.task-item'));

    tasks.sort((a, b) => {
        const textA = a.querySelector('label').textContent.trim().toLowerCase();
        const textB = b.querySelector('label').textContent.trim().toLowerCase();
        const checkedA = a.querySelector('input[type="checkbox"]').checked;
        const checkedB = b.querySelector('input[type="checkbox"]').checked;

        if (criteria === 'alpha-asc') {
            return textA.localeCompare(textB);
        } else if (criteria === 'alpha-desc') {
            return textB.localeCompare(textA);
        } else if (criteria === 'status') {
            if (checkedA !== checkedB) {
                return checkedA ? 1 : -1;
            }
            return textA.localeCompare(textB); 
        } else {
            return 0; 
        }
    });

    tasks.forEach(task => taskList.appendChild(task));
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

    if (addBtn) addBtn.addEventListener('click', addQuickLink);
    if (urlInput) {
        urlInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') addQuickLink();
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

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') toggle.checked = true;

    toggle.addEventListener('change', function () {
        localStorage.setItem('theme', this.checked ? 'dark' : 'light');
    });
}

// =========================================
// 7. CUSTOM ALERT MODAL (PENGGANTI ALERT BAWAAN)
// =========================================

function showCustomAlert(message) {
    // Cek jika pop-up sudah ada untuk mencegah duplikasi
    let overlay = document.getElementById('custom-alert-overlay');
    
    // Jika belum ada, buat elemen HTML-nya secara dinamis
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'custom-alert-overlay';
        overlay.className = 'custom-modal-overlay';
        overlay.innerHTML = `
            <div class="custom-modal-box">
                <div class="custom-modal-icon">⚠️</div>
                <div class="custom-modal-text" id="custom-alert-message"></div>
                <button class="custom-modal-btn" id="custom-alert-btn">Mengerti</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Tambahkan event listener untuk tombol tutup
        document.getElementById('custom-alert-btn').addEventListener('click', closeCustomAlert);
        
        // Tutup pop-up jika area overlay (luar kotak) di-klik
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeCustomAlert();
            }
        });
    }

    // Set pesan
    document.getElementById('custom-alert-message').textContent = message;

    // Tampilkan dengan sedikit delay agar transisi CSS berjalan
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
}

function closeCustomAlert() {
    const overlay = document.getElementById('custom-alert-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}