# 🏚️ Interactive Story Template

Create immersive, branching narratives that combine video, images, audio, and user choices in a single, engaging experience. Perfect for educational storytelling, interactive fiction, and multimedia presentations.

![Story Example](./assets/front.png)

## 🎯 What You Can Create

- **Branching narratives** with multiple paths and endings
- **Video-driven stories** with timed user choices
- **Interactive environments** with clickable hotspots
- **Multimedia experiences** combining images, audio, and video
- **Educational content** with engagement tracking
- **Horror stories, mysteries, adventures** - any genre you imagine!

## 🚀 Quick Start

### 1. Setup Your Environment
1. Download or clone this template
2. Open `index.html` in a web browser
3. Start customizing your story in `structure.js`

### 2. Configure Your Story
Edit `settings.js` to customize the experience:

```javascript
const settings = {
  startTitle: 'Click to Begin Your Adventure',    // Custom start screen title
  startBackground: './assets/front.png',          // Start screen background image
  debugHotspots: false,                          // Show hotspot boundaries (for development)
  activationCounterText: 'Activations left: ',   // Counter text (Danish/English)
  hotspotExhaustedText: 'Hotspot exhausted'      // Exhausted hotspot message
}
```

### 3. Create Your Story
All story content goes in `structure.js`. Here's a simple example:

```javascript
pages = [
  {
    id: '#start',
    title: 'The Beginning',
    background: './assets/front.png',
    heading: 'Welcome to the Mystery House',
    buttons: [{ text: 'Enter', action: '#inside', style: 'primary' }],
    hotspots: [
      {
        type: 'hotspot',
        x: 0.5, y: 0.3,        // Center of the screen (50% width, 30% height)
        r: 0.1,                // 10% radius circle
        text: 'Examine the window',
        duration: 3000,        // 3 second timer
        action: '#window',     // If user clicks
        timeoutAction: '#door' // If user waits
      }
    ]
  }
]
```

## 📖 Story Structure Guide

### Page Objects
Each page represents a scene in your story. Every page needs these **required fields**:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `id` | string | Unique identifier | `'#page1'` |
| `title` | string | Page title | `'The Basement'` |
| `background` | string | Background image path | `'./assets/basement.png'` |

### Optional Page Features

#### 🎬 Video Scenes
Create video-driven choices that play automatically:

```javascript
{
  id: '#basement',
  title: 'The Basement',
  film: {
    video: './assets/girl.mp4',      // Video file
    videoDuration: 4000,             // Video length (ms)
    duration: 3000,                  // Choice timer (ms)
    text: 'Help the girl or run?',   // Choice prompt
    overlay: {                       // Optional choice overlay
      image: './assets/choice-overlay.png',
      x: 0.2, y: 0.2, w: 0.6, h: 0.6
    },
    action: '#help',                 // CLICK outcome
    timeoutAction: '#run'            // TIMEOUT outcome
  }
}
```

#### 👻 Jumpscares
Add timed scares that trigger automatically:

```javascript
{
  id: '#corridor',
  title: 'The Corridor',
  background: './assets/gangen.png',
  jumpscare: {
    wait: 10000,                     // Wait 10 seconds
    duration: 3000,                  // Show for 3 seconds
    image: './assets/jumpscare.jpg', // Scare image
    audio: './assets/scream.wav',    // Scare sound
    nextPage: '#death'               // Where to go after
  }
}
```

#### 🎵 Background Audio
Add atmospheric sounds:

```javascript
{
  id: '#office',
  title: 'The Office',
  background: './assets/office.png',
  backgroundSound: './assets/tv.wav'  // Loops automatically
}
```

## 🎯 Interactive Hotspots

Hotspots are clickable areas that drive user interaction. They use **percentage coordinates** (0-1) for responsive design.

### Basic Hotspot Structure

```javascript
{
  type: 'hotspot',
  x: 0.5,           // 50% from left edge
  y: 0.3,           // 30% from top edge
  r: 0.1,           // Circular radius (10% of screen width)
  // OR use rectangle:
  w: 0.2, h: 0.15,  // Width and height (20% x 15%)
  
  text: 'Examine the door',    // Tooltip text
  duration: 5000,              // Timer duration (5 seconds)
  action: '#nextRoom',         // Where to go if user CLICKS
  timeoutAction: '#stay',      // Where to go if timer expires
}
```

### Media Integration

#### 🖼️ Image Overlays
Show images when hotspots are activated:

```javascript
media: {
  audio: './assets/door.mp3',      // Sound effect
  overlay: './assets/papers.png'   // Simple overlay
  // OR custom positioned overlay:
  overlay: {
    image: './assets/papers.png',
    x: 0.1, y: 0.2,              // Custom position
    w: 0.5, h: 0.3               // Custom size
  }
}
```

#### 🎥 Video Overlays
Display video content in hotspots:

```javascript
media: {
  video: './assets/stairs.mov'     // Video overlay
}
```

### Advanced Features

#### 🔢 Limited Activations
Restrict how many times a hotspot can be used:

```javascript
meta: {
  maxActivations: 3,              // Can only be used 3 times
  activationCount: 0,             // Auto-tracked by system
  tooltip: 'Search the drawer'    // Hover text
}
```

## 🎮 Interaction Pattern

This framework uses a **unique binary choice system** perfect for educational settings:

- **🖱️ CLICK** (press button during timer) → Goes to `action`
- **⏱️ TIMEOUT** (wait for timer to expire) → Goes to `timeoutAction`

This maps perfectly to hardware setups where students have a single physical button connected via MQTT.

### Navigation Flow

```
User enters page → Background loads → Hotspots activate
                                           ↓
User clicks hotspot → Timer starts → Media plays
                                           ↓
                     User choice period:
                     CLICK → action
                     WAIT → timeoutAction
```

## 🎨 Design Best Practices

### 1. Responsive Coordinates
Always use percentage values (0-1) for positions and sizes:
```javascript
x: 0.5,    // 50% from left
y: 0.3,    // 30% from top  
r: 0.1     // 10% radius
```

### 2. Clear Visual Hierarchy
Use button styles to guide users:
```javascript
buttons: [
  { text: 'Back', action: '#prev', style: 'secondary' },
  { text: 'Continue', action: '#next', style: 'primary' }
]
```

### 3. Meaningful Timing
Choose durations that match your content:
- **Quick reactions**: 2-3 seconds
- **Examination**: 5-7 seconds  
- **Tension building**: 8-15 seconds

### 4. Audio Feedback
Enhance immersion with strategic audio:
```javascript
media: {
  audio: './assets/doorcreak.mp3',  // Immediate feedback
  overlay: './assets/door-open.png'  // Visual confirmation
}
```

## 🛠️ Development Tools

### Debug Mode
Enable hotspot visualization during development:

```javascript
// In settings.js
debugHotspots: true  // Shows green outlines around clickable areas
```

### File Organization
```
your-story/
├── index.html          # Main HTML structure (don't edit)
├── structure.js        # Your story content (EDIT THIS)
├── settings.js         # Configuration (EDIT THIS)
├── sketch.js          # Rendering engine (don't edit)
├── style.css          # Styling (don't edit)
└── assets/            # Your media files
    ├── images/
    ├── audio/
    └── video/
```

## 📚 Example Patterns

### Mystery/Horror Story
```javascript
{
  id: '#investigation',
  background: './assets/crime-scene.png',
  heading: 'The Evidence',
  hotspots: [
    {
      x: 0.2, y: 0.4, r: 0.08,
      text: 'Examine the bloodstain',
      media: { overlay: './assets/blood-closeup.png' },
      duration: 4000,
      action: '#revelation',
      timeoutAction: '#missed-clue'
    }
  ]
}
```

### Educational Content
```javascript
{
  id: '#science-lab',
  background: './assets/laboratory.png',
  heading: 'Chemical Reaction',
  hotspots: [
    {
      x: 0.6, y: 0.3, w: 0.2, h: 0.2,
      text: 'Mix the chemicals?',
      duration: 8000,
      action: '#explosion',      // Quick decision = accident
      timeoutAction: '#careful', // Patient = success
      meta: { maxActivations: 1 }
    }
  ]
}
```

## 🎯 Tips for Educators

1. **Binary Choices**: Perfect for teaching decision-making under pressure
2. **Consequence Learning**: Show immediate results of choices
3. **Engagement Tracking**: Use `maxActivations` to ensure thorough exploration
4. **Multimedia Learning**: Combine visual, auditory, and interactive elements
5. **Branching Paths**: Create multiple story routes to encourage replay

---

## 📄 Technical Notes

- Framework built on **p5.js** for robust canvas rendering
- Supports **16:9 aspect ratio** with responsive scaling
- **CSS Grid layout** for modern browser compatibility
- **Preloading system** ensures smooth media playback
- **State management** handles complex branching narratives

Ready to create your story? Start editing `structure.js` and bring your narrative to life! 🚀
