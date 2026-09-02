// Haptic feedback manager with vibration fallback

class HapticService {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public light() {
    if (!this.enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(10);
    } catch {
      // Ignore vibration errors on unsupported environments
    }
  }

  public medium() {
    if (!this.enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(25);
    } catch {
      // Ignore
    }
  }

  public heavy() {
    if (!this.enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate([30, 40, 30]);
    } catch {
      // Ignore
    }
  }

  public success() {
    if (!this.enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate([15, 30, 20, 30, 40]);
    } catch {
      // Ignore
    }
  }

  public failure() {
    if (!this.enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate([40, 50, 40]);
    } catch {
      // Ignore
    }
  }
}

export const haptics = new HapticService();
