/**
 * Authentication API helper for JWT-based auth
 */

const API_BASE = 'http://localhost:8000/api';

export interface User {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'pharmacist' | 'technician' | 'admin';
    role_display: string;
    can_edit_care_plan: boolean;
    can_manage_users: boolean;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
    user: User;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    role?: string;
    provider_npi?: string;
}

// Token storage keys
const ACCESS_TOKEN_KEY = 'careplan_access_token';
const REFRESH_TOKEN_KEY = 'careplan_refresh_token';
const USER_KEY = 'careplan_user';

/**
 * Store tokens in localStorage
 */
export function storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
}

/**
 * Store user in localStorage
 */
export function storeUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Get stored user
 */
export function getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

/**
 * Clear all auth data
 */
export function clearAuthData(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

/**
 * Login user
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();

    storeTokens({ access: data.access, refresh: data.refresh });
    storeUser(data.user);

    return data;
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
        // Extract error message from nested structure
        let errorMessage = 'Registration failed';
        if (result.details) {
            const firstError = Object.values(result.details)[0];
            if (Array.isArray(firstError)) {
                errorMessage = firstError[0] as string;
            } else if (typeof firstError === 'string') {
                errorMessage = firstError;
            }
        } else if (result.error) {
            errorMessage = result.error;
        }
        throw new Error(errorMessage);
    }

    storeTokens(result.tokens);
    storeUser(result.user);

    return { ...result.tokens, user: result.user };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
        const response = await fetch(`${API_BASE}/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (!response.ok) {
            clearAuthData();
            return null;
        }

        const data = await response.json();

        // Update tokens (refresh token rotation)
        storeTokens({
            access: data.access,
            refresh: data.refresh || refreshToken
        });

        return data.access;
    } catch {
        clearAuthData();
        return null;
    }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
    const refreshToken = getRefreshToken();
    const accessToken = getAccessToken();

    if (refreshToken && accessToken) {
        try {
            await fetch(`${API_BASE}/auth/logout/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });
        } catch {
            // Ignore errors on logout - clear local data anyway
        }
    }

    clearAuthData();
}

/**
 * Verify token and get current user
 */
export async function verifyToken(): Promise<User | null> {
    const accessToken = getAccessToken();
    if (!accessToken) return null;

    try {
        const response = await fetch(`${API_BASE}/auth/verify/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            // Try to refresh token
            const newToken = await refreshAccessToken();
            if (!newToken) return null;

            // Retry with new token
            const retryResponse = await fetch(`${API_BASE}/auth/verify/`, {
                headers: {
                    'Authorization': `Bearer ${newToken}`,
                },
            });

            if (!retryResponse.ok) return null;

            const data = await retryResponse.json();
            storeUser(data.user);
            return data.user;
        }

        const data = await response.json();
        storeUser(data.user);
        return data.user;
    } catch {
        return null;
    }
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeader(): Record<string, string> {
    const token = getAccessToken();
    if (!token) return {};
    return { 'Authorization': `Bearer ${token}` };
}

/**
 * Fetch with authentication - automatically handles token refresh
 */
export async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    let accessToken = getAccessToken();

    if (!accessToken) {
        throw new Error('Not authenticated');
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
    };

    let response = await fetch(url, { ...options, headers });

    // If unauthorized, try refreshing the token
    if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
            throw new Error('Session expired. Please log in again.');
        }

        // Retry with new token
        response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${newToken}`,
            },
        });
    }

    return response;
}
