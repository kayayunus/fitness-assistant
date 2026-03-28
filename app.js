// app.js

function initIcons() {
    if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) { console.warn("Lucide err", e); }
    }
}

// Global Elements
let onboardingView, mainApp, appHeader, appContent, bottomNav, viewSections, navButtons;

const audioBell = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// --- STATE MANAGEMENT ---
let state = {
    theme: 'dark',
    user: { name: '', height: null, weight: null, targetWeight: null, setupComplete: false },
    streak: { days: 0, lastDate: null, history: [] },
    water: { amount: 0, date: null, bottleSize: 750, goal: 3000 },
    calorie: { amount: 0, date: null, goal: 2000 }
};

const defaultDays = [
    {
        id: 'd1', title: 'Gün 1 (Full Body)',
        exercises: [
            { name: 'Chest Press', sets: 3, reps: '12', time: 60 },
            { name: 'Lat Pulldown', sets: 3, reps: '12', time: 60 },
            { name: 'Lateral Raise', sets: 3, reps: '12', time: 60 },
            { name: 'Leg Press', sets: 3, reps: '12', time: 60 },
            { name: 'Plank', sets: 3, reps: '30sn', time: 45 }
        ]
    },
    {
        id: 'd2', title: 'Gün 2 (Kardiyo/Mobilite)',
        exercises: [
            { name: 'Hafif Yürüyüş (110-120bpm)', sets: 1, reps: '25dk', time: null },
            { name: 'Nefes Egzersizleri', sets: 1, reps: '5dk', time: null },
            { name: 'Yoga / Mobilite', sets: 1, reps: '15dk', time: null }
        ]
    },
    {
        id: 'd3', title: 'Gün 3 (Full Body/Kardiyo)',
        exercises: [
            { name: 'Bisiklet Isınma', sets: 1, reps: '10dk', time: null },
            { name: 'Incline Press', sets: 3, reps: '12', time: 60 },
            { name: 'Seated Row', sets: 3, reps: '12', time: 60 },
            { name: 'Shoulder Press', sets: 3, reps: '12', time: 60 },
            { name: 'Bodyweight Squat', sets: 3, reps: '15', time: 45 }
        ]
    },
    {
        id: 'd4', title: 'Gün 4 (Kardiyo/Core)',
        exercises: [
            { name: 'Kardiyo Yürüyüş', sets: 1, reps: '25dk', time: null },
            { name: 'Dead Bug', sets: 3, reps: '12', time: 45 },
            { name: 'Bird Dog', sets: 3, reps: '12', time: 45 },
            { name: 'Side Plank', sets: 3, reps: '20s', time: 30 }
        ]
    }
];

let customDays = [];

// --- INITIALIZATION ---
function init() {
    onboardingView = document.getElementById('onboarding-view');
    mainApp = document.getElementById('main-app');
    appHeader = document.getElementById('app-header');
    appContent = document.getElementById('app-content');
    bottomNav = document.getElementById('bottom-nav');
    viewSections = document.querySelectorAll('main > section');
    navButtons = document.querySelectorAll('.nav-btn');

    loadState();
    checkDailyReset();
    
    // Apply Theme
    applyTheme(state.theme);

    const obsForm = document.getElementById('onboarding-form');
    if (obsForm) obsForm.addEventListener('submit', handleOnboardingSubmit);

    if (state.user.setupComplete) {
        showMainApp();
        updateUI();
    } else {
        showOnboarding();
    }
    initIcons();
}

function loadState() {
    try {
        const saved = localStorage.getItem('nativeFitnessState');
        if (saved) {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
        }
        
        // Strict fallback Checks
        if (!state.user) state.user = { name: '', height: null, weight: null, targetWeight: null, setupComplete: false };
        if (!state.streak) state.streak = { days: 0, lastDate: null, history: [] };
        if (!state.water) state.water = { amount: 0, date: null, bottleSize: 750, goal: 3000 };
        if (!state.water.goal) state.water.goal = 3000;
        if (!state.calorie) state.calorie = { amount: 0, date: null, goal: 2000 };
        if (!state.calorie.goal) state.calorie.goal = 2000;
        if (!state.theme) state.theme = 'dark';

        const savedCustom = localStorage.getItem('nativeFitnessPrograms');
        if (savedCustom) {
            customDays = JSON.parse(savedCustom);
        } else {
            customDays = JSON.parse(JSON.stringify(defaultDays));
            saveCustomPrograms();
        }
    } catch (err) {
        console.error("Local storage error:", err);
    }
}

function saveState() {
    localStorage.setItem('nativeFitnessState', JSON.stringify(state));
}

function saveCustomPrograms() {
    localStorage.setItem('nativeFitnessPrograms', JSON.stringify(customDays));
}

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function checkDailyReset() {
    const today = getTodayString();
    
    if (state.streak.lastDate) {
        let lastObj = new Date(state.streak.lastDate);
        let todayObj = new Date();
        const diffDays = Math.ceil(Math.abs(todayObj - lastObj) / (1000 * 60 * 60 * 24)); 
        
        if (diffDays > 1 && today !== state.streak.lastDate) {
            state.streak.days = 0; 
        }
    }

    if (state.water.date !== today) {
        state.water.amount = 0;
        state.water.date = today;
    }
    if (state.calorie.date !== today) {
        state.calorie.amount = 0;
        state.calorie.date = today;
    }
    saveState();
}

// --- NAVIGATION & VIEWS ---
function navigateto(viewId) {
    if(!viewSections) return;
    
    viewSections.forEach(sec => {
        if(sec.id === 'view-' + viewId) {
            sec.style.display = 'flex';
        } else {
            sec.style.display = 'none';
        }
    });

    if(navButtons) {
        navButtons.forEach(btn => {
            if(btn.dataset.target === viewId) {
                btn.classList.add('text-action');
                btn.style.color = 'var(--color-action-blue)';
            } else if (btn.dataset.target) {
                btn.classList.remove('text-action');
                btn.style.color = 'var(--text-tertiary)';
            }
        });
    }
    
    const headerTitle = document.getElementById('header-title');
    const headerSubtitle = document.getElementById('header-subtitle');
    
    if(headerTitle && headerSubtitle) {
        const hConfig = {
            'dashboard': { t: `Merhaba ${state.user.name.split(' ')[0]}`, s: "Sınırlarını aş." },
            'workout': { t: "Program", s: "Antrenman planın." },
            'tracker': { t: "Takip", s: "Makro ve Su hedefleri." },
            'settings': { t: "Ayarlar", s: "Uygulama kontrolü." }
        };
        const cur = hConfig[viewId] || { t:"", s:"" };
        headerTitle.textContent = cur.t;
        headerSubtitle.textContent = cur.s;
    }
    
    if(appContent) appContent.scrollTop = 0;
}

function showOnboarding() {
    if (onboardingView) onboardingView.style.display = 'flex';
    if (mainApp) mainApp.style.display = 'none';
}

function showMainApp() {
    if (onboardingView) onboardingView.style.display = 'none';
    if (mainApp) mainApp.style.display = 'grid';
    navigateto('dashboard');
}

// --- THEME ---
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
    saveState();
}

function applyTheme(themeVal) {
    document.documentElement.setAttribute('data-theme', themeVal);
}

// --- ONBOARDING ACTIONS ---
function handleOnboardingSubmit(e) {
    e.preventDefault();
    try {
        const nameInput = document.getElementById('user-name').value.trim();
        const height = parseFloat(document.getElementById('user-height').value);
        const weight = parseFloat(document.getElementById('user-weight').value);
        
        if (!nameInput || isNaN(height) || isNaN(weight)) return;

        state.user.name = nameInput;
        state.user.height = height;
        state.user.weight = weight;
        
        // BMR Approx -> Set initial Calorie Goal
        let bmr = 10 * weight + 6.25 * height - 5 * 25 + 5; 
        state.calorie.goal = Math.round(bmr * 1.55);

        state.user.setupComplete = true;
        saveState();
        updateUI();
        showMainApp();
    } catch(err) {
        console.error("Onboarding error:", err);
    }
}

// --- UI UPDATES ---
function updateUI() {
    if(!state.user.setupComplete) return;

    const streakEl = document.getElementById('streak-days');
    if(streakEl) streakEl.textContent = state.streak.days;

    // Tracker UI
    document.getElementById('water-amount').textContent = state.water.amount;
    document.getElementById('water-goal').textContent = state.water.goal;
    document.getElementById('bottle-size-lbl').textContent = state.water.bottleSize;
    
    const waterBg = document.getElementById('water-progress-bg');
    if(waterBg) waterBg.style.height = `${Math.min((state.water.amount / state.water.goal) * 100, 100)}%`;

    document.getElementById('calorie-amount').textContent = state.calorie.amount;
    document.getElementById('calorie-goal').textContent = state.calorie.goal;
    
    const calBar = document.getElementById('cal-progress-bar');
    if(calBar) calBar.style.width = `${Math.min((state.calorie.amount / state.calorie.goal) * 100, 100)}%`;

    renderWorkoutDays();
}

// --- MODALS HELPER ---
function openModal(id) {
    const m = document.getElementById(id);
    if(m) m.style.display = 'flex';
}

function closeModal(id) {
    const m = document.getElementById(id);
    if(m) m.style.display = 'none';
}

// --- TRACKER LOGIC ---
function addWater(ml) {
    state.water.amount += ml;
    saveState();
    updateUI();
}

function addWaterFromBottle() {
    addWater(state.water.bottleSize || 750);
}

function addCalorie() {
    const input = document.getElementById('calorie-input');
    if(!input || !input.value) return;
    state.calorie.amount += parseInt(input.value);
    input.value = '';
    saveState();
    updateUI();
}

function editTrackerGoal(type) {
    if (type === 'water' || type === 'all') {
        const wGoal = prompt("Günlük Su Hedefi (ml):", state.water.goal);
        if (wGoal && !isNaN(wGoal)) state.water.goal = parseInt(wGoal);
        
        const wBottle = prompt("Matara Hacmi (ml):", state.water.bottleSize);
        if (wBottle && !isNaN(wBottle)) state.water.bottleSize = parseInt(wBottle);
    }
    if (type === 'calorie' || type === 'all') {
        const cGoal = prompt("Günlük Kalori Hedefi:", state.calorie.goal);
        if (cGoal && !isNaN(cGoal)) state.calorie.goal = parseInt(cGoal);
    }
    saveState();
    updateUI();
}


// --- WORKOUT CRUD: DAYS & EXERCISES ---

function renderWorkoutDays() {
    const list = document.getElementById('workout-days-list');
    if(!list) return;
    list.innerHTML = '';
    
    customDays.forEach(day => {
        const div = document.createElement('button');
        div.className = 'card flex items-center justify-between touch-target text-left w-full';
        div.onclick = () => confirmHealthAndStart(day.id);
        
        const left = document.createElement('div');
        left.className = 'flex flex-col gap-1 min-w-0';
        left.innerHTML = `
            <h4 class="font-bold text-base truncate">${day.title}</h4>
            <p class="text-xs truncate" style="color: var(--text-tertiary)">${day.exercises.length} Egzersiz</p>
        `;
        
        const right = document.createElement('div');
        right.className = 'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[var(--border-color)]';
        right.innerHTML = `<i data-lucide="play" class="w-5 h-5" style="color: var(--color-energy-green)"></i>`;

        div.appendChild(left);
        div.appendChild(right);
        list.appendChild(div);
    });
    initIcons();
}

function openEditorDays() {
    openModal('modal-edit-days');
    renderEditorDaysList();
}

function renderEditorDaysList() {
    const elId = 'edit-days-list';
    const list = document.getElementById(elId);
    if(!list) return;
    list.innerHTML = '';

    customDays.forEach(day => {
        const div = document.createElement('div');
        div.className = 'list-item touch-target';
        div.onclick = () => openEditDayDetails(day.id);
        div.innerHTML = `
            <div class="flex flex-col gap-1 min-w-0">
                <span class="font-medium truncate">${day.title}</span>
                <span class="text-[10px]" style="color: var(--text-tertiary)">${day.exercises.length} Egzersiz</span>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4" style="color: var(--text-tertiary)"></i>
        `;
        list.appendChild(div);
    });
    
    if (customDays.length === 0) list.innerHTML = `<div class="p-4 text-sm text-center" style="color: var(--text-tertiary)">Hiç gün oluşturulmamış</div>`;
    initIcons();
}

function addDayToProgram() {
    const tempId = 'd_' + Date.now();
    customDays.push({ id: tempId, title: 'Yeni Gün', exercises: [] });
    saveCustomPrograms();
    renderEditorDaysList();
    renderWorkoutDays();
    openEditDayDetails(tempId);
}

function openEditDayDetails(id) {
    const day = customDays.find(d => d.id === id);
    if(!day) return;

    document.getElementById('edit-day-id').value = day.id;
    document.getElementById('edit-day-name-input').value = day.title;
    
    const exList = document.getElementById('edit-ex-list');
    exList.innerHTML = '';
    
    day.exercises.forEach(ex => {
        addEditExRow(ex.name, ex.sets, ex.reps, ex.time);
    });
    
    if(day.exercises.length === 0) addEditExRow();
    
    openModal('modal-edit-exercises');
}

function addEditExRow(name='', sets=3, reps='12', time='') {
    const list = document.getElementById('edit-ex-list');
    const div = document.createElement('div');
    div.className = 'card flex flex-col gap-3 relative p-4';
    div.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" class="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><i data-lucide="x" class="w-4 h-4"></i></button>
        <input type="text" class="ex-name native-input px-3 py-2 min-h-0 text-sm" placeholder="Egzersiz Adı" value="${name}">
        <div class="flex gap-2">
            <input type="number" class="ex-sets native-input px-2 py-2 min-h-0 text-center text-sm w-16" placeholder="Set" value="${sets}">
            <input type="text" class="ex-reps native-input px-2 py-2 min-h-0 text-center text-sm w-16" placeholder="Reps" value="${reps}">
            <input type="number" class="ex-time native-input px-2 py-2 min-h-0 text-center text-sm flex-1" placeholder="Sn (Dinlenme)" value="${time}">
        </div>
    `;
    list.appendChild(div);
    initIcons();
}

function saveDayExercises() {
    const id = document.getElementById('edit-day-id').value;
    const title = document.getElementById('edit-day-name-input').value.trim() || 'Adsız Gün';
    
    const rows = document.querySelectorAll('#edit-ex-list > div');
    const exercises = [];
    rows.forEach(r => {
        const name = r.querySelector('.ex-name').value;
        const sets = parseInt(r.querySelector('.ex-sets').value) || 1;
        const reps = r.querySelector('.ex-reps').value || '1';
        const tv = parseInt(r.querySelector('.ex-time').value);
        const time = isNaN(tv) ? null : tv;
        if (name) exercises.push({name, sets, reps, time});
    });

    const dayIndex = customDays.findIndex(d => d.id === id);
    if (dayIndex !== -1) {
        customDays[dayIndex].title = title;
        customDays[dayIndex].exercises = exercises;
    }
    
    saveCustomPrograms();
    renderWorkoutDays();
    renderEditorDaysList();
    closeModal('modal-edit-exercises');
}

// --- ACTIVE WORKOUT ---

let pendingWorkoutId = null;

function confirmHealthAndStart(dayId) {
    pendingWorkoutId = dayId;
    openModal('modal-health');
}

function acknowledgeHealthAndStart() {
    closeModal('modal-health');
    if(pendingWorkoutId) startWorkout(pendingWorkoutId);
}

function startWorkout(dayId) {
    const day = customDays.find(d => d.id === dayId);
    if(!day) return;

    document.getElementById('active-workout-title').textContent = day.title;
    const list = document.getElementById('active-exercise-list');
    list.innerHTML = '';
    
    day.exercises.forEach((ex, idx) => {
        const div = document.createElement('div');
        div.className = 'card relative flex flex-col gap-3 ml-6 mb-2 overflow-visible';
        
        let timeHTML = ex.time ? `<button onclick="startTimer(${ex.time})" class="text-xs bg-[var(--bg-tertiary)] py-2 px-3 rounded-lg font-bold flex gap-1 items-center self-start text-action"><i data-lucide="timer" class="w-3 h-3"></i> ${ex.time}s Dinlenme</button>` : '';

        div.innerHTML = `
            <div class="absolute -left-[35px] top-6 w-4 h-4 rounded-full border-4 z-10 transition-colors bg-[var(--bg-secondary)] ex-dot" style="border-color: var(--bg-tertiary)"></div>
            <div class="flex justify-between items-start gap-4">
                <div class="flex flex-col gap-1 min-w-0">
                    <h4 class="font-bold truncate text-base">${ex.name}</h4>
                    <p class="text-[11px] uppercase tracking-wider font-semibold" style="color: var(--text-tertiary)">${ex.sets} Set x ${ex.reps}</p>
                </div>
                <button onclick="toggleExerciseComplete(this)" class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center touch-target transition-all border border-[var(--border-color)] text-[var(--text-tertiary)] ex-check">
                    <i data-lucide="check" class="w-5 h-5"></i>
                </button>
            </div>
            ${timeHTML}
        `;
        list.appendChild(div);
    });

    navigateto('active-workout');
    initIcons();
}

function toggleExerciseComplete(btn) {
    const dot = btn.closest('.card').querySelector('.ex-dot');
    const isCompleted = btn.style.backgroundColor === 'var(--color-energy-green)';
    
    if (isCompleted) {
        btn.style.backgroundColor = 'transparent';
        btn.style.borderColor = 'var(--border-color)';
        btn.style.color = 'var(--text-tertiary)';
        dot.style.borderColor = 'var(--bg-tertiary)';
        dot.style.backgroundColor = 'var(--bg-secondary)';
    } else {
        btn.style.backgroundColor = 'var(--color-energy-green)';
        btn.style.borderColor = 'var(--color-energy-green)';
        btn.style.color = '#fff';
        dot.style.borderColor = 'var(--color-energy-green)';
        dot.style.backgroundColor = 'var(--color-energy-green)';
        
        const today = getTodayString();
        if (!state.streak.history.includes(today)) state.streak.history.push(today);
        if (state.streak.lastDate !== today) {
            state.streak.days++;
            state.streak.lastDate = today;
            saveState();
            updateUI();
        }
    }
}

function closeActiveWorkout() {
    navigateto('workout');
    stopTimer();
}

// --- TIMER ---
let timerInterval;

function startTimer(seconds) {
    const tp = document.getElementById('timer-panel');
    const td = document.getElementById('timer-display');
    if(!tp || !td) return;
    
    tp.style.opacity = '1';
    tp.style.pointerEvents = 'auto';
    tp.style.transform = 'translateY(0)';
    
    clearInterval(timerInterval);
    let left = seconds;
    
    const updateD = () => {
        let m = Math.floor(left / 60).toString().padStart(2, '0');
        let s = (left % 60).toString().padStart(2, '0');
        td.textContent = `${m}:${s}`;
    };
    
    updateD();
    timerInterval = setInterval(() => {
        left--;
        updateD();
        if(left <= 0) {
            clearInterval(timerInterval);
            audioBell.currentTime = 0;
            audioBell.play().catch(()=>{});
            setTimeout(stopTimer, 2000);
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    const tp = document.getElementById('timer-panel');
    if(tp) {
        tp.style.opacity = '0';
        tp.style.pointerEvents = 'none';
        tp.style.transform = 'translateY(200%)';
    }
}

// --- CALENDAR ---
function openCalendar() {
    openModal('modal-calendar');
    
    const d = new Date();
    const month = d.getMonth();
    const year = d.getFullYear();
    
    const mNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    document.getElementById('cal-month-title').textContent = `${mNames[month]} ${year}`;
    
    let firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let emptyDays = firstDay === 0 ? 6 : firstDay - 1;
    
    const calGrid = document.getElementById('cal-grid');
    calGrid.innerHTML = '';
    
    for(let i=0; i<emptyDays; i++) {
        calGrid.innerHTML += `<div class="w-8 h-8"></div>`;
    }
    
    for(let i=1; i<=daysInMonth; i++) {
        const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const done = state.streak.history.includes(ds);
        
        calGrid.innerHTML += `
            <div class="flex flex-col items-center">
                <div class="ring-container ${done ? 'ring-active' : ''}">
                    <span class="text-[12px] font-bold" style="color: ${done ? 'var(--color-energy-green)' : 'var(--text-secondary)'}">${i}</span>
                </div>
            </div>`;
    }
}

// --- SETTINGS EXTRAS ---
function openProfileEdit() {
    const nn = prompt("Adınız:", state.user.name);
    if(nn) {
        state.user.name = nn;
        saveState();
        updateUI();
        navigateto('settings'); // Refresh title
    }
}

function confirmReset() {
    if(confirm("Tüm gelişimin silinecek! Devam?")) {
        localStorage.clear();
        window.location.reload();
    }
}

if (document.readyState === 'loading') {    
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
