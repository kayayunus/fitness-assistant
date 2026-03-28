// app.js

// Function to safely init icons
function initIcons() {
    if (typeof lucide !== 'undefined') {
        try { lucide.createIcons(); } catch(e) { console.warn("Lucide err", e); }
    }
}

// Elements
let onboardingView;
let mainContent;
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
    weightHistory: [] // {date: 'YYYY-MM-DD', weight: 70}
};

const defaultPrograms = [
    {
        id: 'day1',
        title: 'Gün 1 (Hipertansiyon/Böbrek Odaklı)',
        desc: 'Chest Press, Lat Pulldown, 120-130 bpm limitleri',
        exercises: [
            { name: 'Chest Press', sets: 3, reps: '12', time: 60 },
            { name: 'Lat Pulldown', sets: 3, reps: '12', time: 60 },
            { name: 'Lateral Raise', sets: 3, reps: '12', time: 60 },
            { name: 'Leg Press', sets: 3, reps: '12', time: 60 },
            { name: 'Plank', sets: 3, reps: '20sn', time: 20 }
        ]
    },
    {
        id: 'day2',
        title: 'Gün 2 (Kardiyo/Mobilite)',
        desc: 'Aktif dinlenme ve esneklik.',
        exercises: [
            { name: 'Yürüyüş (110-120 bpm)', sets: 1, reps: '20-30dk', time: null },
            { name: 'Mobilite/Esneme', sets: 1, reps: '10dk', time: null },
            { name: 'Yoga', sets: 1, reps: '15dk', time: null }
        ]
    },
    {
        id: 'day3',
        title: 'Gün 3 (Full Body/Kardiyo)',
        desc: 'Güç ve Kondisyon karışımı.',
        exercises: [
            { name: 'Incline Press', sets: 3, reps: '12', time: 60 },
            { name: 'Seated Row', sets: 3, reps: '12', time: 60 },
            { name: 'Shoulder Press', sets: 3, reps: '12', time: 60 },
            { name: 'Bodyweight Squat', sets: 3, reps: '15', time: 45 }
        ]
    },
    {
        id: 'day4',
        title: 'Gün 4 (Kardiyo/Core)',
        desc: 'Merkez bölge (Core) ve yağ yakımı.',
        exercises: [
            { name: 'Dead Bug', sets: 3, reps: '12', time: 45 },
            { name: 'Bird Dog', sets: 3, reps: '12', time: 45 },
            { name: 'Side Plank', sets: 3, reps: '15s', time: 30 }
        ]
    }
];

let customPrograms = [];
// Temiz zil sesi - URI
const audioBell = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// --- INITIALIZATION ---
function init() {
    onboardingView = document.getElementById('onboarding');
    mainContent = document.getElementById('main-content');
    bottomNav = document.getElementById('bottom-nav');
    viewSections = document.querySelectorAll('.view-section');
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
        const saved = localStorage.getItem('fitnessAppState');
        if (saved !== null && saved !== "null" && saved !== "undefined") {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
            // Structural fallback checks
            if (!state.user) state.user = { name: '', height: null, weight: null, targetWeight: null, setupComplete: false };
            if (!state.streak) state.streak = { days: 0, lastDate: null };
            if (!state.water) state.water = { amount: 0, date: null };
            if (!state.calorie) state.calorie = { amount: 0, date: null };
            if (!Array.isArray(state.weightHistory)) state.weightHistory = [];
        }
        const savedCustom = localStorage.getItem('fitnessCustomPrograms');
        if (savedCustom !== null && savedCustom !== "null" && savedCustom !== "undefined") {
            const parsedCustom = JSON.parse(savedCustom);
            customPrograms = Array.isArray(parsedCustom) ? parsedCustom : [];
        }
    } catch (err) {
        console.error("Local storage error:", err);
    }
}

function saveState() {
    localStorage.setItem('fitnessAppState', JSON.stringify(state));
}

function saveCustomPrograms() {
    localStorage.setItem('fitnessCustomPrograms', JSON.stringify(customPrograms));
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
            state.streak.days = 0; // Seri bozuldu
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
    try {
        viewSections.forEach(sec => {
            if(sec.id === 'view-' + viewId) {
                sec.style.display = 'flex';
            } else {
                sec.style.display = 'none';
            }
        });

        navButtons.forEach(btn => {
            if(btn.dataset.target === viewId) {
                btn.classList.add('text-blue-500');
                btn.classList.remove('text-slate-500');
            } else {
                btn.classList.remove('text-blue-500');
                btn.classList.add('text-slate-500');
            }
        });
    } catch (err) {
        console.error("Navigation error:", err);
    }
}

function showOnboarding() {
    if (onboardingView) onboardingView.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
}

function showMainApp() {
    if (onboardingView) onboardingView.style.display = 'none';
    if (mainContent) mainContent.style.display = 'flex';
    if (bottomNav) bottomNav.style.display = 'block';
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
            alert("Lütfen İsim, Boy ve Kilo alanlarını doldurduğunuzdan emin olun.");
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
        console.error("Onboarding submission failed:", err);
        alert("Kayıt tamamlanamadı. Konsol hatalarını kontrol ediniz.");
    }
}

// --- UI UPDATES ---
function updateUI() {
    try {
        if(!state.user.setupComplete) return;

        document.getElementById('display-name').textContent = state.user.name;
        document.getElementById('streak-days').textContent = state.streak.days;

        document.getElementById('water-amount').textContent = state.water.amount;
        document.getElementById('calorie-amount').textContent = state.calorie.amount;
        
        const waterGoal = 3000; 
        let pct = Math.min((state.water.amount / waterGoal) * 100, 100);
        document.getElementById('water-progress-bg').style.height = `${pct}%`;

        renderWorkouts();
        renderWeightChart();
    } catch (err) {
        console.error("UI update failed:", err);
    }
}

// --- WORKOUT LOGIC ---
function renderWorkouts() {
    const list = document.getElementById('program-list');
    list.innerHTML = '';
    
    const allProgs = [...defaultPrograms, ...customPrograms];
    
    allProgs.forEach(prog => {
        const div = document.createElement('div');
        div.className = 'glass rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors border-l-4 border-l-transparent hover:border-l-blue-500';
        div.innerHTML = `
            <div>
                <h3 class="font-bold text-white text-base">${prog.title}</h3>
                <p class="text-xs text-slate-400 mt-1">${prog.desc || prog.exercises.length + ' Egzersiz'}</p>
            </div>
            <button onclick="startWorkout('${prog.id}')" class="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 rounded-xl transition-colors">
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

    document.getElementById('active-workout-title').textContent = prog.title;
    
    const list = document.getElementById('active-exercise-list');
    list.innerHTML = '';
    
    prog.exercises.forEach((ex, idx) => {
        const div = document.createElement('div');
        div.className = 'bg-slate-800/50 rounded-xl p-4 ml-6 relative';
        
        const dot = document.createElement('div');
        dot.className = 'absolute -left-[35px] top-5 w-4 h-4 rounded-full bg-slate-700 border-4 border-slate-900 z-10 transition-colors';
        div.appendChild(dot);

        let timeBtn = ex.time ? `<button onclick="triggerTimer(${ex.time})" class="mt-3 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 flex items-center gap-1 transition-colors"><i data-lucide="timer" class="w-3 h-3"></i> ${ex.time}s Dinlenme</button>` : '';

        div.innerHTML += `
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-bold text-slate-100">${ex.name}</h4>
                    <p class="text-sm text-slate-400 mt-1">${ex.sets} Set x ${ex.reps}</p>
                </div>
                <button onclick="toggleExerciseComplete(this, ${idx})" class="w-8 h-8 rounded-full border-2 border-slate-600 flex items-center justify-center text-slate-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors">
                    <i data-lucide="check" class="w-4 h-4"></i>
                </button>
            </div>
            ${timeBtn}
        `;
        list.appendChild(div);
    });

    document.getElementById('view-active-workout').classList.remove('hidden');
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
    document.getElementById('view-active-workout').classList.add('hidden');
    stopTimer();
    hideTimerPanel();
}

function openCustomWorkoutModal() {
    document.getElementById('view-custom-workout').classList.remove('hidden');
    document.getElementById('custom-ex-list').innerHTML = '';
    document.getElementById('custom-prog-name').value = '';
    addCustomExerciseRow();
}

function closeCustomWorkoutModal() {
    document.getElementById('view-custom-workout').classList.add('hidden');
}

function addCustomExerciseRow() {
    const list = document.getElementById('custom-ex-list');
    const div = document.createElement('div');
    div.className = 'glass p-3 rounded-xl flex flex-col gap-2 relative';
    div.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><i data-lucide="x" class="w-3 h-3"></i></button>
        <input type="text" class="ex-name w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Hareket Adı (örn: Push Up)">
        <div class="flex gap-2">
            <input type="number" class="ex-sets flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Set">
            <input type="text" class="ex-reps flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Tekrar">
            <input type="number" class="ex-time flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="Sn (Zaman)">
        </div>
    `;
    list.appendChild(div);
    initIcons();
}

function saveCustomProgram() {
    const title = document.getElementById('custom-prog-name').value.trim();
    if(!title) {
        alert("Lütfen program adı girin.");
        return;
    }

    const rows = document.querySelectorAll('#custom-ex-list > div');
    const exercises = [];
    rows.forEach(r => {
        const name = r.querySelector('.ex-name').value;
        const sets = parseInt(r.querySelector('.ex-sets').value) || 1;
        const reps = r.querySelector('.ex-reps').value || '1';
        const timeVal = parseInt(r.querySelector('.ex-time').value);
        const time = isNaN(timeVal) ? null : timeVal;
        
        if (name) {
            exercises.push({name, sets, reps, time});
        }
    });

    if (exercises.length === 0) {
        alert("En az bir egzersiz girmelisiniz.");
        return;
    }

    const newProg = {
        id: 'c_' + Date.now(),
        title,
        desc: 'Özel Antrenman',
        exercises
    };

    customPrograms.push(newProg);
    saveCustomPrograms();
    renderWorkouts();
    closeCustomWorkoutModal();
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
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    timerDisplay.textContent = \`\${mins}:\${secs}\`;
}

function showTimerPanel() {
    timerPanel.classList.remove('translate-y-full');
}
function hideTimerPanel() {
    timerPanel.classList.add('translate-y-full');
}

// --- TRACKER LOGIC ---
function addWater(ml) {
    state.water.amount += ml;
    saveState();
    updateUI();
}

function openCustomWaterMenu() {
    const amt = prompt("Kaç ml su içtiniz?", "500");
    if(amt && !isNaN(amt)) {
        addWater(parseInt(amt));
    }
}

function addCalorie() {
    const input = document.getElementById('calorie-input');
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
    chart.innerHTML = '';
    
    if(state.weightHistory.length === 0) return;
    
    const recent = state.weightHistory.slice(-5);
    const maxWeight = Math.max(...recent.map(w => w.weight)) + 10;
    
    recent.forEach(item => {
        const heightPct = Math.max(10, (item.weight / maxWeight) * 100);
        const col = document.createElement('div');
        col.className = 'flex flex-col items-center flex-1 gap-1';
        col.innerHTML = `
            <span class="text-[10px] text-blue-400 font-medium">${item.weight}</span>
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
    try {
        if(confirm("Emin misiniz? Tüm ilerlemeleriniz, profiliniz ve serileriniz kalıcı olarak silinecektir.")) {
            localStorage.removeItem('fitnessAppState');
            localStorage.removeItem('fitnessCustomPrograms');
            window.location.reload();
        }
    } catch(err) {
        console.error("Sıfırlama sırasında hata oluştu:", err);
        alert("Bir hata oluştu, lütfen uygulamayı yenileyip tekrar deneyin.");
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
