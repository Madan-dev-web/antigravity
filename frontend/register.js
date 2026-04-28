<div lang="en">

    <div>
        <div className="auth-container">
            <div className="auth-card glass-panel fade-in">
                <h2 className="text-center mb-1">Create Account</h2>
                <p className="text-center text-muted={true} mb-4">Join Aria to start achieving more</p>

                <form id="registerForm">
                    <div className="input-group">
                        <label htmlFor="name">Full Name</label>
                        <input type="text" id="name" className="form-control" placeholder="John Doe" required={true} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" className="form-control" placeholder="name@example.com" required={true} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" className="form-control" placeholder="Create a password" required={true} minLength="6" />
                    </div>
                    <div id="registerError" className="text-danger mb-3 d-none text-center" style={{ color: 'var(--danger)', fontSize: '0.9rem' }}></div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Account</button>
                </form>

                <p className="text-center mt-4" style={{ fontSize: '0.9rem' }}>
                    Already have an account? <a href="login.html">Sign in</a>
                </p>
            </div>
        </div>
        <script src="script.js"></script>
    </div>
</div>