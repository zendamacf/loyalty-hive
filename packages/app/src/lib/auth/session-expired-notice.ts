let pendingSessionExpiredNotice = false;

export function markSessionExpired(): void {
  pendingSessionExpiredNotice = true;
}

export function consumeSessionExpiredNotice(): boolean {
  if (!pendingSessionExpiredNotice) {
    return false;
  }

  pendingSessionExpiredNotice = false;
  return true;
}
