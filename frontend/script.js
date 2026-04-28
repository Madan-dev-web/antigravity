// ==========================================
// 1. STATE & UTILS
// ==========================================
const API_URL = 'http://localhost:5000/api';
let currentUser = null;

const getToken = () => localStorage.getItem('aria_token');
const setToken = (token) => localStorage.setItem('aria_token', token);
const removeToken = () => localStorage.removeItem('aria_token');

const getUser = () => JSON.parse(localStorage.getItem('aria_user'));
const setUser = (user) => localStorage.setItem('aria_user', JSON.stringify(user));
const removeUser = () => localStorage.removeItem('aria_user');

// Fetch Wrapper with Auth
async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };
    
    // If FormData, remove content type so browser sets it with boundary
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API Error');
    return data;
}

// ==========================================
// 2. AUTHENTICATION (Login / Register)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const path = window.location.pathname;

    // Redirect if already logged in (except on dashboard)
    if (getToken() && (path.includes('login.html') || path.includes('register.html') || path.endsWith('/'))) {
        window.location.href = 'dashboard.html';
    }
    // Redirect if NOT logged in (on dashboard)
    if (!getToken() && path.includes('dashboard.html')) {
        window.location.href = 'login.html';
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('loginError');
            
            try {
                const data = await apiFetch('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                setToken(data.token);
                setUser(data.user);
                window.location.href = 'dashboard.html';
            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.classList.remove('d-none');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('registerError');
            
            try {
                const data = await apiFetch('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password })
                });
                setToken(data.token);
                setUser(data.user);
                window.location.href = 'dashboard.html';
            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.classList.remove('d-none');
            }
        });
    }

    // Dashboard Initialization
    if (path.includes('dashboard.html')) {
        initDashboard();
    }
});

// ==========================================
// 3. DASHBOARD INIT & ROUTING
// ==========================================
function initDashboard() {
    currentUser = getUser();
    if (currentUser) {
        document.getElementById('welcomeName').textContent = currentUser.name.split(' ')[0];
        document.getElementById('userProfileName').innerHTML = `👤 ${currentUser.name}`;
    }

    // Navigation
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const sections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(sec => sec.classList.add('d-none'));
            
            item.classList.add('active');
            document.getElementById(item.dataset.target).classList.remove('d-none');
            
            // Trigger specific loads
            if (item.dataset.target === 'dashboard') loadStats();
            if (item.dataset.target === 'recordings') loadRecordings();
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        removeToken();
        removeUser();
        window.location.href = 'index.html';
    });

    // Load initial data
    loadStats();
    initAudioRecorder();
    initChat();
    initNotes();
    initReminders();
    initATS();
}

async function loadStats() {
    try {
        const data = await apiFetch('/audio/stats/overview');
        if (data.success) {
            document.getElementById('statTotalRecs').textContent = data.stats.totalRecordings;
            document.getElementById('statFavorites').textContent = data.stats.favorites;
            
            if (data.stats.moods && data.stats.moods.length > 0) {
                // Find most common mood
                const sortedMoods = data.stats.moods.sort((a,b) => b.count - a.count);
                document.getElementById('statMood').textContent = sortedMoods[0]._id.charAt(0).toUpperCase() + sortedMoods[0]._id.slice(1);
            }

            const recentList = document.getElementById('recentActivityList');
            if (data.stats.recentRecordings.length > 0) {
                recentList.innerHTML = data.stats.recentRecordings.map(rec => `
                    <div style="padding: 1rem; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between;">
                        <span>🎙️ ${rec.title}</span>
                        <span class="text-muted">${new Date(rec.createdAt).toLocaleDateString()}</span>
                    </div>
                `).join('');
            }
        }
    } catch (err) {
        console.error("Error loading stats", err);
    }
}

// ==========================================
// 4. VOICE RECORDER
// ==========================================
let mediaRecorder;
let audioChunks = [];
let audioBlob;
let isRecording = false;
let recordInterval;
let startTime;
let audioContext, analyser, microphone, javascriptNode;

function initAudioRecorder() {
    const recordBtn = document.getElementById('recordBtn');
    const recordWrapper = document.getElementById('recordWrapper');
    const recordStatus = document.getElementById('recordStatus');
    const recordTimer = document.getElementById('recordTimer');
    const canvas = document.getElementById('visualizer');
    const playbackArea = document.getElementById('playbackArea');
    const audioPlayback = document.getElementById('audioPlayback');
    const saveRecordingBtn = document.getElementById('saveRecordingBtn');
    const discardBtn = document.getElementById('discardBtn');
    
    // Fallback if not available
    if(!recordBtn) return;

    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    function drawVisualizer(dataArray) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / dataArray.length) * 2.5;
        let barHeight;
        let x = 0;

        for(let i = 0; i < dataArray.length; i++) {
            barHeight = dataArray[i] / 2;
            const r = barHeight + (25 * (i/dataArray.length));
            const g = 100 * (i/dataArray.length);
            const b = 250;
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }

    recordBtn.addEventListener('click', async () => {
        if (!isRecording) {
            // START RECORDING
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                
                // Visualizer Setup
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
                
                analyser.smoothingTimeConstant = 0.8;
                analyser.fftSize = 256;
                
                microphone.connect(analyser);
                analyser.connect(javascriptNode);
                javascriptNode.connect(audioContext.destination);
                
                javascriptNode.onaudioprocess = function() {
                    const array = new Uint8Array(analyser.frequencyBinCount);
                    analyser.getByteFrequencyData(array);
                    drawVisualizer(array);
                }

                mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
                
                mediaRecorder.onstop = () => {
                    audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    audioPlayback.src = audioUrl;
                    playbackArea.classList.remove('d-none');
                    
                    // Cleanup visualizer
                    if(javascriptNode) javascriptNode.disconnect();
                    if(analyser) analyser.disconnect();
                    if(microphone) microphone.disconnect();
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                };

                audioChunks = [];
                mediaRecorder.start();
                isRecording = true;
                
                // UI updates
                recordBtn.classList.add('recording');
                recordBtn.textContent = '⏹️';
                recordWrapper.classList.add('recording');
                recordStatus.textContent = 'Recording in progress...';
                playbackArea.classList.add('d-none');
                
                // Timer
                startTime = Date.now();
                recordInterval = setInterval(() => {
                    const diff = Math.floor((Date.now() - startTime) / 1000);
                    const mins = String(Math.floor(diff / 60)).padStart(2, '0');
                    const secs = String(diff % 60).padStart(2, '0');
                    recordTimer.textContent = `${mins}:${secs}`;
                }, 1000);

            } catch (err) {
                console.error("Microphone access denied", err);
                alert("Please allow microphone access to record.");
            }
        } else {
            // STOP RECORDING
            mediaRecorder.stop();
            isRecording = false;
            clearInterval(recordInterval);
            
            // UI updates
            recordBtn.classList.remove('recording');
            recordBtn.textContent = '🎙️';
            recordWrapper.classList.remove('recording');
            recordStatus.textContent = 'Recording stopped';
        }
    });

    discardBtn.addEventListener('click', () => {
        audioChunks = [];
        audioBlob = null;
        playbackArea.classList.add('d-none');
        recordTimer.textContent = '00:00';
        recordStatus.textContent = 'Ready to record';
    });

    saveRecordingBtn.addEventListener('click', async () => {
        if (!audioBlob) return;
        saveRecordingBtn.textContent = 'Saving...';
        saveRecordingBtn.disabled = true;

        const titleInput = document.getElementById('recordingTitle').value;
        const formData = new FormData();
        formData.append("audio", audioBlob, `aria_recording_${Date.now()}.webm`);
        formData.append("title", titleInput || `Recording ${new Date().toLocaleString()}`);
        
        // Simulate Mood Detection (random for demo purposes)
        const moods = ['happy', 'stressed', 'tired', 'confident', 'neutral'];
        const simulatedMood = moods[Math.floor(Math.random() * moods.length)];
        formData.append("mood", simulatedMood);

        // Calculate duration from timer
        const timerText = recordTimer.textContent;
        const [mins, secs] = timerText.split(':').map(Number);
        formData.append("duration", (mins * 60) + secs);

        try {
            await apiFetch('/audio/upload', {
                method: 'POST',
                body: formData
            });
            alert('Recording saved successfully!');
            document.querySelector('[data-target="recordings"]').click(); // switch tab
            
            // Reset state
            discardBtn.click();
        } catch(err) {
            alert('Error uploading: ' + err.message);
        } finally {
            saveRecordingBtn.textContent = 'Save & Upload';
            saveRecordingBtn.disabled = false;
        }
    });
}

// ==========================================
// 5. LOAD RECORDINGS
// ==========================================
async function loadRecordings() {
    const listEl = document.getElementById('recordingsList');
    try {
        const data = await apiFetch('/audio/list');
        if(data.success) {
            if(data.recordings.length === 0) {
                listEl.innerHTML = '<p class="text-muted">No recordings found. Go to Voice Recorder to make one.</p>';
                return;
            }
            
            listEl.innerHTML = data.recordings.map(rec => `
                <div class="audio-item">
                    <div>
                        <h4 style="margin-bottom: 0.2rem;">${rec.title}</h4>
                        <span style="font-size: 0.8rem;" class="text-muted">${new Date(rec.createdAt).toLocaleDateString()} • Mood: <strong style="color: var(--accent);">${rec.mood}</strong></span>
                    </div>
                    <div class="audio-controls">
                        <button class="btn btn-outline" style="padding: 0.5rem;" onclick="playAudio('${rec._id}')">▶️ Play</button>
                        <button class="btn btn-danger" style="padding: 0.5rem;" onclick="deleteAudio('${rec._id}')">🗑️</button>
                    </div>
                </div>
            `).join('');
        }
    } catch(err) {
        listEl.innerHTML = `<p class="text-danger">Error loading recordings: ${err.message}</p>`;
    }
}

window.playAudio = async (id) => {
    // Basic streaming setup - create an audio element dynamically or use a modal
    const audio = new Audio(`${API_URL}/audio/${id}/stream`);
    // Pass token via header isn't directly possible via HTML5 Audio API tag simply, 
    // Usually we use cookies or pre-fetch Blob. For demo, assuming cookies work or doing fetch blob.
    
    // Fetch blob approach for authorized audio
    try {
        const response = await fetch(`${API_URL}/audio/${id}/stream`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        a.play();
        alert('Playing audio...');
    } catch(e) {
        console.error(e);
        alert('Error playing audio');
    }
}

window.deleteAudio = async (id) => {
    if(confirm('Delete this recording?')) {
        try {
            await apiFetch(`/audio/${id}`, { method: 'DELETE' });
            loadRecordings();
            loadStats();
        } catch(e) {
            alert(e.message);
        }
    }
}

// ==========================================
// 6. AI CHAT SIMULATOR
// ==========================================
function initChat() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChatBtn');
    const msgContainer = document.getElementById('chatMessages');

    if(!sendBtn) return;

    function appendMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.textContent = text;
        msgContainer.appendChild(div);
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }

    async function handleSend() {
        const text = input.value.trim();
        if(!text) return;
        
        appendMessage(text, 'user');
        input.value = '';

        // Simulate AI Thinking
        setTimeout(() => {
            let response = "I'm Aria. I can help you record notes, prepare for interviews, or organize your tasks!";
            
            const lowerText = text.toLowerCase();
            if(lowerText.includes('resume') || lowerText.includes('job')) response = "I see you're asking about jobs. You can use my ATS Helper tool in the sidebar to analyze your resume!";
            else if(lowerText.includes('record') || lowerText.includes('audio')) response = "Head over to the Voice Recorder tab to capture your thoughts.";
            else if(lowerText.includes('hello') || lowerText.includes('hi')) response = "Hello there! Ready to be productive?";
            else if(lowerText.includes('interview')) response = "For interviews, I recommend practicing with my voice recorder. Speak clearly and confidently!";

            appendMessage(response, 'bot');
        }, 1000);
    }

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') handleSend();
    });
}

// ==========================================
// 7. NOTES (LocalStorage)
// ==========================================
function initNotes() {
    const saveBtn = document.getElementById('saveNoteBtn');
    const input = document.getElementById('noteInput');
    const list = document.getElementById('notesList');
    if(!saveBtn) return;

    function renderNotes() {
        const notes = JSON.parse(localStorage.getItem('aria_notes') || '[]');
        list.innerHTML = notes.map((n, i) => `
            <div style="padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 8px;">
                <p style="margin-bottom: 0.5rem;">${n.text}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <small class="text-muted">${n.date}</small>
                    <button class="btn btn-outline text-danger" style="padding: 0.2rem 0.5rem;" onclick="deleteNote(${i})">Del</button>
                </div>
            </div>
        `).join('');
    }

    saveBtn.addEventListener('click', () => {
        if(!input.value.trim()) return;
        const notes = JSON.parse(localStorage.getItem('aria_notes') || '[]');
        notes.unshift({ text: input.value, date: new Date().toLocaleString() });
        localStorage.setItem('aria_notes', JSON.stringify(notes));
        input.value = '';
        renderNotes();
    });

    window.deleteNote = (idx) => {
        const notes = JSON.parse(localStorage.getItem('aria_notes') || '[]');
        notes.splice(idx, 1);
        localStorage.setItem('aria_notes', JSON.stringify(notes));
        renderNotes();
    };

    renderNotes();
}

// ==========================================
// 8. REMINDERS (LocalStorage)
// ==========================================
function initReminders() {
    const addBtn = document.getElementById('addReminderBtn');
    const textIn = document.getElementById('reminderText');
    const dateIn = document.getElementById('reminderDate');
    const list = document.getElementById('remindersList');
    if(!addBtn) return;

    function renderReminders() {
        const rems = JSON.parse(localStorage.getItem('aria_rems') || '[]');
        list.innerHTML = rems.map((r, i) => {
            const isPast = new Date(r.date) < new Date();
            return `
            <div style="padding: 1rem; background: rgba(0,0,0,0.2); border-left: 4px solid ${isPast ? 'var(--danger)' : 'var(--success)'}; border-radius: 4px;">
                <h4 style="margin-bottom: 0.2rem; ${isPast ? 'text-decoration: line-through;' : ''}">${r.text}</h4>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <small class="text-muted">${new Date(r.date).toLocaleString()}</small>
                    <button class="btn btn-outline text-danger" style="padding: 0.2rem 0.5rem;" onclick="deleteReminder(${i})">Del</button>
                </div>
            </div>
        `}).join('');
    }

    addBtn.addEventListener('click', () => {
        if(!textIn.value || !dateIn.value) return alert("Fill both fields");
        const rems = JSON.parse(localStorage.getItem('aria_rems') || '[]');
        rems.push({ text: textIn.value, date: dateIn.value });
        rems.sort((a,b) => new Date(a.date) - new Date(b.date));
        localStorage.setItem('aria_rems', JSON.stringify(rems));
        textIn.value = ''; dateIn.value = '';
        renderReminders();
    });

    window.deleteReminder = (idx) => {
        const rems = JSON.parse(localStorage.getItem('aria_rems') || '[]');
        rems.splice(idx, 1);
        localStorage.setItem('aria_rems', JSON.stringify(rems));
        renderReminders();
    };

    renderReminders();
}

// ==========================================
// 9. ATS RESUME HELPER SIMULATOR
// ==========================================
function initATS() {
    const analyzeBtn = document.getElementById('analyzeResumeBtn');
    const resultsDiv = document.getElementById('resumeResults');
    
    if(!analyzeBtn) return;

    analyzeBtn.addEventListener('click', () => {
        const resumeText = document.getElementById('resumeInput').value.toLowerCase();
        const jobRole = document.getElementById('jobRoleInput').value.toLowerCase();
        
        if(!resumeText || !jobRole) return alert("Please provide both resume text and target job role.");

        analyzeBtn.textContent = 'Analyzing...';
        
        setTimeout(() => {
            resultsDiv.classList.remove('d-none');
            analyzeBtn.textContent = 'Analyze Resume';

            // Very simple heuristic for demo
            let score = 40;
            const keywords = ['experience', 'education', 'skills', jobRole.split(' ')[0], 'team', 'project', 'developed'];
            
            let found = [];
            let missing = [];

            keywords.forEach(kw => {
                if(resumeText.includes(kw)) {
                    score += 10;
                    found.push(kw);
                } else {
                    missing.push(kw);
                }
            });

            score = Math.min(score, 98); // cap at 98%

            const scoreEl = document.getElementById('atsScore');
            scoreEl.textContent = `${score}%`;
            scoreEl.style.color = score > 75 ? 'var(--success)' : (score > 50 ? 'var(--warning)' : 'var(--danger)');

            const feedback = document.getElementById('atsFeedback');
            feedback.innerHTML = `
                <p><strong>Found Keywords:</strong> <span style="color: var(--success);">${found.join(', ') || 'None'}</span></p>
                <p class="mt-2"><strong>Suggested Additions:</strong> <span style="color: var(--danger);">${missing.join(', ')}</span></p>
                <p class="mt-3 text-muted" style="font-size: 0.9rem;">Tip: Tailor your resume to match the exact phrasing in the job description to improve your ATS ranking.</p>
            `;
        }, 1500);
    });
}
