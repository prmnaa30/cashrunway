/**
 * NavigationGuard prevents rapid successive pushes or double-taps
 * from pushing multiple screens to the navigation stack simultaneously.
 */
export class NavigationGuard {
  private isNavigating = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly lockDurationMs: number;

  constructor(lockDurationMs = 600) {
    this.lockDurationMs = lockDurationMs;
  }

  canNavigate(): boolean {
    return !this.isNavigating;
  }

  run(action: () => void): boolean {
    if (this.isNavigating) {
      return false;
    }
    this.isNavigating = true;
    try {
      action();
    } finally {
      this.clearTimer();
      this.timer = setTimeout(() => {
        this.isNavigating = false;
        this.timer = null;
      }, this.lockDurationMs);
    }
    return true;
  }

  reset(): void {
    this.isNavigating = false;
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
