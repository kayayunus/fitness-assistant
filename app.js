// app.js

// Function to safely init icons
function initIcons() {
    if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) { console.warn("Lucide err", e); }
    }
}

// Elements
let onboardingView;
let mainApp;
let appHeader;
let appContent;
let bottomNav;
let viewSections;
let navButtons;

// --- STATE MANAGEMENT ---
let state = {
    user: {
        name: '',
        height: null,
        weight: null,
        targetWeight: null,
        setupComplete: false
    },
    streak: {
        days: 0,
        lastDate: null
    },
    water: {
        amount: 0,
        date: null
    },
    calorie: {
        amount: 0,
        date: null
    },
    weightHistory: []
};

// HARCODED PROGRAMS AS REQUESTED
const defaultPrograms = [
    {
        id: 'day1',
        title: 'Gün 1: Full Body Hafif Ağırlık',
        desc: 'Chest Press, Lat Pulldown, Lateral Raise, Leg Press, Plank',
        exercises: [
            { name: 'Chest Press', sets: 3, reps: '12', time: 60 },
            { name: 'Lat Pulldown', sets: 3, reps: '12', time: 60 },
            { name: 'Lateral Raise', sets: 3, reps: '12', time: 60 },
            { name: 'Leg Press', sets: 3, reps: '12', time: 60 },
            { name: 'Plank', sets: 3, reps: '30sn', time: 30 }
        ]
    },
    {
        id: 'day2',
        title: 'Gün 2: Kardiyo & Mobilite',
        desc: 'Kardiyo (110-120 bpm) ve Mobilite/Yoga',
        exercises: [
            { name: 'Yürüyüş/Kardiyo (110-120 bpm)', sets: 1, reps: '30dk', time: null },
            { name: 'Mobilite ve Esneme', sets: 1, reps: '15dk', time: null },
            { name: 'Yoga', sets: 1, reps: '15dk', time: null }
        ]
    },
    {
        id: 'day3',
        title: 'Gün 3: Full Body ve Kardiyo',
        desc: 'Incline Press, Seated Row, Shoulder Press, Squat',
        exercises: [
            { name: 'Incline Press', sets: 3, reps: '12', time: 60 },
            { name: 'Seated Row', sets: 3, reps: '12', time: 60 },
            { name: 'Shoulder Press', sets: 3, reps: '12', time: 60 },
            { name: 'Bodyweight Squat', sets: 3, reps: '15', time: 45 }
        ]
    },
    {
        id: 'day4',
        title: 'Gün 4: Kardiyo ve Core',
        desc: 'Dead Bug, Bird Dog, Side Plank',
        exercises: [
            { name: 'Kardiyo Isınma', sets: 1, reps: '10dk', time: null },
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
    
    // Attach event listeners safely
    const onboardingForm = document.getElementById('onboarding-form');
    if (onboardingForm) {
        onboardingForm.addEventListener('submit', handleOnboardingSubmit);
    }

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
        const saved = localStorage.getItem('fitnessAppStateMaster');
        if (saved !== null && saved !== "null" && saved !== "undefined") {
            const parsed = JSON.parse(saved);
            if (typeof parsed === 'object' && parsed !== null) {
                state = { ...state, ...parsed };
            }
        }
        
        // Strict fallback Checks
        if (!state.user || typeof state.user !== 'object') state.user = { name: '', height: null, weight: null, targetWeight: null, setupComplete: false };
        if (!state.streak || typeof state.streak !== 'object') state.streak = { days: 0, lastDate: null };
        if (!state.water || typeof state.water !== 'object') state.water = { amount: 0, date: null };
        if (!state.calorie || typeof state.calorie !== 'object') state.calorie = { amount: 0, date: null };
        if (!Array.isArray(state.weightHistory)) state.weightHistory = [];

        const savedCustom = localStorage.getItem('fitnessCustomProgramsMaster');
        if (savedCustom !== null && savedCustom !== "null" && savedCustom !== "undefined") {
            const parsedCustom = JSON.parse(savedCustom);
            customPrograms = Array.isArray(parsedCustom) ? parsedCustom : [];
        }
    } catch (err) {
        console.error("Local storage error:", err);
    }
}

function saveState() {
    localStorage.setItem('fitnessAppStateMaster', JSON.stringify(state));
}

function saveCustomPrograms() {
    localStorage.setItem('fitnessCustomProgramsMaster', JSON.stringify(customPrograms));
}

function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
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
        // Toggling display values directly prevents layout shifts caused by overlapping tailwind classes
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
                    btn.classList.add('text-blue-500');
                    btn.classList.remove('text-slate-500');
                } else if (btn.dataset.target) {
                    btn.classList.remove('text-blue-500');
                    btn.classList.add('text-slate-500');
                }
            });
        }
        
        // Dynamically update the header title clamping
        const headerTitle = document.getElementById('header-title');
        const headerSubtitle = document.getElementById('header-subtitle');
        if(headerTitle && headerSubtitle) {
            if(viewId === 'dashboard') {
                headerTitle.textContent = `Hoş geldin, ${state.user.name.split(' ')[0]}`;
                headerSubtitle.textContent = "Bugün nasılsın?";
            } else if(viewId === 'workout') {
                headerTitle.textContent = "Antrenman";
                headerSubtitle.textContent = "Programını seç.";
            } else if(viewId === 'tracker') {
                headerTitle.textContent = "Su & Kalori";
                headerSubtitle.textContent = "Tüketimini izle.";
            } else if(viewId === 'stats') {
                headerTitle.textContent = "Durum";
                headerSubtitle.textContent = "Gelişimini takip et.";
            } else if(viewId === 'settings') {
                headerTitle.textContent = "Ayarlar";
                headerSubtitle.textContent = "Tercihlerim.";
            }
        }
        
        // Reset scroll position gracefully
        if(appContent) appContent.scrollTop = 0;
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
    if (mainApp) mainApp.style.display = 'grid'; // Crucial for layout
    navigateto('dashboard');
}

// --- ONBOARDING ACTIONS ---
function handleOnboardingSubmit(e) {
    e.preventDefault();
    try {
        const nameInput = document.getElementById('user-name').value.trim();
        const heightInput = document.getElementById('user-height').value;
        const weightInput = document.getElementById('user-weight').value;
        
        if (!nameInput || !heightInput || !weightInput) {
            alert("Lütfen alanları tam doldurun.");
            return;
        }

        const height = parseFloat(heightInput);
        const weight = parseFloat(weightInput);
        const targetInput = document.getElementById('user-target-weight').value;
        const targetWeight = targetInput ? parseFloat(targetInput) : weight;

        state.user.name = nameInput;
        state.user.height = height;
        state.user.weight = weight;
        state.user.targetWeight = targetWeight;
        state.user.setupComplete = true;
        
        state.weightHistory.push({ date: getTodayString(), weight: weight });
        
        saveState();
        updateUI();
        showMainApp();
    } catch(err) {
        console.error("Onboarding error:", err);
        alert('Hata oluştu, tekrar deneyin.');
    }
}

// --- UI UPDATES ---
function updateUI() {
    try {
        if(!state.user.setupComplete) return;

        const streakEl = document.getElementById('streak-days');
        if(streakEl) streakEl.textContent = state.streak.days;

        const waterEl = document.getElementById('water-amount');
        if(waterEl) waterEl.textContent = state.water.amount;

        const calEl = document.getElementById('calorie-amount');
        if(calEl) calEl.textContent = state.calorie.amount;
        
        const waterGoal = 3000; 
        const waterBg = document.getElementById('water-progress-bg');
        if(waterBg) {
            let pct = Math.min((state.water.amount / waterGoal) * 100, 100);
            waterBg.style.height = `${pct}%`;
        }

        renderWorkouts();
        renderWeightChart();
    } catch (err) {
        console.error("UI update failed:", err);
    }
}

// --- WORKOUT LOGIC ---
function renderWorkouts() {
    const list = document.getElementById('program-list');
    if(!list) return;
    list.innerHTML = '';
    
    const allProgs = [...defaultPrograms, ...customPrograms];
    
    allProgs.forEach(prog => {
        const div = document.createElement('div');
        div.className = 'glass glass-apple rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors border-l-4 border-l-transparent hover:border-l-blue-500 gap-3';
        div.innerHTML = `
            <div class="flex flex-col gap-1 min-w-0">
                <h3 class="font-bold text-white text-base truncate">${prog.title}</h3>
                <p class="text-[11px] leading-tight text-slate-400 line-clamp-2">${prog.desc || prog.exercises.length + ' Egzersiz'}</p>
            </div>
            <button onclick="startWorkout('${prog.id}')" class="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-3 rounded-xl transition-colors shrink-0 flex items-center justify-center nav-btn">
                <i data-lucide="play" class="w-5 h-5"></i>
            </button>
        `;
        list.appendChild(div);
    });
    initIcons();
}

function startWorkout(progId) {
    const allProgs = [...defaultPrograms, ...customPrograms];
    const prog = allProgs.find(p => p.id === progId);
    if(!prog) return;

    const titleEl = document.getElementById('active-workout-title');
    if(titleEl) titleEl.textContent = prog.title;
    
    const list = document.getElementById('active-exercise-list');
    if(!list) return;
    list.innerHTML = '';
    
    prog.exercises.forEach((ex, idx) => {
        const div = document.createElement('div');
        div.className = 'bg-slate-800/50 rounded-xl p-4 ml-6 relative flex flex-col gap-3';
        
        const dot = document.createElement('div');
        dot.className = 'absolute -left-[35px] top-6 w-4 h-4 rounded-full bg-slate-700 border-4 border-slate-900 z-10 transition-colors';
        div.appendChild(dot);

        let timeBtn = ex.time ? `<button onclick="triggerTimer(${ex.time})" class="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 flex items-center justify-center gap-2 transition-colors nav-btn"><i data-lucide="timer" class="w-4 h-4"></i> ${ex.time}s Dinlenme</button>` : '';

        div.innerHTML += `
            <div class="flex justify-between items-start gap-4 p-1">
                <div class="flex flex-col gap-1 min-w-0">
                    <h4 class="font-bold text-slate-100 truncate">${ex.name}</h4>
                    <p class="text-sm text-slate-400">${ex.sets} Set x ${ex.reps}</p>
                </div>
                <button onclick="toggleExerciseComplete(this, ${idx})" class="w-10 h-10 shrink-0 rounded-full border-2 border-slate-600 flex items-center justify-center text-slate-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors nav-btn">
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
    btn.classList.toggle('border-green-500');
    btn.classList.toggle('bg-green-500');
    btn.classList.toggle('text-white');
    btn.classList.toggle('text-slate-600');
    btn.classList.toggle('border-slate-600');
    
    const dot = btn.closest('.relative').querySelector('.absolute');
    if(btn.classList.contains('bg-green-500')) {
        dot.classList.replace('bg-slate-700', 'bg-green-500');
        
        const today = getTodayString();
        if (state.streak.lastDate !== today) {
            state.streak.days++;
            state.streak.lastDate = today;
            saveState();
            updateUI();
        }
    } else {
        dot.classList.replace('bg-green-500', 'bg-slate-700');
    }
}

function closeActiveWorkout() {
    navigateto('workout');
    stopTimer();
    hideTimerPanel();
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
            setTimeout(() => {
                hideTimerPanel();
            }, 2500);
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

function openCustomWaterMenu() {
    const amt = prompt("Özel Matara Miktarı (ml) nedir?", "750");
    if(amt && !isNaN(amt)) {
        addWater(parseInt(amt));
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

// --- STATS LOGIC ---
function renderWeightChart() {
    const chart = document.getElementById('weight-chart');
    if(!chart) return;
    chart.innerHTML = '';
    
    if(state.weightHistory.length === 0) return;
    
    const recent = state.weightHistory.slice(-5);
    const maxWeight = Math.max(...recent.map(w => w.weight)) + 10;
    
    recent.forEach(item => {
        const heightPct = Math.max(10, (item.weight / maxWeight) * 100);
        const col = document.createElement('div');
        col.className = 'flex flex-col items-center flex-1 gap-1 min-w-0';
        col.innerHTML = `
            <span class="text-[10px] text-blue-400 font-medium truncate">${item.weight}</span>
            <div class="w-full bg-blue-500/50 rounded-t-sm transition-all duration-700" style="height: ${heightPct}px"></div>
            <span class="text-[9px] text-slate-500 mt-1 truncate max-w-full">${item.date.substring(5)}</span>
        `;
        chart.appendChild(col);
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
        updateUI();
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
    if(confirm("Emin misiniz? Tüm ilerlemeleriniz tamamen silinecektir.")) {
        localStorage.removeItem('fitnessAppStateMaster');
        localStorage.removeItem('fitnessCustomProgramsMaster');
        window.location.reload();
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
