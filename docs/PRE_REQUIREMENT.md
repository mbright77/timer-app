 
# PWA Timer Wheel – Initial Requirements Document

## 1. Project Overview

The goal is to create a **Progressive Web App (PWA)** timer that allows users to set a countdown duration by rotating a circular wheel with a touch gesture. The wheel visually represents the selected time.

The app is designed to be **simple, fast, and mobile-friendly**, with a focus on intuitive gesture interaction.

The application will be implemented using **Blazor WebAssembly (C#)** to evaluate the current Blazor ecosystem.

No persistent data storage is required.

---

# 2. Core Concept

The user interacts with a **large circular timer wheel**:

1. The user **touches and rotates the wheel clockwise** to increase the timer duration.
2. The wheel visually fills as time increases.
3. The selected time is displayed prominently.
4. The user presses **Start** to begin the countdown.
5. The wheel animates as time decreases.
6. When the timer reaches **0**, an **alarm sound plays**.

The UI should be optimized primarily for **mobile devices** but also work on desktop.

---

# 3. Functional Requirements

## 3.1 Timer Input (Wheel Interaction)

The user can set the timer duration using a circular gesture.

### Behavior

* The user touches the circular wheel and rotates their finger around it.
* Clockwise rotation increases the timer.
* Counter-clockwise rotation decreases the timer.
* Time changes continuously as the finger moves.
* The wheel visually fills based on the selected time.

### Time Limits

* Minimum: **0 seconds**
* Maximum: **60 minutes** (configurable)

### Visual Feedback

* The circular progress arc fills based on time selected.
* A numeric display shows the current timer value.

Example display:

```
7 min
```

---

# 3.2 Start Timer

When the user has chosen a time:

* A **Start button** becomes enabled.
* Pressing Start begins the countdown.

Behavior:

* Countdown runs in **real time**
* UI updates every **second**
* Wheel animation shrinks accordingly

---

# 3.3 Countdown Display

During countdown:

Display elements:

* Remaining time
* Circular progress animation
* Optional subtle ticking animation

Example display:

```
06:59
06:58
06:57
```

---

# 3.4 Alarm on Completion

When the timer reaches zero:

* An **alarm sound plays**
* Optional vibration on supported devices
* UI indicates completion state

Example behaviors:

* Wheel flashes
* Message shown: "Time's up!"

Optional buttons:

* Reset
* Repeat

---

# 3.5 Reset Timer

User can reset the timer at any time.

Reset behavior:

* Timer stops
* Wheel returns to zero
* User can set a new time

---

# 4. User Interface Requirements

## 4.1 Layout

Main elements:

Top section:

* Current timer value

Center:

* Large circular timer wheel

Bottom:

* Start / Reset button

### Wheel Design

Visual properties:

* Circular dial
* Filled progress arc
* Touch-sensitive

Inspired by:

* Kitchen timers
* Parking meter apps

---

# 4.2 Touch Interaction

Touch gestures supported:

* Drag along circular path
* Continuous tracking
* Smooth updates

Expected behavior:

* Low latency
* Natural rotation feeling
* Works with finger dragging around the circle

---

# 4.3 Accessibility

Basic accessibility requirements:

* Timer can also be controlled via buttons
* Numeric time display visible
* High contrast UI

---

# 5. Technical Requirements

## 5.1 Platform

Application type:

Progressive Web App (PWA)

Technologies:

* Blazor WebAssembly
* C#
* HTML / CSS
* Optional JavaScript interop

---

## 5.2 PWA Requirements

The app should support:

* Installable on mobile home screen
* Offline capable
* Fast load time
* App-like behavior

Required files:

* Service worker
* Web manifest
* App icons

---

## 5.3 Performance

Target performance:

* Smooth touch interaction (60fps)
* Instant UI response
* Minimal CPU usage during countdown

---

## 5.4 Audio

Alarm sound requirements:

* Plays when timer reaches zero
* Works on mobile browsers
* User interaction may be required before audio is allowed

Optional:

* Multiple alarm sounds

---

# 6. Non-Functional Requirements

### Simplicity

The application should remain extremely lightweight.

### No Persistence

The timer state **does not need to survive page reload or app closure**.

### No Backend

The entire application runs in the browser.

### Mobile First

Primary target device is **smartphones**.

---

# 7. Optional Enhancements (Future)

Possible future features:

* Multiple timers
* Preset durations
* Sound selection
* Dark mode
* Vibration patterns
* Circular drag inertia
* Pomodoro mode

---

# 8. Suggested Architecture (Initial)

Possible component structure:

```
App
 ├── TimerPage
 │     ├── TimerWheelComponent
 │     ├── TimeDisplayComponent
 │     └── ControlButtonsComponent
```

Wheel rendering options:

Option 1:
SVG circle with animated stroke

Option 2:
Canvas drawing

Option 3:
CSS conic-gradient

Recommended:
SVG for easiest interaction and animation.

---

# 9. Open Questions

Items to decide during planning:

1. Maximum timer duration?
2. Should time increase continuously or snap to intervals (e.g., 30 sec)?
3. Should the wheel show minute tick marks?
4. Should rotation inertia exist?
5. Should the timer continue if the screen locks?
6. Alarm behavior if phone is muted?

---

# 10. Development Goals

Primary goal:

Evaluate **modern Blazor WebAssembly for interactive UI apps**.

Success criteria:

* Smooth touch wheel
* Reliable countdown
* Functional PWA install
* Clean architecture
