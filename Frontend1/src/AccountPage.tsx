import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from 'react-oidc-context';
import { cognitoDomain, logoutUrl } from './auth/config';
import { requestProfile, type UserProfile } from './api/users';
import './App.css';

export default function App() {
  const auth = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const token = auth.user?.access_token;

  useEffect(() => {
    if (!token) return;
    let active = true;
    requestProfile(token).then((user) => {
      if (active) {
        setProfile(user);
        setName(user.displayName || '');
        setError('');
      }
    }).catch(() => {
      if (active) setError('Could not connect to your profile. Check the backend and retry.');
    });
    return () => { active = false; };
  }, [token, attempt]);

  async function signIn() {
    setError('');
    try { await auth.signinRedirect(); }
    catch { setError('Could not open sign-in. Please try again.'); }
  }

  async function signOut() {
    setBusy(true);
    try {
      // Revoke refresh capability before clearing the local and hosted sessions.
      await auth.revokeTokens(['refresh_token']);
      await auth.removeUser();
      const url = new URL(`${cognitoDomain}/logout`);
      url.searchParams.set('client_id', auth.settings.client_id);
      url.searchParams.set('logout_uri', logoutUrl);
      window.location.assign(url.toString());
    } catch {
      setError('Sign-out could not finish. Please retry.');
      setBusy(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const user = await requestProfile(token, name);
      setProfile(user);
      setName(user.displayName || '');
      setMessage('Your profile is saved.');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to save your profile.');
    } finally { setBusy(false); }
  }

  return (
    <main className="shell">
      <header><a className="brand" href="/">RailSathi<span>YOUR JOURNEY COMPANION</span></a><span className="badge">FIRST STOP · YOUR ACCOUNT</span></header>
      <section className="layout">
        <div className="intro"><p className="eyebrow">MORE POSSIBILITIES. BETTER JOURNEYS.</p><h1>Your next journey<br />starts here.</h1><p>One account for the journeys you plan, the routes you save, and the possibilities ahead.</p><div className="route-line"><span />Plan<span />Compare<span />Travel</div></div>
        <section className="card" aria-label="Your account">
          {auth.isLoading || auth.activeNavigator ? <p role="status">Connecting your account…</p> : auth.isAuthenticated ? <>
            <p className="eyebrow">WELCOME ABOARD</p><h2>{profile?.displayName ? `Hello, ${profile.displayName}` : 'Your profile'}</h2>
            <p className="muted">{auth.user?.profile.email || 'You are signed in.'}</p>
            {profile ? <form onSubmit={saveProfile}><label htmlFor="name">Display name</label><input id="name" value={name} maxLength={100} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" autoComplete="name" /><button disabled={busy} type="submit">{busy ? 'Please wait…' : 'Save profile'}</button></form> : <><p role="status">{error ? 'Profile unavailable.' : 'Preparing your profile…'}</p><button onClick={() => setAttempt(attempt + 1)}>Retry profile</button></>}
            <button className="secondary" disabled={busy} onClick={signOut}>Sign out</button>
          </> : <><p className="eyebrow">LET’S GET YOU STARTED</p><h2>Welcome to RailSathi</h2><p className="muted">Sign in or create your account to get started.</p><button onClick={signIn}>Sign in / Create account <span aria-hidden="true">→</span></button><p className="fine">You’ll continue to our secure sign-in page. New here? Choose “Sign up” there.</p></>}
          {(error || auth.error) && <p className="error" role="alert">{error || 'Sign-in failed. Check your Cognito configuration and try signing in again.'}</p>}
          {message && <p className="success" role="status">{message}</p>}
        </section>
      </section><footer>RailSathi · A little planning. A better journey.</footer>
    </main>
  );
}
