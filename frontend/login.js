<div lang="en">

    <div>
        <div className="auth-container">
            <div className="auth-card glass-panel fade-in">
                <h2 className="text-center mb-1">Welcome Back</h2>
                <p className="text-center text-muted={true} mb-4">Login to your Aria account</p>

                <form id="loginForm">
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" className="form-control" placeholder="name@example.com" required={true} />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" className="form-control" placeholder="Enter password" required={true} />
                    </div>
                    <div id="loginError" className="text-danger mb-3 d-none text-center" style={{ color: 'var(--danger)', fontSize: '0.9rem' }}></div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Sign In</button>
                </form>

                <p className="text-center mt-4" style={{ fontSize: '0.9rem' }}>
                    Don't have an account? <a href="register.html">Register here</a>
                </p>
            </div>
        </div>
        <script src="script.js"></script>
    </div>
</div>