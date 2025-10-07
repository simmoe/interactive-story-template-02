# Interactive Story Template - Copilot Instructions

## Project Architecture

This is a **p5.js-based interactive story framework** designed for educational use. Students create branching narratives through a data-driven structure where **only `structure.js` should be edited** by students.

### Core Components

- **`structure.js`** - Story content (STUDENT EDIT ZONE)
- **`sketch.js`** - p5.js rendering engine (DO NOT EDIT)
- **`settings.js`** - Configuration flags like `debugHotspots`
- **`index.html`** - DOM structure with p5.js and p5.sound CDN
- **`style.css`** - CSS Grid layout with custom properties

### Story Data Structure

Stories are defined as a `pages` array where each page object contains:

```javascript
{
  id: '#page1',              // Unique identifier for navigation
  title: 'Page Title',       // Short title
  background: './path.png',  // Background image path
  heading: 'Display Text',   // Optional H1 heading
  button: { text: 'Next', action: '#page2' }, // Single button (backward compatibility)
  buttons: [                 // Multiple buttons (new system)
    { text: 'Back', action: '#prev', style: 'secondary' },
    { text: 'Forward', action: '#next', style: 'primary' }
  ],
  film: { video: 'clip.mp4', duration: 3000, text: '...', action: '#next' }, // Fullscreen video
  jumpscare: { wait: 5000, duration: 3000, image: 'scary.jpg', audio: 'scream.wav', nextPage: '#death' }, // Timed jumpscare
  backgroundSound: './audio.mp3', // Background audio
  hotspots: [...]           // Interactive areas (see below)
}
```

### Hotspot System

Interactive areas use **percent-based coordinates** (0-1) for responsive design:

```javascript
{
  type: 'hotspot',
  x: 0.5, y: 0.3,           // Center point (50% width, 30% height)
  r: 0.1,                   // Circular radius OR
  w: 0.2, h: 0.15,         // Rectangle width/height
  text: 'Tooltip text',
  media: { 
    audio: './sound.mp3',   // Plays on activation
    overlay: './img.png',   // Shows over hotspot area OR
    overlay: {              // Custom positioned overlay
      image: './img.png',   // Image path
      x: 0.1, y: 0.2,      // Custom position (0-1)
      w: 0.5, h: 0.3       // Custom size (0-1)
    },
    video: './clip.mov'     // Video overlay
  },
  duration: 3000,          // Timer duration in milliseconds
  action: '#nextPage',     // CLICK navigation target
  timeoutAction: '#other', // TIMEOUT navigation target
  meta: { 
    tooltip: 'Hover text',
    maxActivations: 3,      // Maximum number of times this hotspot can be activated
    activationCount: 0      // Current activation count (tracked automatically)
  }
}
```

## Critical Interaction Pattern

The system uses **binary choice mechanics**:
- **CLICK** (button press during timer) → `action` 
- **TIMEOUT** (no press, timer expires) → `timeoutAction`

This maps to MQTT hardware inputs where students have one physical button.

## Development Guidelines

### When Adding New Story Content
1. **Only edit `structure.js`** - add new page objects to the `pages` array
2. Use **percent coordinates** (0-1) for all hotspot positions and sizes
3. Ensure every interactive element has both `action` and `timeoutAction` defined
4. Test with `settings.debugHotspots = true` to visualize click areas

### Media Integration
- **Background images**: Use `background` property on page objects
- **Overlays**: Use `media.overlay` on hotspots for contextual images  
- **Audio**: Background audio loops, hotspot audio plays once on activation
- **Video**: Can be background, overlay, or fullscreen (`film` property)

### Navigation Flow
- Pages are connected via `action`/`timeoutAction` properties on hotspots and button `action` properties
- Use consistent ID naming: `#page1`, `#page2`, `#death`, `#escape`
- **Multiple buttons**: Use `buttons` array for back/forward navigation or choices
- **Button styling**: `style: 'primary'` (default) or `style: 'secondary'` for visual hierarchy
- The framework handles preloading and state management automatically

### Responsive Design
- Canvas uses **16:9 aspect ratio** within `#canvasWrap`
- CSS Grid layout with `clamp()` for text sizing
- Footer slides up from bottom when captions are shown
- All coordinates scale automatically via `percentToPixel()` function

### Jumpscare System

Pages can have automatic jumpscares that trigger after a wait period:

```javascript
jumpscare: {
  wait: 5000,              // Milliseconds before jumpscare triggers
  duration: 3000,          // How long jumpscare is shown
  image: './scary.jpg',    // Fullscreen image OR
  video: './scary.mp4',    // Fullscreen video
  audio: './scream.wav',   // Sound effect
  nextPage: '#death'       // Where to go after jumpscare
}
```

- **User interaction cancels**: Any button press or hotspot activation prevents jumpscare
- **Fullscreen display**: Media fills entire viewport with black background
- **Automatic progression**: After duration, automatically navigates to nextPage
- **Audio integration**: Jumpscare audio stops all other sounds

### Hotspot Activation Limits

Hotspots can be configured with activation limits using the `meta` property:

```javascript
meta: { 
  maxActivations: 3,      // Limit hotspot to 3 activations
  activationCount: 0      // Auto-tracked, starts at 0
}
```

- Counter appears in header showing remaining activations: "Antal aktiveringer: 2"
- When exhausted, shows: "Hotspot opbrugt" 
- Exhausted hotspots cannot be activated
- Text labels configurable in `settings.js` via `activationCounterText` and `hotspotExhaustedText`

### Debugging Tools
- Set `debugHotspots: true` in `settings.js` to show green outlines
- Console logs available for media loading and page transitions
- Timer visualization via blue progress bar in footer

### Common Patterns
- **Foreshadowing**: Early hotspots that reference later story elements
- **Foldback**: Multiple paths that reconverge at story beats  
- **Climax branching**: CLICK/TIMEOUT leading to different endings
- **Reset loops**: Both ending pages return to `#page1`