import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NavigationGuard } from '../navigationGuard';

describe('NavigationGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows initial navigation and executes action', () => {
    const guard = new NavigationGuard(600);
    const action = vi.fn();

    expect(guard.canNavigate()).toBe(true);
    const result = guard.run(action);

    expect(result).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);
    expect(guard.canNavigate()).toBe(false);
  });

  it('blocks rapid successive navigation attempts within lock duration', () => {
    const guard = new NavigationGuard(600);
    const firstAction = vi.fn();
    const secondAction = vi.fn();
    const thirdAction = vi.fn();

    const res1 = guard.run(firstAction);
    const res2 = guard.run(secondAction);
    const res3 = guard.run(thirdAction);

    expect(res1).toBe(true);
    expect(res2).toBe(false);
    expect(res3).toBe(false);

    expect(firstAction).toHaveBeenCalledTimes(1);
    expect(secondAction).not.toHaveBeenCalled();
    expect(thirdAction).not.toHaveBeenCalled();
  });

  it('allows navigation again after lock duration expires', () => {
    const guard = new NavigationGuard(600);
    const firstAction = vi.fn();
    const secondAction = vi.fn();

    guard.run(firstAction);
    expect(guard.canNavigate()).toBe(false);

    // Fast-forward 600ms
    vi.advanceTimersByTime(600);

    expect(guard.canNavigate()).toBe(true);
    const res2 = guard.run(secondAction);

    expect(res2).toBe(true);
    expect(secondAction).toHaveBeenCalledTimes(1);
  });

  it('resets lock immediately when reset is called', () => {
    const guard = new NavigationGuard(600);
    const firstAction = vi.fn();
    const secondAction = vi.fn();

    guard.run(firstAction);
    expect(guard.canNavigate()).toBe(false);

    guard.reset();
    expect(guard.canNavigate()).toBe(true);

    const res2 = guard.run(secondAction);
    expect(res2).toBe(true);
    expect(secondAction).toHaveBeenCalledTimes(1);
  });
});
