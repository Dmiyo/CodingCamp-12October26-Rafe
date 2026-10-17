// =========================================
// TO-DO LIST LIFE - MAIN SCRIPT
// =========================================

let currentUser = null;
let authMode = 'login';

document.addEventListener('DOMContentLoaded', function () {
    // 1. WAJIB: Suntikkan Modal Login/Register terlebih dahulu agar elemennya ada di HTML
    injectAuthModal();

    // 2. Baru cek autentikasi
    checkAuth();

    // 3. Inisialisasi Dashboard
    initClock();
    initGreeting();
    initTimer();
    initTasks();
    initQuickLinks();
    initThemeToggle();
});

// =========================================
// AUTHENTICATION SYSTEM (LOGIN & REGISTER)
// =========================================

function checkAuth() {
    const session = localStorage.getItem('todo_session');
    if (!session) {
        // Pop-up TIDAK muncul otomatis (sesuai permintaanmu)
        toggleHeaderUI(false); // Tampilkan tombol Log In di header
    } else {
        currentUser = session;
        updateGreetingName();
        toggleHeaderUI(true); // Tampilkan profil user di header
        
        // Muat data user
        if (typeof loadTasks === 'function') loadTasks();
        if (typeof loadLinks === 'function') loadLinks();
    }
}

function injectAuthModal() {
    if (document.getElementById('auth-modal-overlay')) return;

    const modalHTML = `
        <div id="auth-modal-overlay" class="custom-modal-overlay">
            <div class="custom-modal-box" style="max-width: 350px; text-align: left; position: relative;">
                
                <!-- TOMBOL CLOSE (X) -->
                <button type="button" class="modal-close-btn" onclick="closeAuthModal()">✖</button>

                <!-- Header -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 id="auth-title" style="color: var(--text-main); font-size: 1.5rem;">Welcome Back</h2>
                    <p id="auth-subtitle" style="color: var(--text-muted); font-size: 0.85rem; margin-top: 5px;">Log in to continue</p>
                </div>

                <!-- Form -->
                <form id="auth-form" onsubmit="handleAuthSubmit(event)">
                    <div class="auth-input-group" style="margin-bottom: 15px;">
                        <label style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px; display: block;">Username</label>
                        <input type="text" id="auth-username" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); outline: none;">
                    </div>
                    <div class="auth-input-group" style="margin-bottom: 20px;">
                        <label style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 5px; display: block;">Password</label>
                        <input type="password" id="auth-password" required style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); outline: none;">
                    </div>
                    
                    <button type="submit" class="custom-modal-btn" id="auth-submit-btn">Log In</button>
                </form>

                <!-- Toggle Mode -->
                <div style="text-align: center; margin-top: 15px; font-size: 0.85rem;">
                    <span id="auth-toggle-text" style="color: var(--text-muted);">Don't have an account?</span>
                    <a href="#" id="auth-toggle-link" onclick="toggleAuthMode(event)" style="color: var(--accent-color); text-decoration: none; font-weight: 600;">Sign Up</a>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Agar pop-up tertutup jika user klik area gelap di luar kotak
    setTimeout(() => {
        const overlay = document.getElementById('auth-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) closeAuthModal();
            });
        }
    }, 100);
}

function openAuthModal(mode) {
    authMode = mode;
    const overlay = document.getElementById('auth-modal-overlay');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const btn = document.getElementById('auth-submit-btn');
    const toggleText = document.getElementById('auth-toggle-text');
    const toggleLink = document.getElementById('auth-toggle-link');
    const form = document.getElementById('auth-form');

    if (form) form.reset();

    if (mode === 'login') {
        if(title) title.textContent = 'Welcome Back';
        if(subtitle) subtitle.textContent = 'Log in to continue';
        if(btn) btn.textContent = 'Log In';
        if(toggleText) toggleText.textContent = "Don't have an account?";
        if(toggleLink) toggleLink.textContent = 'Sign Up';
    } else {
        if(title) title.textContent = 'Create Account';
        if(subtitle) subtitle.textContent = 'Sign up to start organizing';
        if(btn) btn.textContent = 'Sign Up';
        if(toggleText) toggleText.textContent = 'Already have an account?';
        if(toggleLink) toggleLink.textContent = 'Log In';
    }

    if (overlay) overlay.classList.add('show');
}

function closeAuthModal() {
    const overlay = document.getElementById('auth-modal-overlay');
    if (overlay) overlay.classList.remove('show');
}

function toggleAuthMode(e) {
    e.preventDefault();
    openAuthModal(authMode === 'login' ? 'register' : 'login');
}

function handleAuthSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value;

    if (username.length < 3) {
        showCustomAlert('Username minimal 3 karakter!');
        return;
    }

    // Hash password (Base64 sederhana)
    const hashedPassword = btoa(password);
    
    // Ambil data semua user
    let users = JSON.parse(localStorage.getItem('todo_users')) || {};

    if (authMode === 'register') {
        if (users[username.toLowerCase()]) {
            showCustomAlert('Username sudah digunakan, pilih yang lain!');
            return;
        }
        // Simpan user baru
        users[username.toLowerCase()] = { name: username, password: hashedPassword };
        localStorage.setItem('todo_users', JSON.stringify(users));
        
        // Auto login setelah register
        loginUser(username);
    } else {
        // Login
        const userKey = username.toLowerCase();
        if (!users[userKey] || users[userKey].password !== hashedPassword) {
            showCustomAlert('Username atau Password salah!');
            return;
        }
        loginUser(users[userKey].name);
    }
}

function loginUser(username) {
    localStorage.setItem('todo_session', username);
    currentUser = username;
    
    // Tutup modal
    closeAuthModal();
    
    // Refresh data di dashboard
    updateGreetingName();
    loadTasks();
    loadLinks();
    toggleHeaderUI(true); 
}

function updateGreetingName() {
    window.displayName = currentUser || 'User';
    updateGreeting();
}

function toggleHeaderUI(isLoggedIn) {
    const loginBtn = document.getElementById('header-login-btn');
    const userProfile = document.getElementById('user-profile');
    const nameDisplay = document.getElementById('user-name-display');

    if (isLoggedIn) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userProfile) userProfile.classList.remove('hidden');
        if (nameDisplay) nameDisplay.textContent = currentUser;
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userProfile) userProfile.classList.add('hidden');
    }
}

function handleLogout() {
    localStorage.removeItem('todo_session');
    currentUser = null;
    
    // Kosongkan data di layar
    const taskList = document.getElementById('task-list');
    const linksList = document.getElementById('quick-links-list');
    if (taskList) taskList.innerHTML = '';
    if (linksList) linksList.innerHTML = '';
    
    // Update sapaan kembali ke default
    window.displayName = 'User';
    updateGreeting();
    
    // Kembalikan UI ke mode belum login
    toggleHeaderUI(false);
    
    // Buka pop-up login lagi
    openAuthModal('login');
}

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
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
    let greetingText;

    if (hour >= 0 && hour < 12) greetingText = 'Good Morning';
    else if (hour >= 12 && hour < 15) greetingText = 'Good Afternoon';
    else if (hour >= 15 && hour < 18) greetingText = 'Good Evening';
    else greetingText = 'Good Night';

    const name = window.displayName ? window.displayName : 'User';
    greetingEl.textContent = `${greetingText}, ${name}!`;
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
    } catch (e) {}
}

// =========================================
// 4. TASKS (TO-DO LIST) & SORTING & STORAGE
// =========================================

function initTasks() {
    const addBtn = document.getElementById('btn-add-task');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');

    injectSortDropdown();

    if (addBtn) addBtn.addEventListener('click', addTask);
    if (taskInput) {
        taskInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') addTask();
        });
    }

    if (taskList) {
        attachTaskEvents(taskList);
        loadTasks();
    }
}

function getTaskKey() {
    return `todo_tasks_${currentUser ? currentUser.toLowerCase() : 'guest'}`;
}

function saveTasks() {
    if (!currentUser) return;
    const taskList = document.getElementById('task-list');
    const tasks = Array.from(taskList.querySelectorAll('.task-item')).map(li => {
        return {
            text: li.querySelector('label').textContent.trim(),
            completed: li.querySelector('input[type="checkbox"]').checked
        };
    });
    localStorage.setItem(getTaskKey(), JSON.stringify(tasks));
}

function loadTasks() {
    if (!currentUser) return;
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    taskList.innerHTML = '';

    const savedTasks = JSON.parse(localStorage.getItem(getTaskKey())) || [];
    
    savedTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        
        const checkedAttr = task.completed ? 'checked' : '';
        const style = task.completed ? 'text-decoration: line-through; opacity: 0.5;' : '';

        li.innerHTML = `
            <label style="${style}"><input type="checkbox" ${checkedAttr}> ${escapeHtml(task.text)}</label>
            <button class="btn btn-delete">Delete</button>
        `;
        taskList.appendChild(li);
    });

    attachTaskEvents(taskList);
}

function injectSortDropdown() {
    const tasksCard = document.querySelector('.tasks-card');
    const taskInputGroup = document.querySelector('.task-input-group');
    if (!tasksCard || !taskInputGroup || document.getElementById('sort-tasks')) return;

    const sortContainer = document.createElement('div');
    sortContainer.style.cssText = 'margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;';
    sortContainer.innerHTML = `
        <label for="sort-tasks" style="font-size: 0.85rem; color: var(--text-muted);">Urutkan:</label>
        <select id="sort-tasks" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-main); outline: none; backdrop-filter: blur(4px); font-size: 0.85rem; cursor: pointer;">
            <option value="default">Waktu Dibuat</option>
            <option value="alpha-asc">Nama (A-Z)</option>
            <option value="alpha-desc">Nama (Z-A)</option>
            <option value="status">Status (Selesai di Bawah)</option>
        </select>
    `;
    taskInputGroup.parentNode.insertBefore(sortContainer, taskInputGroup.nextSibling);
    document.getElementById('sort-tasks').addEventListener('change', function() { sortTasks(this.value); });
}

function addTask() {
    if (!currentUser) {
        showCustomAlert('Silakan login terlebih dahulu untuk menambah tugas!');
        openAuthModal('login');
        return;
    }

    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    if (!taskInput || !taskList) return;

    const text = taskInput.value.trim();
    if (text === '') return;

    const existingTasks = Array.from(taskList.querySelectorAll('.task-item label'));
    const isDuplicate = existingTasks.some(label => label.textContent.trim().toLowerCase() === text.toLowerCase());

    if (isDuplicate) {
        showCustomAlert('Tugas "' + text + '" sudah ada di dalam daftar!');
        taskInput.value = ''; 
        return; 
    }

    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `<label><input type="checkbox"> ${escapeHtml(text)}</label><button class="btn btn-delete">Delete</button>`;

    taskList.appendChild(li);
    attachTaskEvents(taskList);
    
    const currentSort = document.getElementById('sort-tasks').value;
    if (currentSort !== 'default') sortTasks(currentSort);

    saveTasks();

    taskInput.value = '';
    taskInput.focus();
}

function attachTaskEvents(taskList) {
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
            saveTasks();
            
            const currentSort = document.getElementById('sort-tasks').value;
            if (currentSort === 'status') sortTasks(currentSort);
        });
    });

    taskList.querySelectorAll('.btn-delete').forEach(function (btn) {
        if (btn.dataset.bound === 'true') return;
        btn.dataset.bound = 'true';

        btn.addEventListener('click', function () {
            const item = this.closest('.task-item');
            if (item) {
                item.remove();
                saveTasks();
            }
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

        if (criteria === 'alpha-asc') return textA.localeCompare(textB);
        else if (criteria === 'alpha-desc') return textB.localeCompare(textA);
        else if (criteria === 'status') {
            if (checkedA !== checkedB) return checkedA ? 1 : -1;
            return textA.localeCompare(textB); 
        }
        return 0; 
    });
    tasks.forEach(task => taskList.appendChild(task));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =========================================
// 5. QUICK LINKS & STORAGE
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
    
    loadLinks();
}

function getLinkKey() {
    return `todo_links_${currentUser ? currentUser.toLowerCase() : 'guest'}`;
}

function saveLinks() {
    if (!currentUser) return;
    const linksList = document.getElementById('quick-links-list');
    const links = Array.from(linksList.querySelectorAll('.link-chip')).map(a => {
        return { name: a.textContent.replace('🔗 ', '').trim(), url: a.href };
    });
    localStorage.setItem(getLinkKey(), JSON.stringify(links));
}

function loadLinks() {
    if (!currentUser) return;
    const linksList = document.getElementById('quick-links-list');
    if (!linksList) return;

    linksList.innerHTML = '';
    const savedLinks = JSON.parse(localStorage.getItem(getLinkKey())) || [];
    
    savedLinks.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.className = 'link-chip';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = `🔗 ${link.name}`;
        linksList.appendChild(a);
    });
}

function addQuickLink() {
    if (!currentUser) {
        showCustomAlert('Silakan login terlebih dahulu untuk menambah link!');
        openAuthModal('login');
        return;
    }

    const nameInput = document.getElementById('link-name');
    const urlInput = document.getElementById('link-url');
    const linksList = document.getElementById('quick-links-list');

    if (!nameInput || !urlInput || !linksList) return;

    const name = nameInput.value.trim();
    let url = urlInput.value.trim();

    if (name === '' || url === '') return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const link = document.createElement('a');
    link.href = url;
    link.className = 'link-chip';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = `🔗 ${name}`;

    linksList.appendChild(link);
    saveLinks();

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
// 7. CUSTOM ALERT MODAL
// =========================================

function showCustomAlert(message) {
    let overlay = document.getElementById('custom-alert-overlay');
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
        document.getElementById('custom-alert-btn').addEventListener('click', closeCustomAlert);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeCustomAlert();
        });
    }
    document.getElementById('custom-alert-message').textContent = message;
    setTimeout(() => overlay.classList.add('show'), 10);
}

function closeCustomAlert() {
    const overlay = document.getElementById('custom-alert-overlay');
    if (overlay) overlay.classList.remove('show');
}