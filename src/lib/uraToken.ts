let token: string | null = null;
let expiresAt = 0;

export function getToken() {
    if (Date.now() < expiresAt) {
        return token;
    }

    return null;
}

export function setToken(newToken: string) {
    token = newToken;

    // URA tokens are valid for 24 hours
    expiresAt = Date.now() + (24 * 60 * 60 * 1000) - (5 * 60 * 1000);
}

export function clearToken() {
    token = null;
    expiresAt = 0;
}