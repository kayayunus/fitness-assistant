// app.js

function initIcons() {
    if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) { console.warn("Lucide err", e); }
    }
}

// Elements
let onboardingView, mainApp, appHeader, appContent, bottomNav, viewSections, navButtons;

// --- STATE MANAGEMENT ---
let state = {
    user: {
        name: '', height: null, weight: null, targetWeight: null, setupComplete: false,
        dailyCalorieGoal: 2000
    },
    streak: { days: 0, lastDate: null, history: [] }, // history: ['YYYY-MM-DD']
    water: { amount: 0, date: null, bottleSize: 750 },
    calorie: { amount: 0, date: null },
    weightHistory: []
};

// HARCODED PROGRAMS AS REQUESTED
const defaultPrograms = [
    {
        id: 'day1', title: 'Gün 1 (Full Body)',
        desc: 'Chest Press, Lat Pulldown, Lateral Raise, Leg Press, Plank',
        exercises: [
            { name: 'Chest Press', sets: 3, reps: '12', time: 60 },
            { name: 'Lat Pulldown', sets: 3, reps: '12', time: 60 },
            { name: 'Lateral Raise', sets: 3, reps: '12', time: 60 },
            { name: 'Leg Press', sets: 3, reps: '12', time: 60 },
            { name: 'Plank', sets: 3, reps: '30sn', time: 45 }
        ]
    },
    {
        id: 'day2', title: 'Gün 2 (Kardiyo/Mobilite)',
        desc: '20-30 dk hafif yürüyüş (110-120 bpm), Yoga ve nefes',
        exercises: [
            { name: 'Hafif Yürüyüş (110-120bpm)', sets: 1, reps: '25dk', time: null },
            { name: 'Nefes Egzersizleri', sets: 1, reps: '5dk', time: null },
            { name: 'Yoga / Mobilite', sets: 1, reps: '15dk', time: null }
        ]
    },
    {
        id: 'day3', title: 'Gün 3 (Full Body/Kardiyo)',
        desc: 'Bisiklet, Incline Press, Seated Row, Squat',
        exercises: [
            { name: 'Bisiklet Isınma', sets: 1, reps: '10dk', time: null },
            { name: 'Incline Press', sets: 3, reps: '12', time: 60 },
            { name: 'Seated Row', sets: 3, reps: '12', time: 60 },
            { name: 'Shoulder Press', sets: 3, reps: '12', time: 60 },
            { name: 'Bodyweight Squat', sets: 3, reps: '15', time: 45 }
        ]
    },
    {
        id: 'day4', title: 'Gün 4 (Kardiyo/Core)',
        desc: '25 dk yürüyüş, Dead Bug, Bird Dog, Side Plank',
        exercises: [
            { name: 'Kardiyo Yürüyüş', sets: 1, reps: '25dk', time: null },
            { name: 'Dead Bug', sets: 3, reps: '12', time: 45 },
            { name: 'Bird Dog', sets: 3, reps: '12/Yön', time: 45 },
            { name: 'Side Plank', sets: 3, reps: '20s/Yön', time: 30 }
        ]
    }
];

let customPrograms = [];
const audioBell = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

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
        const saved = localStorage.getItem('ultimateFitnessState');
        if (saved !== null && saved !== "null" && saved !== "undefined") {
            const parsed = JSON.parse(saved);
            if (typeof parsed === 'object' && parsed !== null) {
                state = { ...state, ...parsed };
            }
        }
        
        // Strict fallback Checks
        if (!state.user || typeof state.user !== 'object') state.user = { name: '', height: null, weight: null, targetWeight: null, setupComplete: false, dailyCalorieGoal: 2000 };
        if (!state.user.dailyCalorieGoal) state.user.dailyCalorieGoal = 2000;
        if (!state.streak || typeof state.streak !== 'object') state.streak = { days: 0, lastDate: null, history: [] };
        if (!Array.isArray(state.streak.history)) state.streak.history = [];
        if (!state.water || typeof state.water !== 'object') state.water = { amount: 0, date: null, bottleSize: 750 };
        if (!state.water.bottleSize) state.water.bottleSize = 750;
        if (!state.calorie || typeof state.calorie !== 'object') state.calorie = { amount: 0, date: null };
        if (!Array.isArray(state.weightHistory)) state.weightHistory = [];

        const savedCustom = localStorage.getItem('ultimateFitnessPrograms');
        if (savedCustom !== null && savedCustom !== "null" && savedCustom !== "undefined") {
            customPrograms = JSON.parse(savedCustom);
        } else {
            customPrograms = JSON.parse(JSON.stringify(defaultPrograms)); // Deep copy defaults
            saveCustomPrograms();
        }
    } catch (err) {
        console.error("Local storage error:", err);
    }
}

function saveState() {
    localStorage.setItem('ultimateFitnessState', JSON.stringify(state));
}

function saveCustomPrograms() {
    localStorage.setItem('ultimateFitnessPrograms', JSON.stringify(customPrograms));
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
        const diffTime = Math.abs(todayObj - lastObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
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
    try {
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
                    btn.classList.add('text-electric');
                    btn.classList.remove('text-slate-500');
                } else if (btn.dataset.target) {
                    btn.classList.remove('text-electric');
                    btn.classList.add('text-slate-500');
                }
            });
        }
        
        const headerTitle = document.getElementById('header-title');
        const headerSubtitle = document.getElementById('header-subtitle');
        if(headerTitle && headerSubtitle) {
            if(viewId === 'dashboard') {
                headerTitle.textContent = `Tebrikler, ${state.user.name.split(' ')[0]}`;
                headerSubtitle.textContent = "Pes etme!";
            } else if(viewId === 'workout') {
                headerTitle.textContent = "Pro Antrenman";
                headerSubtitle.textContent = "Programını düzenle veya başla.";
            } else if(viewId === 'tracker') {
                headerTitle.textContent = "Makro & Sıvı";
                headerSubtitle.textContent = "Bedeni besle.";
            } else if(viewId === 'stats') {
                headerTitle.textContent = "Gelişim";
                headerSubtitle.textContent = "Zaman serisi grafiği.";
            } else if(viewId === 'settings') {
                headerTitle.textContent = "Ayarlar";
                headerSubtitle.textContent = "Uygulama kontrolü.";
            }
        }
        
        if(appContent) appContent.scrollTop = 0;
        if(viewId === 'stats') renderChartJs();

    } catch (err) {
        console.error("Navigation error:", err);
    }
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

// --- ONBOARDING ACTIONS ---
function handleOnboardingSubmit(e) {
    e.preventDefault();
    try {
        const nameInput = document.getElementById('user-name').value.trim();
        const heightInput = document.getElementById('user-height').value;
        const weightInput = document.getElementById('user-weight').value;
        
        if (!nameInput || !heightInput || !weightInput) return;

        const height = parseFloat(heightInput);
        const weight = parseFloat(weightInput);
        const targetInput = document.getElementById('user-target-weight').value;
        const targetWeight = targetInput ? parseFloat(targetInput) : weight;

        state.user.name = nameInput;
        state.user.height = height;
        state.user.weight = weight;
        state.user.targetWeight = targetWeight;
        
        // Akıllı kalori hesaplama (Harris-Benedict Basit)
        let bmr = 10 * weight + 6.25 * height - 5 * 25 + 5; // approx male 25yo
        let goal = Math.round(bmr * 1.55); // moderate activity
        if (targetWeight < weight) goal -= 400;
        else if (targetWeight > weight) goal += 400;
        state.user.dailyCalorieGoal = goal;

        state.user.setupComplete = true;
        state.weightHistory.push({ date: getTodayString(), weight: weight });
        
        saveState();
        updateUI();
        showMainApp();
    } catch(err) {
        console.error("Onboarding error:", err);
    }
}

// --- UI UPDATES ---
function updateUI() {
    try {
        if(!state.user.setupComplete) return;

        // Dashboard
        const streakEl = document.getElementById('streak-days');
        if(streakEl) streakEl.textContent = state.streak.days;

        // Tracker: Water
        const waterEl = document.getElementById('water-amount');
        if(waterEl) waterEl.textContent = state.water.amount;
        
        const bLabel = document.getElementById('bottle-size-lbl');
        if (bLabel) bLabel.textContent = state.water.bottleSize;

        const waterGoal = 3000; 
        const waterBg = document.getElementById('water-progress-bg');
        if(waterBg) {
            let pct = Math.min((state.water.amount / waterGoal) * 100, 100);
            waterBg.style.height = `${pct}%`;
        }

        // Tracker: Calorie
        const calEl = document.getElementById('calorie-amount');
        if(calEl) calEl.textContent = state.calorie.amount;
        
        const calGoalEl = document.getElementById('calorie-goal');
        if(calGoalEl) calGoalEl.textContent = state.user.dailyCalorieGoal;

        const calBar = document.getElementById('cal-progress-bar');
        if(calBar) {
            let cpct = Math.min((state.calorie.amount / state.user.dailyCalorieGoal) * 100, 100);
            calBar.style.width = `${cpct}%`;
            if (cpct >= 100) calBar.classList.add('bg-neon'); // Hedef aşıldığında neon
        }

        renderWorkouts();
    } catch (err) {
        console.error("UI update failed:", err);
    }
}

// --- WORKOUT CRUD & MANAGEMENT ---
function renderWorkouts() {
    const list = document.getElementById('program-list');
    if(!list) return;
    list.innerHTML = '';
    
    customPrograms.forEach(prog => {
        const div = document.createElement('div');
        div.className = 'glass rounded-2xl p-4 flex flex-col gap-3 transition-colors border-l-4 border-l-transparent hover:border-l-electric gap-3';
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="flex flex-col gap-1 min-w-0 pr-3">
                    <h3 class="font-bold text-white text-base truncate">${prog.title}</h3>
                    <p class="text-[11px] leading-tight text-slate-400 line-clamp-2">${prog.desc || prog.exercises.length + ' Egzersiz'}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="editProgram('${prog.id}')" class="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors nav-btn">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="confirmHealthAndStart('${prog.id}')" class="bg-neon/20 hover:bg-neon/30 text-neon p-2 rounded-xl transition-colors nav-btn shadow-[0_0_10px_rgba(57,255,20,0.1)]">
                        <i data-lucide="play" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            
        `;
        list.appendChild(div);
    });
    initIcons();
}

let pendingWorkoutId = null;

function confirmHealthAndStart(progId) {
    pendingWorkoutId = progId;
    const cw = document.getElementById('modal-health');
    if(cw) {
        cw.style.display = 'flex';
        cw.classList.remove('hidden');
    }
}

function acknowledgeHealthAndStart() {
    cancelHealthWarning();
    if(pendingWorkoutId) {
        startWorkout(pendingWorkoutId);
    }
}

function cancelHealthWarning() {
    pendingWorkoutId = null;
    const cw = document.getElementById('modal-health');
    if(cw) {
        cw.style.display = 'none';
        cw.classList.add('hidden');
    }
}

function startWorkout(progId) {
    const prog = customPrograms.find(p => p.id === progId);
    if(!prog) return;

    const titleEl = document.getElementById('active-workout-title');
    if(titleEl) titleEl.textContent = prog.title;
    
    const list = document.getElementById('active-exercise-list');
    if(!list) return;
    list.innerHTML = '';
    
    prog.exercises.forEach((ex, idx) => {
        const div = document.createElement('div');
        div.className = 'glass rounded-xl p-4 ml-6 relative flex flex-col gap-3';
        
        const dot = document.createElement('div');
        dot.className = 'absolute -left-[35px] top-6 w-4 h-4 rounded-full bg-slate-800 border-[3px] border-slate-950 z-10 transition-colors shadow-[0_0_0_2px_rgba(255,255,255,0.05)]';
        div.appendChild(dot);

        let timeBtn = ex.time ? `<button onclick="triggerTimer(${ex.time})" class="bg-electric/10 hover:bg-electric/20 text-electric border border-electric/20 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors nav-btn"><i data-lucide="timer" class="w-4 h-4"></i> ${ex.time}s Dinlenme</button>` : '';

        div.innerHTML += `
            <div class="flex justify-between items-start gap-4 p-1">
                <div class="flex flex-col gap-1 min-w-0">
                    <h4 class="font-bold text-slate-100 truncate">${ex.name}</h4>
                    <p class="text-sm text-electric/80 font-medium">${ex.sets} Set x ${ex.reps}</p>
                </div>
                <button onclick="toggleExerciseComplete(this, ${idx})" class="w-10 h-10 shrink-0 rounded-full glass flex items-center justify-center text-slate-500 hover:text-white hover:border-neon hover:bg-neon/30 transition-all nav-btn">
                    <i data-lucide="check" class="w-5 h-5"></i>
                </button>
            </div>
            ${timeBtn}
        `;
        list.appendChild(div);
    });

    navigateto('active-workout');
    initIcons();
}

function toggleExerciseComplete(btn, idx) {
    btn.classList.toggle('border-neon');
    btn.classList.toggle('bg-neon');
    btn.classList.toggle('text-slate-950');
    btn.classList.toggle('text-slate-500');
    btn.classList.toggle('glass');
    btn.classList.toggle('shadow-neon');
    
    const dot = btn.closest('.relative').querySelector('.absolute');
    if(btn.classList.contains('bg-neon')) {
        dot.classList.add('bg-neon', 'border-neon', 'shadow-neon');
        dot.classList.remove('bg-slate-800', 'border-slate-950');
        
        const today = getTodayString();
        // Record workout date in history if not present
        if (!state.streak.history.includes(today)) {
            state.streak.history.push(today);
        }
        if (state.streak.lastDate !== today) {
            state.streak.days++;
            state.streak.lastDate = today;
            saveState();
            updateUI();
        }
    } else {
        dot.classList.remove('bg-neon', 'border-neon', 'shadow-neon');
        dot.classList.add('bg-slate-800', 'border-slate-950');
    }
}

function closeActiveWorkout() {
    navigateto('workout');
    stopTimer();
    hideTimerPanel();
}

// --- PROGRAM EDITOR (CRUD) ---
function openProgramEditor(id = null) {
    const cw = document.getElementById('modal-editor');
    if(cw) {
        cw.style.display = 'flex';
        cw.classList.remove('hidden');
    }

    const titleInput = document.getElementById('edit-prog-title');
    const descInput = document.getElementById('edit-prog-desc');
    const idInput = document.getElementById('edit-prog-id');
    const exList = document.getElementById('edit-ex-list');
    exList.innerHTML = '';
    
    if (id) {
        const prog = customPrograms.find(p => p.id === id);
        titleInput.value = prog.title;
        descInput.value = prog.desc;
        idInput.value = prog.id;
        
        prog.exercises.forEach(ex => {
            addExRow(ex.name, ex.sets, ex.reps, ex.time);
        });
    } else {
        titleInput.value = '';
        descInput.value = '';
        idInput.value = '';
        addExRow();
    }
}

function editProgram(id) {
    openProgramEditor(id);
}

function closeEditor() {
    const cw = document.getElementById('modal-editor');
    if(cw) {
        cw.style.display = 'none';
        cw.classList.add('hidden');
    }
}

function addExRow(name='', sets=3, reps='12', time='') {
    const list = document.getElementById('edit-ex-list');
    const div = document.createElement('div');
    div.className = 'glass p-3 rounded-xl flex flex-col gap-2 relative';
    div.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><i data-lucide="x" class="w-3 h-3"></i></button>
        <input type="text" class="ex-name w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-3 text-sm text-white" placeholder="Hareket Adı (örn: Push Up)" value="${name}">
        <div class="flex gap-2">
            <input type="number" class="ex-sets w-1/4 bg-slate-900 border border-slate-800 rounded-lg px-2 py-3 text-center text-sm text-white" placeholder="Set" value="${sets}">
            <input type="text" class="ex-reps w-1/4 bg-slate-900 border border-slate-800 rounded-lg px-2 py-3 text-center text-sm text-white" placeholder="Tekrar" value="${reps}">
            <input type="number" class="ex-time flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-3 text-center text-sm text-white" placeholder="Sn (Dinlenme)" value="${time}">
        </div>
    `;
    list.appendChild(div);
    initIcons();
}

function saveProgram() {
    const title = document.getElementById('edit-prog-title').value.trim();
    const desc = document.getElementById('edit-prog-desc').value.trim();
    const id = document.getElementById('edit-prog-id').value;
    
    if(!title) {
        alert("Lütfen program adı girin.");
        return;
    }

    const rows = document.querySelectorAll('#edit-ex-list > div');
    const exercises = [];
    rows.forEach(r => {
        const name = r.querySelector('.ex-name').value;
        const sets = parseInt(r.querySelector('.ex-sets').value) || 1;
        const reps = r.querySelector('.ex-reps').value || '1';
        const timeVal = parseInt(r.querySelector('.ex-time').value);
        const time = isNaN(timeVal) ? null : timeVal;
        
        if (name) exercises.push({name, sets, reps, time});
    });

    if (exercises.length === 0) {
        alert("En az bir egzersiz girmelisiniz.");
        return;
    }

    if(id) {
        // Update
        const idx = customPrograms.findIndex(p => p.id === id);
        if(idx !== -1) {
            customPrograms[idx] = { id, title, desc, exercises };
        }
    } else {
        // Create
        customPrograms.push({
            id: 'p_' + Date.now(),
            title, desc, exercises
        });
    }

    saveCustomPrograms();
    renderWorkouts();
    closeEditor();
}

// --- TIMER LOGIC ---
let timerInterval;
const timerDisplay = document.getElementById('timer-display');
const timerPanel = document.getElementById('timer-panel');

function triggerTimer(seconds) {
    showTimerPanel();
    startTimer(seconds);
}

function startTimer(seconds) {
    clearInterval(timerInterval);
    let timeLeft = seconds;
    
    updateTimerDisplay(timeLeft);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        
        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            audioBell.currentTime = 0;
            audioBell.play().catch(e=>console.log("Audio play prevented", e));
            setTimeout(() => hideTimerPanel(), 2500);
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay(0);
    hideTimerPanel();
}

function updateTimerDisplay(s) {
    if(!timerDisplay) return;
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
}

function showTimerPanel() {
    if(!timerPanel) return;
    timerPanel.style.opacity = '1';
    timerPanel.style.pointerEvents = 'auto';
    timerPanel.classList.remove('translate-y-[200%]');
}
function hideTimerPanel() {
    if(!timerPanel) return;
    timerPanel.style.opacity = '0';
    timerPanel.style.pointerEvents = 'none';
    timerPanel.classList.add('translate-y-[200%]');
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

function openCustomWaterMenu() {
    const amt = prompt("Özel Matara Miktarı (ml) nedir?", state.water.bottleSize);
    if(amt && !isNaN(amt)) {
        state.water.bottleSize = parseInt(amt);
        saveState();
        updateUI();
    }
}

function addCalorie() {
    const input = document.getElementById('calorie-input');
    if(!input) return;
    const cal = parseInt(input.value);
    if(cal && !isNaN(cal)) {
        state.calorie.amount += cal;
        input.value = '';
        saveState();
        updateUI();
    }
}

// --- STATS LOGIC (Chart.js implementation) ---
let myChart = null;

function renderChartJs() {
    const ctx = document.getElementById('weightChart');
    if(!ctx) return;
    
    if(state.weightHistory.length === 0) return;

    if (myChart) {
        myChart.destroy();
    }

    const recent = state.weightHistory.slice(-10); // last 10 entries
    const labels = recent.map(item => item.date.substring(5)); // MM-DD
    const data = recent.map(item => item.weight);

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Kilo (kg)',
                data: data,
                borderColor: '#00e5ff',
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#00e5ff',
                pointBorderColor: '#020617',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { color: '#94a3b8', font: { size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { color: '#94a3b8', font: { size: 10 } }
                }
            }
        }
    });
}

function updateWeightDialog() {
    const weight = prompt("Bugünkü kilonuzu girin:", state.user.weight);
    if(weight && !isNaN(weight)) {
        const parsed = parseFloat(weight);
        state.user.weight = parsed;
        
        const today = getTodayString();
        const lastEntry = state.weightHistory[state.weightHistory.length - 1];
        if(lastEntry && lastEntry.date === today) {
            lastEntry.weight = parsed;
        } else {
            state.weightHistory.push({date: today, weight: parsed});
        }
        
        saveState();
        if (myChart) renderChartJs();
    }
}

// --- CALENDAR LOGIC ---
function openCalendar() {
    const cw = document.getElementById('modal-calendar');
    if(cw) {
        cw.style.display = 'flex';
        cw.classList.remove('hidden');
    }
    
    const d = new Date();
    const month = d.getMonth();
    const year = d.getFullYear();
    
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    document.getElementById('cal-month-title').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // JS getDay is 0 (Sun) to 6 (Sat). Let's convert to Mon=0
    let emptyDays = firstDay === 0 ? 6 : firstDay - 1;
    
    const calGrid = document.getElementById('cal-grid');
    calGrid.innerHTML = '';
    
    // Add empty slots
    for(let i=0; i<emptyDays; i++) {
        const div = document.createElement('div');
        div.className = 'w-8 h-8';
        calGrid.appendChild(div);
    }
    
    for(let i=1; i<=daysInMonth; i++) {
        const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const hasWorkedOut = state.streak.history.includes(ds);
        
        const div = document.createElement('div');
        div.className = 'flex flex-col items-center gap-1';
        
        const ring = document.createElement('div');
        ring.className = `ring-container ${hasWorkedOut ? 'ring-active' : ''}`;
        ring.innerHTML = `<span class="text-[10px] font-bold ${hasWorkedOut ? 'text-neon' : 'text-slate-500'}">${i}</span>`;
        
        div.appendChild(ring);
        calGrid.appendChild(div);
    }
}

function closeCalendar() {
    const cw = document.getElementById('modal-calendar');
    if(cw) {
        cw.style.display = 'none';
        cw.classList.add('hidden');
    }
}

// --- SETTINGS LOGIC ---
function openProfileEdit() {
    const newName = prompt("Adınızı güncelleyin:", state.user.name);
    if(newName) {
        state.user.name = newName;
        saveState();
        updateUI();
    }
}

function confirmReset() {
    if(confirm("TÜM VERİLERİ SİLİYORSUNUZ! (Streakler, Su, Kalori, Antrenmanlar). Emin misiniz?")) {
        localStorage.removeItem('ultimateFitnessState');
        localStorage.removeItem('ultimateFitnessPrograms');
        window.location.reload();
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {    
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
