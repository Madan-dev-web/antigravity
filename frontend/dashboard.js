<div lang="en">

    <div>
        <div className="dashboard-layout fade-in">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <div className="brand">
                    <span>✨</span> Aria
                </div>

                <nav id="navMenu">
                    <div className="nav-item active" dataTarget="dashboard">📊 Overview</div>
                    <div className="nav-item" dataTarget="recorder">🎙️ Voice Recorder</div>
                    <div className="nav-item" dataTarget="chat">🧠 AI Chat</div>
                    <div className="nav-item" dataTarget="recordings">📁 Recordings</div>
                    <div className="nav-item" dataTarget="notes">📝 Smart Notes</div>
                    <div className="nav-item" dataTarget="reminders">⏰ Reminders</div>
                    <div className="nav-item" dataTarget="resume">📄 ATS Helper</div>
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <div className="nav-item text-muted={true}" id="userProfileName">👤 User</div>
                    <div className="nav-item text-danger" id="logoutBtn" style={{ color: 'var(--danger)' }}>🚪 Logout</div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">

                {/* Dashboard Overview */}
                <section id="dashboard" className="content-section">
                    <h2 className="mb-4">Welcome back, <span id="welcomeName" className="gradient-text">User</span>!</h2>

                    <div className="stats-grid">
                        <div className="glass-panel stat-card">
                            <div className="text-muted={true}">Total Recordings</div>
                            <div className="stat-value" id="statTotalRecs">0</div>
                        </div>
                        <div className="glass-panel stat-card">
                            <div className="text-muted={true}">Favorites</div>
                            <div className="stat-value" id="statFavorites" style={{ color: 'var(--accent)' }}>0</div>
                        </div>
                        <div className="glass-panel stat-card">
                            <div className="text-muted={true}">Recent Mood</div>
                            <div className="stat-value" id="statMood" style={{ color: 'var(--primary-light)' }}>Neutral</div>
                        </div>
                    </div>

                    <div className="glass-panel">
                        <h3 className="mb-3">Recent Activity</h3>
                        <div id="recentActivityList">
                            <p className="text-muted={true}">No recent activity found.</p>
                        </div>
                    </div>
                </section>

                {/* Voice Recorder */}
                <section id="recorder" className="content-section d-none">
                    <h2 className="mb-2">Voice Studio</h2>
                    <p className="text-muted={true} mb-4">Record high-quality audio with live mood detection.</p>

                    <div className="glass-panel text-center">
                        <div className="record-btn-wrapper" id="recordWrapper">
                            <button className="mic-btn" id="recordBtn">🎙️</button>
                            <p className="mt-3 text-muted={true}" id="recordStatus">Ready to record</p>
                            <p className="mt-1" id="recordTimer" style={{ fontFamily: 'monospace', fontSize: '1.5rem' }}>00:00</p>
                        </div>

                        <canvas id="visualizer" className="visualizer-canvas"></canvas>

                        <div id="playbackArea" className="mt-4 d-none">
                            <audio id="audioPlayback" controls={true} className="mb-3" style={{ width: '100%' }}></audio>
                            <div className="input-group">
                                <input type="text" id="recordingTitle" className="form-control" placeholder="Enter title for this recording" />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button className="btn btn-outline" id="discardBtn">Discard</button>
                                <button className="btn btn-primary" id="saveRecordingBtn">Save & Upload</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Chat */}
                <section id="chat" className="content-section d-none">
                    <h2 className="mb-4">AI Companion</h2>
                    <div className="glass-panel chat-container">
                        <div className="chat-messages" id="chatMessages">
                            <div className="message bot">
                                Hello! I'm Aria. How can I help you be more productive today?
                            </div>
                        </div>
                        <div className="chat-input-area">
                            <input type="text" id="chatInput" className="form-control" placeholder="Ask Aria anything..." style={{ flex: '1' }} />
                            <button className="btn btn-primary" id="sendChatBtn">Send</button>
                        </div>
                    </div>
                </section>

                {/* Recordings List */}
                <section id="recordings" className="content-section d-none">
                    <h2 className="mb-4">Your Recordings</h2>
                    <div className="glass-panel">
                        <div id="recordingsList">
                            <p className="text-muted={true}">Loading recordings...</p>
                        </div>
                    </div>
                </section>

                {/* Notes */}
                <section id="notes" className="content-section d-none">
                    <h2 className="mb-4">Smart Notes</h2>
                    <div className="glass-panel">
                        <div className="input-group">
                            <textarea id="noteInput" className="form-control" rows="3" placeholder="Jot down a quick note..."></textarea>
                        </div>
                        <button className="btn btn-primary mb-4" id="saveNoteBtn">Save Note</button>

                        <div id="notesList" style={{ display: 'grid', gap: '1rem' }}>
                            {/* Notes populated by JS */}
                        </div>
                    </div>
                </section>

                {/* Reminders */}
                <section id="reminders" className="content-section d-none">
                    <h2 className="mb-4">Reminders & Tasks</h2>
                    <div className="glass-panel">
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <input type="text" id="reminderText" className="form-control" placeholder="What do you need to do?" />
                            <input type="datetime-local" id="reminderDate" className="form-control" style={{ width: 'auto' }} />
                            <button className="btn btn-primary" id="addReminderBtn">Add</button>
                        </div>
                        <div id="remindersList" style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
                            {/* Reminders populated by JS */}
                        </div>
                    </div>
                </section>

                {/* ATS Helper */}
                <section id="resume" className="content-section d-none">
                    <h2 className="mb-2">Resume ATS Helper</h2>
                    <p className="text-muted={true} mb-4">Paste your resume text below to analyze keywords and ATS score.</p>
                    <div className="glass-panel">
                        <div className="input-group">
                            <textarea id="resumeInput" className="form-control" rows="8" placeholder="Paste your resume content here..."></textarea>
                        </div>
                        <div className="input-group">
                            <input type="text" id="jobRoleInput" className="form-control" placeholder="Target Job Title (e.g. Software Engineer)" />
                        </div>
                        <button className="btn btn-primary mb-4" id="analyzeResumeBtn">Analyze Resume</button>

                        <div id="resumeResults" className="d-none" style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
                            <h3 className="mb-3">Analysis Results</h3>
                            <div className="stats-grid mb-3">
                                <div className="stat-card" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                    <div className="text-muted={true}">ATS Match Score</div>
                                    <div className="stat-value" id="atsScore" style={{ color: 'var(--success)' }}>0%</div>
                                </div>
                            </div>
                            <div id="atsFeedback"></div>
                        </div>
                    </div>
                </section>

            </main>
        </div>
        <script src="script.js"></script>
    </div>
</div>