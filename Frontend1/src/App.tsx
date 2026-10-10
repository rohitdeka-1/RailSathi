import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from 'react-oidc-context';
import { cognitoDomain, logoutUrl } from './auth/config';
import { requestProfile, type UserProfile } from './api/users';
import { getTrainByNo, getJourneys } from './api/trains';
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

  // Train search state
  const [trainNo, setTrainNo] = useState('');
  const [trainData, setTrainData] = useState<any>(null);
  const [trainError, setTrainError] = useState('');
  const [trainBusy, setTrainBusy] = useState(false);

  // Journey search state
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [journeyData, setJourneyData] = useState<any>(null);
  const [journeyError, setJourneyError] = useState('');
  const [journeyBusy, setJourneyBusy] = useState(false);

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

  async function searchTrain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setTrainBusy(true);
    setTrainError('');
    setTrainData(null);
    try {
      const data = await getTrainByNo(token, trainNo);
      setTrainData(data);
    } catch (err: any) {
      setTrainError(err.message || 'Error fetching train data');
    } finally {
      setTrainBusy(false);
    }
  }

  async function searchJourney(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setJourneyBusy(true);
    setJourneyError('');
    setJourneyData(null);
    try {
      const data = await getJourneys(token, source, destination, date);
      setJourneyData(data);
    } catch (err: any) {
      setJourneyError(err.message || 'Error fetching journey data');
    } finally {
      setJourneyBusy(false);
    }
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
            
            <hr style={{ margin: '2rem 0', borderColor: 'var(--border)' }} />
            
            <h3>Test Train Search API</h3>
            <form onSubmit={searchTrain}>
              <label htmlFor="trainNo">Train Number</label>
              <input id="trainNo" value={trainNo} onChange={(e) => setTrainNo(e.target.value)} placeholder="Enter a valid train number (e.g. 12050)" required />
              <button type="submit" disabled={trainBusy}>{trainBusy ? 'Searching...' : 'Search Train'}</button>
            </form>
            {trainError && <p className="error">{trainError}</p>}
            {trainData && (
              <pre style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-muted)', borderRadius: '4px', overflow: 'auto', fontSize: '0.85rem' }}>
                {JSON.stringify(trainData, null, 2)}
              </pre>
            )}

            <hr style={{ margin: '2rem 0', borderColor: 'var(--border)' }} />

            <h3>Test Journey Search API</h3>
            <form onSubmit={searchJourney}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label htmlFor="source">Source</label>
                  <input id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. NDLS" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="destination">Destination</label>
                  <input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. MMCT" required />
                </div>
                <div style={{ flex: 1 }}>
                  <label htmlFor="date">Date</label>
                  <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
              </div>
              <button type="submit" disabled={journeyBusy}>{journeyBusy ? 'Searching...' : 'Search Journey'}</button>
            </form>
            {journeyError && <p className="error">{journeyError}</p>}
            {journeyData && (
              <pre style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-muted)', borderRadius: '4px', overflow: 'auto', fontSize: '0.85rem' }}>
                {JSON.stringify(journeyData, null, 2)}
              </pre>
            )}

            <button className="secondary" disabled={busy} onClick={signOut} style={{ marginTop: '2rem' }}>Sign out</button>
          </> : <><p className="eyebrow">LET’S GET YOU STARTED</p><h2>Welcome to RailSathi</h2><p className="muted">Sign in or create your account to get started.</p><button onClick={signIn}>Sign in / Create account <span aria-hidden="true">→</span></button><p className="fine">You’ll continue to our secure sign-in page. New here? Choose “Sign up” there.</p></>}
          {(error || auth.error) && <p className="error" role="alert">{error || 'Sign-in failed. Check your Cognito configuration and try signing in again.'}</p>}
          {message && <p className="success" role="status">{message}</p>}
        </section>
      </section><footer>RailSathi · A little planning. A better journey.</footer>
    </main>
  );
}
