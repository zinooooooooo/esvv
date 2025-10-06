# Session Timeout Implementation

## Overview
This system implements automatic session timeout functionality that logs out users after 10 minutes of inactivity, with a 2-minute warning before logout.

## Features

### 🕒 **Automatic Timeout**
- Users are automatically logged out after **10 minutes** of inactivity
- Session timeout only activates when a user is logged in
- Timeout resets on any user activity (mouse movement, clicks, keyboard input, etc.)

### ⚠️ **Warning System**
- Users receive a warning **2 minutes** before automatic logout
- Warning shows a countdown timer
- Users can extend their session or logout immediately
- Warning appears as a modal overlay with high z-index priority

### 🔄 **Activity Detection**
The system tracks the following user activities:
- Mouse movements and clicks
- Keyboard input (keypress, keydown)
- Scrolling
- Touch events (for mobile devices)
- Any DOM interactions

## Implementation Details

### Files Added/Modified

1. **`src/hooks/useSessionTimeout.js`**
   - Custom React hook for session timeout logic
   - Handles activity detection and timeout management
   - Configurable timeout and warning periods

2. **`src/components/SessionTimeoutWarning.jsx`**
   - Warning modal component
   - Shows countdown timer and action buttons
   - Responsive design with smooth animations

3. **`src/Navbar/Navbar.jsx`** (Modified)
   - Integrated session timeout functionality
   - Added session warning state management
   - Connected to existing logout system

### Configuration

```javascript
const sessionTimeoutConfig = {
  timeoutMinutes: 10,      // Total timeout duration
  warningMinutes: 2,       // Warning time before logout
  onLogout: handleLogout,  // Logout callback function
  isActive: !!user         // Only active when user is logged in
};
```

### Usage

The session timeout is automatically active when:
- A user is logged in (`user` state is not null)
- The component is mounted
- No manual intervention required

## User Experience

### Normal Flow
1. User logs in → Session timeout starts
2. User remains active → Timeout resets on each activity
3. User becomes inactive for 8+ minutes → Warning appears
4. User can click "Stay Logged In" → Session extends, warning disappears
5. User remains inactive for 10+ minutes → Automatic logout

### Warning Modal Features
- **Countdown Timer**: Shows remaining time in MM:SS format
- **Progress Bar**: Visual indication of time remaining
- **Action Buttons**:
  - "Stay Logged In" - Extends session and closes warning
  - "Logout Now" - Immediate logout
  - Close button (X) - Closes warning (session continues)

## Technical Notes

### Performance
- Uses `useCallback` and `useRef` for optimal performance
- Event listeners are properly cleaned up on unmount
- Minimal re-renders with efficient state management

### Security
- Session timeout is client-side only
- Server-side session validation still handled by Supabase
- No sensitive data stored in session timeout logic

### Browser Compatibility
- Works in all modern browsers
- Handles edge cases like tab switching and page visibility
- Responsive design for mobile and desktop

## Testing

The implementation includes:
- Unit tests for the `useSessionTimeout` hook
- Manual testing scenarios for different user behaviors
- Edge case handling for rapid activity changes

## Customization

To modify the timeout behavior:

1. **Change timeout duration**: Update `timeoutMinutes` in `Navbar.jsx`
2. **Change warning time**: Update `warningMinutes` in `Navbar.jsx`
3. **Add custom activities**: Modify the `events` array in `useSessionTimeout.js`
4. **Customize warning UI**: Edit `SessionTimeoutWarning.jsx`

## Troubleshooting

### Common Issues
- **Warning not showing**: Check if user is logged in and `isActive` is true
- **Timeout not working**: Verify event listeners are properly attached
- **Memory leaks**: Ensure cleanup functions are called on unmount

### Debug Mode
Add console logs to track session timeout behavior:
```javascript
console.log('Session timeout active:', isActive);
console.log('Time remaining:', timeLeft);
console.log('Warning shown:', showWarning);
```
