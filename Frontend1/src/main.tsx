import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import { authSettings, clearLoginCallback, configurationError } from './auth/config';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  configurationError ? <main className="setup"><h1>RailSathi setup</h1><p>{configurationError}</p></main> :
    <AuthProvider {...authSettings} onSigninCallback={clearLoginCallback}><App /></AuthProvider>,
);
