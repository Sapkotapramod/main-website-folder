import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './App.css';

// --- Supabase & Admin Configuration ---
const SUPABASE_URL = "https://hkwjnzohrzydmdyigwjr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrd2puem9ocnp5ZG1keWlnd2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMzUxMzUsImV4cCI6MjEwNTgxMTEzNX0.K4L4LrewJ_xHqsg2jCYE3H9AOMcDCqSBPuujM7ujH8k";
export const ADMIN_EMAIL = "pramodsapkota132@gmail.com";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Terminal Animation Component ---
const TERMINAL_LINES = [
  "pramod@sapkotap:~$ whoami",
  "root (Pramod Sapkota Security Core)",
  "pramod@sapkotap:~$ cat status.txt",
  "System: ONLINE [256-bit AES]",
  "Access: Protected by Supabase Auth",
  "Threat Engine: Active Monitoring",
  "pramod@sapkotap:~$ _"
];

function TerminalHero() {
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    if (lineIdx < TERMINAL_LINES.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => [...prev, TERMINAL_LINES[lineIdx]]);
        setLineIdx((prev) => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [lineIdx]);

  return (
    <div className="terminal-box">
      <div className="terminal-header">
        <span className="term-dot red"></span>
        <span className="term-dot yellow"></span>
        <span className="term-dot green"></span>
        <span className="term-title">bash - 80x24</span>
      </div>
      <div className="terminal-body">
        {displayedText.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
        {lineIdx < TERMINAL_LINES.length && <span className="terminal-cursor" />}
      </div>
    </div>
  );
}

// --- Main Application ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'login' | 'register'>('login');
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'console' | 'files' | 'chat' | 'support'>('console');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) checkUser(data.session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession) checkUser(currentSession.user);
      else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async (user: any) => {
    const isMain = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const adminStatus = isMain || roleRow?.role === 'admin';
    setIsAdmin(adminStatus);

    const { data: prof } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    setProfile(prof || {
      full_name: 'Pramod Sapkota',
      username: user.email ? user.email.split('@')[0] : 'admin',
      email: user.email
    });

    if (adminStatus) {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, email, created_at')
        .order('created_at', { ascending: false });
      if (data) setAllUsers(data);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    let targetEmail = loginInput.trim();

    // Support logging in by username or email
    if (!targetEmail.includes('@')) {
      const cleanUser = targetEmail.replace(/^@/, '');
      const { data: rpcEmail } = await supabase.rpc('get_email_by_username', { p_username: cleanUser });
      if (rpcEmail) {
        targetEmail = rpcEmail;
      } else {
        const { data: fb } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', cleanUser)
          .maybeSingle();

        if (fb?.email) {
          targetEmail = fb.email;
        } else {
          setStatusMsg({ type: 'error', text: `No account with username: @${cleanUser}` });
          setLoading(false);
          return;
        }
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (error) {
      setStatusMsg({ type: 'error', text: error.message });
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    const cleanUser = regUsername.trim().replace(/^@/, '');
    const { data, error } = await supabase.auth.signUp({
      email: regEmail.trim(),
      password: regPassword,
      options: {
        data: {
          full_name: regFullName.trim(),
          username: cleanUser,
        }
      }
    });

    if (error) {
      setStatusMsg({ type: 'error', text: error.message });
    } else {
      if (data.session) {
        setStatusMsg({ type: 'success', text: "Registration complete! Logged in." });
      } else {
        setStatusMsg({
          type: 'success',
          text: "Success! Check your email inbox to verify your account."
        });
      }
    }
    setLoading(false);
  };

  // --- Authenticated Dashboard ---
  if (session && profile) {
    return (
      <div className="portal-root">
        <div className="dashboard-wrapper">
          <header className="dash-header">
            <div className="dash-user-info">
              <h1>{isAdmin ? "⚡ Welcome Admin" : "Welcome"}, {profile.full_name || profile.username}</h1>
              <span>{profile.email}</span>
            </div>
            <nav className="dash-nav">
              {isAdmin && (
                <button
                  className={`nav-tab ${activeTab === 'console' ? 'active' : ''}`}
                  onClick={() => setActiveTab('console')}
                >
                  Admin Console
                </button>
              )}
              <button
                className={`nav-tab ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                My Files
              </button>
              <button
                className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Direct Chat
              </button>
              <button
                className={`nav-tab ${activeTab === 'support' ? 'active' : ''}`}
                onClick={() => setActiveTab('support')}
              >
                {isAdmin ? "Support" : "Message Admin"}
              </button>
              <button
                className="nav-tab"
                style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
                onClick={() => supabase.auth.signOut()}
              >
                Logout
              </button>
            </nav>
          </header>

          <main className="dash-content">
            {activeTab === 'console' && isAdmin && (
              <div>
                <div className="grid-cards">
                  <div className="stat-card">
                    <h3>Registered Users</h3>
                    <p className="value">{allUsers.length}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Security Engine</h3>
                    <p className="value" style={{ color: 'var(--green)' }}>ACTIVE</p>
                  </div>
                  <div className="stat-card">
                    <h3>Threats Blocked</h3>
                    <p className="value">0</p>
                  </div>
                </div>

                <h3 style={{ marginBottom: 12, fontSize: 16 }}>Registered Users Management</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u) => (
                      <tr key={u.id}>
                        <td>{u.full_name}</td>
                        <td>@{u.username}</td>
                        <td>{u.email}</td>
                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="stat-card">
                <h3>My Storage</h3>
                <p style={{ marginTop: 12, color: 'var(--text-dim)' }}>
                  Encrypted storage bucket is active for sapkotap.com.np.
                </p>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="stat-card">
                <h3>Direct Chat</h3>
                <p style={{ marginTop: 12, color: 'var(--text-dim)' }}>
                  Connect with members on sapkotap.com.np.
                </p>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="stat-card">
                <h3>Admin Communication</h3>
                <p style={{ marginTop: 12, color: 'var(--text-dim)' }}>
                  Direct secure support channel to Pramod Sapkota.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // --- Sign In & Register Form ---
  return (
    <div className="portal-root">
      <div className="auth-wrapper">
        <div className="auth-hero-panel">
          <TerminalHero />
        </div>
        <div className="auth-form-panel">
          <div className="form-card">
            <h2>{view === 'login' ? 'Sign In' : 'Register'}</h2>
            <p className="subtitle">
              {view === 'login' ? 'Access your dashboard' : 'Create an account on sapkotap.com.np'}
            </p>

            {statusMsg && <div className={`alert-box ${statusMsg.type}`}>{statusMsg.text}</div>}

            {view === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <label>Username or Email</label>
                  <input
                    type="text"
                    required
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
                <div className="tab-switch">
                  <span>No account?</span>
                  <button type="button" onClick={() => { setView('register'); setStatusMsg(null); }}>
                    Register
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Username</label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Register'}
                </button>
                <div className="tab-switch">
                  <span>Have an account?</span>
                  <button type="button" onClick={() => { setView('login'); setStatusMsg(null); }}>
                    Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
