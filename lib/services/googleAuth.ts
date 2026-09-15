import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';

export const GOOGLE_DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

const SECURE_KEY_ACCESS_TOKEN = 'cashrunway_google_access_token';
const SECURE_KEY_USER_PROFILE = 'cashrunway_google_user_profile';

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string | null;
  photo: string | null;
}

let isConfigured = false;

/**
 * Configure Google Sign-In SDK with Drive appdata scope.
 */
export function configureGoogleSignIn(webClientId?: string): void {
  if (isConfigured) return;

  try {
    GoogleSignin.configure({
      scopes: [GOOGLE_DRIVE_APPDATA_SCOPE],
      webClientId: webClientId || undefined,
      offlineAccess: false,
    });
    isConfigured = true;
  } catch (err) {
    console.warn('[GoogleAuth] Configuration failed or native module unavailable:', err);
  }
}

/**
 * Authenticate with Google and cache session securely.
 */
export async function signInWithGoogle(): Promise<{
  user: GoogleUserProfile;
  accessToken: string;
}> {
  configureGoogleSignIn();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    const userInfo = (response as any)?.data || response;
    const userProfile: GoogleUserProfile = {
      id: userInfo.user?.id || '',
      email: userInfo.user?.email || '',
      name: userInfo.user?.name || null,
      photo: userInfo.user?.photo || null,
    };

    const tokens = await GoogleSignin.getTokens();
    const accessToken = tokens.accessToken;

    // Cache user profile and token
    await Promise.all([
      SecureStore.setItemAsync(SECURE_KEY_USER_PROFILE, JSON.stringify(userProfile)),
      SecureStore.setItemAsync(SECURE_KEY_ACCESS_TOKEN, accessToken),
    ]);

    return {
      user: userProfile,
      accessToken,
    };
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Proses masuk Google dibatalkan.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Proses masuk sedang berjalan.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services tidak tersedia pada perangkat.');
    }
    console.error('[GoogleAuth] Sign-in error:', error);
    throw new Error(error.message || 'Gagal masuk dengan Google.');
  }
}

/**
 * Disconnect Google session and purge cached credentials.
 */
export async function signOutGoogle(): Promise<void> {
  try {
    configureGoogleSignIn();
    try {
      await GoogleSignin.signOut();
    } catch (_) {}

    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_KEY_USER_PROFILE),
      SecureStore.deleteItemAsync(SECURE_KEY_ACCESS_TOKEN),
    ]);
  } catch (err) {
    console.warn('[GoogleAuth] Sign-out warning:', err);
  }
}

/**
 * Retrieve active access token, refreshing if needed.
 */
export async function getValidAccessToken(): Promise<string | null> {
  try {
    configureGoogleSignIn();
    const isSignedInNative = await GoogleSignin.hasPreviousSignIn();

    if (isSignedInNative) {
      const tokens = await GoogleSignin.getTokens();
      if (tokens.accessToken) {
        await SecureStore.setItemAsync(SECURE_KEY_ACCESS_TOKEN, tokens.accessToken);
        return tokens.accessToken;
      }
    }

    const cachedToken = await SecureStore.getItemAsync(SECURE_KEY_ACCESS_TOKEN);
    return cachedToken || null;
  } catch (err) {
    console.warn('[GoogleAuth] Could not get valid token:', err);
    return await SecureStore.getItemAsync(SECURE_KEY_ACCESS_TOKEN);
  }
}

/**
 * Retrieve cached user profile from secure storage.
 */
export async function getStoredUserProfile(): Promise<GoogleUserProfile | null> {
  try {
    const raw = await SecureStore.getItemAsync(SECURE_KEY_USER_PROFILE);
    if (!raw) return null;
    return JSON.parse(raw) as GoogleUserProfile;
  } catch {
    return null;
  }
}

/**
 * Check whether user is currently signed in.
 */
export async function isGoogleSignedIn(): Promise<boolean> {
  try {
    configureGoogleSignIn();
    const nativeSignedIn = await GoogleSignin.hasPreviousSignIn();
    if (nativeSignedIn) return true;
    const token = await SecureStore.getItemAsync(SECURE_KEY_ACCESS_TOKEN);
    return Boolean(token);
  } catch {
    const token = await SecureStore.getItemAsync(SECURE_KEY_ACCESS_TOKEN);
    return Boolean(token);
  }
}
