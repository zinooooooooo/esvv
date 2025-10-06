import { renderHook, act } from '@testing-library/react';
import useSessionTimeout from '../useSessionTimeout';

// Mock timers
jest.useFakeTimers();

describe('useSessionTimeout', () => {
  const mockOnLogout = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => 
      useSessionTimeout(10, 2, mockOnLogout, true)
    );

    expect(result.current.timeLeft).toBe(null);
    expect(result.current.showWarning).toBe(false);
    expect(result.current.isLoggedOut).toBe(false);
  });

  it('should not start timeout when inactive', () => {
    const { result } = renderHook(() => 
      useSessionTimeout(10, 2, mockOnLogout, false)
    );

    expect(result.current.showWarning).toBe(false);
    expect(mockOnLogout).not.toHaveBeenCalled();
  });

  it('should extend session when extendSession is called', () => {
    const { result } = renderHook(() => 
      useSessionTimeout(10, 2, mockOnLogout, true)
    );

    act(() => {
      result.current.extendSession();
    });

    // Should not show warning immediately after extending
    expect(result.current.showWarning).toBe(false);
  });

  it('should format time correctly', () => {
    const { result } = renderHook(() => 
      useSessionTimeout(10, 2, mockOnLogout, true)
    );

    const formattedTime = result.current.formatTime(125000); // 2 minutes 5 seconds
    expect(formattedTime).toBe('2:05');
  });

  it('should format seconds only when less than a minute', () => {
    const { result } = renderHook(() => 
      useSessionTimeout(10, 2, mockOnLogout, true)
    );

    const formattedTime = result.current.formatTime(45000); // 45 seconds
    expect(formattedTime).toBe('45s');
  });
});
