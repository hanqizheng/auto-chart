let latestTurnstileToken: string | null = null;

export function setClientTurnstileToken(token: string | null) {
  latestTurnstileToken = token;
}

export function getClientTurnstileToken() {
  return latestTurnstileToken;
}
