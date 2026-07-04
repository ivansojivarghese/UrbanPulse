type TokenCache = {
    token: string;
    expiresAt: number;
};

let cache: TokenCache | null = null;

export function getAccessTokenFromMemory(): string | null {
    if (!cache) return null;

    if (Date.now() >= cache.expiresAt) {
        cache = null;
        return null;
    }

    return cache.token;
}

export function setAccessToken(token: string) {
    cache = {
        token,
        // Refresh after 71 hours to be safe
        expiresAt: Date.now() + 71 * 60 * 60 * 1000,
    };
}

export function clearAccessToken() {
    cache = null;
}