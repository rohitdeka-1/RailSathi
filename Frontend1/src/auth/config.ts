import { WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts';

const poolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
export const cognitoDomain = (import.meta.env.VITE_COGNITO_DOMAIN || '').replace(/\/$/, '');
export const logoutUrl = import.meta.env.VITE_LOGOUT_URL || '';
const redirectUrl = import.meta.env.VITE_REDIRECT_URL || '';

export const configurationError = !poolId || !clientId || !cognitoDomain || !redirectUrl || !logoutUrl
  ? 'Complete the Cognito settings in Frontend/.env, then restart the frontend.'
  : '';

export const authSettings: UserManagerSettings = {
  authority: `https://cognito-idp.${poolId.split('_')[0]}.amazonaws.com/${poolId}`,
  client_id: clientId,
  redirect_uri: redirectUrl,
  response_type: 'code',
  scope: 'openid email',
  automaticSilentRenew: true,
  loadUserInfo: false,
  // Keep the session within this browser tab. PKCE/state survive the login redirect.
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
};

export function clearLoginCallback() {
  window.history.replaceState({}, document.title, '/');
}
