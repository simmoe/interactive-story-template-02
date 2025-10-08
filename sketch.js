let startPage = "#page1"
// Initialiser pagesById med det samme
let pagesById = {}
pages.forEach(p => pagesById[p.id] = p)
let current = null

let activeHotspot = null
let hotspotStart = 0
let activeOverlayImg = null
let overlayAlpha = 0

// Film overlay variables
let filmOverlayImg = null
let filmOverlayAlpha = 0

let filmSession = null

// Choice system variables
let choiceSession = null // { choices: [], currentIndex: 0, lastSwitch: 0, images: [] }
let pageChoiceTimer = null // { startTime: 0, duration: 0, activated: false }

let captionBar, captionText, timerFill, pageHeading, hotspotCounter
let jumpscareOverlay, jumpscareContent
let canvas

let activeAudio = null // hotspot-lyd
let activeBackgroundAudio = null // backgroundsound
let activeOverlayVideo = null; // p5.MediaElement
let activeBackgroundVideo = null; // p5.MediaElement
let overlayVideoAlpha = 0;

let jumpscareSession = null // { start, wait, duration, media, nextPage }
let userInteracted = false

// MQTT variables
let mqttClient = null
let mqttConnected = false

function setupDomBindings(){
  captionBar = select('#captionBar')
  captionText = select('#captionText')
  timerFill = select('#timerFill')
  pageHeading = select('#pageHeading')
  hotspotCounter = select('#hotspotCounter')
  jumpscareOverlay = select('#jumpscareOverlay')
  jumpscareContent = select('#jumpscareContent')
  console.log('DOM bindings sat:', {captionBar, captionText, timerFill, pageHeading, hotspotCounter, jumpscareOverlay})
}

function preload(){
  // Collect all assets from structure
  collectAssetsFromStructure();
  // Preload critical assets (images only to avoid CORS)
  // Audio and video will be loaded on-demand with error handling
}

async function setup(){
  // Initialize start screen with settings
  select('#startTitle').html(settings.startTitle)
  if (settings.startBackground) {
    select('#clickToStartAudio').style('background-image', `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${settings.startBackground})`)
  }
  
  select('#clickToStartAudio').mousePressed(async () => {
    select('#clickToStartAudio').hide()
    
    // Show loading message
    const loadingDiv = createDiv('Loading assets...');
    loadingDiv.style('position', 'fixed');
    loadingDiv.style('top', '50%');
    loadingDiv.style('left', '50%');
    loadingDiv.style('transform', 'translate(-50%, -50%)');
    loadingDiv.style('background', 'rgba(0,0,0,0.8)');
    loadingDiv.style('color', 'white');
    loadingDiv.style('padding', '20px');
    loadingDiv.style('border-radius', '10px');
    loadingDiv.style('z-index', '9999');

    try {
      // Preload assets
      await preloadAllAssets();
      loadingDiv.remove();
      
      // Continue with normal setup
      const wrap = select('#canvasWrap')
      const rect = wrap.elt.getBoundingClientRect()
      canvas = createCanvas(rect.width, rect.height)
      canvas.parent('canvasWrap')

      setupDomBindings()
      enterPage(startPage)
      
      // Initialize MQTT if enabled
      if (settings.mqttEnabled) {
        setupMqtt()
      }
    } catch (error) {
      console.error('Asset loading failed:', error);
      loadingDiv.html('Some assets failed to load, but continuing...');
      setTimeout(() => {
        loadingDiv.remove();
        
        const wrap = select('#canvasWrap')
        const rect = wrap.elt.getBoundingClientRect()
        canvas = createCanvas(rect.width, rect.height)
        canvas.parent('canvasWrap')

        setupDomBindings()
        enterPage(startPage)
      }, 2000);
    }
  });
}

function windowResized(){
  const wrap = select('#canvasWrap')
  const rect = wrap.elt.getBoundingClientRect()
  resizeCanvas(rect.width, rect.height)
}

function draw(){
  background(8,10,16)
  if (current) {
    //console.log('draw: current side:', current.id)
  }

  // render background image if any
  if (current && current._bg) {
    image(current._bg, 0, 0, width, height)
    //console.log('Tegner baggrundsbillede')
  } 

  // DEBUG: tegn rammer omkring hotspots
  if (settings.debugHotspots && current && current.hotspots) {
    drawHotspotDebug(current.hotspots)
  }

  // film mode
  if (activeBackgroundVideo){
      image(activeBackgroundVideo, 0, 0, width, height)
  }

  // film overlay for choice period
  if (filmSession && filmSession.promptVisible && filmOverlayImg) {
    push();
    noStroke();
    const a = constrain(filmOverlayAlpha, 0, 255);
    tint(255, a);
    
    const overlay = filmSession.spec.overlay;
    if (overlay) {
      let x = overlay.x || 0.2;
      let y = overlay.y || 0.2;
      let w = overlay.w || 0.6;
      let h = overlay.h || 0.6;
      
      // Convert percent coordinates to pixels
      if (x <= 1) x = x * width;
      if (y <= 1) y = y * height;
      if (w <= 1) w = w * width;
      if (h <= 1) h = h * height;
      
      image(filmOverlayImg, x, y, w, h);
    }
    
    pop();
    filmOverlayAlpha = lerp(filmOverlayAlpha, 255, 0.04);
  }

  // overlay for active hotspot image
  if (activeHotspot && activeOverlayImg){
    push();
    noStroke();
    const a = constrain(overlayAlpha, 0, 255);
    tint(255, a);
    
    let x, y, w, h;
    
    // Check if overlay has custom coordinates
    if (activeOverlayImg._customCoords) {
      const coords = activeOverlayImg._customCoords;
      x = coords.x !== undefined ? coords.x : activeHotspot.x;
      y = coords.y !== undefined ? coords.y : activeHotspot.y;
      w = coords.w !== undefined ? coords.w : activeHotspot.w;
      h = coords.h !== undefined ? coords.h : activeHotspot.h;
      
      // Convert to pixels if needed
      if (x <= 1 && y <= 1) {
        x = percentToPixel(x, 'x');
        y = percentToPixel(y, 'y');
        if (w && w <= 1) w = w * width;
        if (h && h <= 1) h = h * height;
      }
      
      // Use custom coordinates
      image(activeOverlayImg, x, y, w || width * 0.3, h || height * 0.3);
    } else {
      // Use hotspot coordinates (original behavior)
      x = activeHotspot.x;
      y = activeHotspot.y;
      if (x <= 1 && y <= 1) {
        x = percentToPixel(x, 'x');
        y = percentToPixel(y, 'y');
      }
      if (activeHotspot.r){
        const w = percentToPixel(activeHotspot.r * 2, 'x');
        const h = percentToPixel(activeHotspot.r * 2, 'x');
        image(activeOverlayImg, x - w/2, y - w/2, w, h);
      } else {
        let w = activeHotspot.w, hH = activeHotspot.h;
        if (w && w <= 1) w = w * width;
        if (hH && hH <= 1) hH = hH * height;
        image(activeOverlayImg, x, y, w, hH);
      }
    }
    
    pop();
    overlayAlpha = lerp(overlayAlpha, 255, 0.04);
  }

  // Choice system rendering
  if (choiceSession && choiceSession.choices) {
    // Handle choice switching timing
    const switchInterval = (settings.choiceShiftTime || 3) * 1000 // Convert to milliseconds
    if (millis() - choiceSession.lastSwitch > switchInterval) {
      choiceSession.currentIndex = (choiceSession.currentIndex + 1) % choiceSession.choices.length
      choiceSession.lastSwitch = millis()
      console.log('Choice highlight switched to index', choiceSession.currentIndex)
    }
    
    // Render all choice images
    push();
    noStroke();
    const a = constrain(overlayAlpha, 0, 255);
    
    choiceSession.choices.forEach((choice, index) => {
      const img = choiceSession.images[index];
      if (!img) return; // Skip if image not loaded yet
      
      // Calculate position and size
      let x = choice.x || 0.5;
      let y = choice.y || 0.5; 
      let w = choice.w || 0.3;
      let h = choice.h || 0.3;
      
      // Convert to pixels if needed
      if (x <= 1) x = percentToPixel(x, 'x');
      if (y <= 1) y = percentToPixel(y, 'y');
      if (w <= 1) w = w * width;
      if (h <= 1) h = h * height;
      
      // Apply highlighting to current choice
      if (index === choiceSession.currentIndex) {
        tint(255, a); // Full brightness for highlighted choice
        // Optional: add glow effect
        push();
        drawingContext.shadowBlur = 20;
        drawingContext.shadowColor = 'rgba(255, 255, 255, 0.8)';
        image(img, x, y, w, h);
        pop();
      } else {
        tint(255, a * 0.5); // Dimmed for non-highlighted choices
      }
      
      image(img, x, y, w, h);
    });
    
    pop();
    overlayAlpha = lerp(overlayAlpha, 255, 0.04);
  }

  // overlay for active hotspot video
  if (activeHotspot && activeOverlayVideo){
    const params = activeOverlayVideo._drawParams || { x: 0, y: 0, w: 320, h: 180 };
    image(activeOverlayVideo, params.x, params.y, params.w, params.h);
  }

  // update timer UI for active hotspot
  if (activeHotspot){
    const elapsed = millis() - hotspotStart
    const dur = activeHotspot.duration || 0
    if (dur > 0){
      const pct = constrain(elapsed / dur, 0, 1)
      timerFill.elt.style.width = (pct * 100).toFixed(2) + '%'
      if (pct >= 1){
        // timeout path
        const to = activeHotspot.timeoutAction
        deactivateHotspot()
        hideCaption()
        if (to) goto(to)
      }
    }
  }
    // update timer UI for film prompt
  if (filmSession && filmSession.promptVisible && filmSession.duration > 0){
    const elapsed = millis() - filmSession.start
    const dur = filmSession.duration
    const pct = constrain(elapsed / dur, 0, 1)
    timerFill.elt.style.width = (pct * 100).toFixed(2) + '%'
    if (pct >= 1){
      // timeout path for film
      filmSession.promptVisible = false
      hideCaption()
      if (filmSession.spec.timeoutAction) goto(filmSession.spec.timeoutAction)
    }
  }
  
  // update jumpscare timer
  if (jumpscareSession && !jumpscareSession.triggered) {
    const elapsed = millis() - jumpscareSession.start
    if (elapsed >= jumpscareSession.wait) {
      triggerJumpscare()
    }
  }
  
  // update page choice timer
  if (pageChoiceTimer && !pageChoiceTimer.activated) {
    const elapsed = millis() - pageChoiceTimer.startTime
    if (elapsed >= pageChoiceTimer.duration) {
      activatePageChoices()
    }
  }
}

function enterPage(id){
  current = pagesById[id]
  activeHotspot = null
  filmSession = null
  jumpscareSession = null
  choiceSession = null // Clear choice session
  pageChoiceTimer = null // Clear page choice timer
  overlayAlpha = 0
  hideHotspotCounter()
  hideJumpscare()
  
  // Stop backgroundsound hvis der er en aktiv
  if (activeBackgroundAudio) {
    activeBackgroundAudio.stop()
    activeBackgroundAudio = null
  }
  // Stop hotspot-lyd hvis der er en aktiv
  if (activeAudio) {
    activeAudio.stop()
    activeAudio = null
  }
  console.log('enterPage:', id, current)

  if (current.heading){
    pageHeading.html(current.heading)
    pageHeading.removeClass('hide')
    console.log('Sætter heading:', current.heading)
  } else {
    pageHeading.html('')
    pageHeading.addClass('hide')
    console.log('Ingen heading på denne side')
  }
  
  // setup jumpscare if defined
  setupJumpscare(current)
  
  // setup page-level choice system if defined
  setupPageChoices(current)

  // caption hidden by default
  hideCaption()

  if(current.background){
    // load background image (lazy)
    console.log('Loader baggrundsbillede:', current.background)
    loadImageSafe(current.background, img => {
      current._bg = img
      console.log('Baggrundsbillede loaded:', img)
    })
  }else{
    console.log('Intet bagrundsbillede her')
  }

  // start backgroundsound hvis property findes
  if (current.backgroundSound) {
    console.log('forsøger at starte baggrundslyd')
    activeBackgroundAudio = loadSound(current.backgroundSound, () => {
      if (activeBackgroundAudio) {
        activeBackgroundAudio.setLoop(true) 
        activeBackgroundAudio.play()
      }
    }, (error) => {
      console.log('Failed to load background audio:', current.backgroundSound, error)
      activeBackgroundAudio = null
    })
  }

  // start film if present
  if (current.film){
    console.log('Starter film:', current.film)
    
    // Load film overlay image if present
    if (current.film.overlay && current.film.overlay.image) {
      filmOverlayImg = safeLoadImage(current.film.overlay.image)
      filmOverlayAlpha = 0
    } else {
      filmOverlayImg = null
    }
    
    activeBackgroundVideo = safeCreateVideo(current.film.video, ()=>{
      activeBackgroundVideo.size(640, 360);
      activeBackgroundVideo.play();
      activeBackgroundVideo.hide();
      setTimeout(() => {
        showCaption(current.film.text)
        startTimerUi()
          // Start film-timer-session
          filmSession = {
            start: millis(),
            duration: current.film.duration || 0,
            spec: current.film,
            promptVisible: true
          }
      }, current.film.videoDuration)
    })
  }else{
    activeBackgroundVideo = null
    filmOverlayImg = null
  }
}


function goto(id){
  if (!id) return
  
  // Reset hotspots if going back to start page or from death/escape pages
  if (id === startPage || (current && (current.id === '#death' || current.id === '#escape'))) {
    resetAllHotspotCounters()
  }
  
  stopAllMedia()
  enterPage(id)
}

function resetAllHotspotCounters() {
  // Reset activation counters for all hotspots in all pages
  pages.forEach(page => {
    if (page.hotspots) {
      page.hotspots.forEach(hotspot => {
        if (hotspot.meta && hotspot.meta.maxActivations) {
          hotspot.meta.activationCount = 0
        }
      })
    }
  })
  console.log('All hotspot activation counters reset')
}

function stopAllMedia(){
  select('#captionBar').removeClass('show')
  
  filmSession = null
  filmOverlayImg = null
  filmOverlayAlpha = 0
}

function mousePressed(){
  // Only handle mouse clicks if mouse is enabled in settings
  if (settings.mouseEnabled) {
    onPhysicalClick()
  }
}

function setupMqtt() {
  try {
    console.log('Setting up MQTT connection...')
    
    // Connect to MQTT server
    mqttClient = mqtt.connect(settings.mqttServer)

    // Handle connection success
    mqttClient.on('connect', () => {
      console.log('MQTT Client connected to:', settings.mqttServer)
      mqttConnected = true
      
      // Subscribe to the configured topic
      mqttClient.subscribe(settings.mqttTopic, (err) => {
        if (err) {
          console.error('MQTT subscription error:', err)
        } else {
          console.log('MQTT subscribed to topic:', settings.mqttTopic)
        }
      })
    })
    
    // Handle incoming messages
    mqttClient.on('message', (topic, message) => {
      console.log('MQTT message received:', message.toString(), 'on topic:', topic)
      
      // Treat any MQTT message as a physical click
      onPhysicalClick()
    })
    
    // Handle connection errors
    mqttClient.on('error', (error) => {
      console.error('MQTT connection error:', error)
      mqttConnected = false
    })
    
    // Handle disconnection
    mqttClient.on('close', () => {
      console.log('MQTT connection closed')
      mqttConnected = false
    })
    
  } catch (error) {
    console.error('Failed to setup MQTT:', error)
  }
}

function keyPressed(){
  // Editor shortcuts
  if ((keyIsDown(CONTROL) || keyIsDown(ALT)) && (key === 'e' || key === 'E')) {
    // Ctrl/Cmd + E to toggle editor
    if (typeof toggleEditor === 'function') {
      toggleEditor();
    }
    return false; // Prevent default
  }
  
  if (key === 'Escape') {
    // Escape to close editor
    if (typeof editorVisible !== 'undefined' && editorVisible && typeof hideEditor === 'function') {
      hideEditor();
    }
    return false; // Prevent default
  }
  
  // Let other keys pass through
  return true;
}

function onPhysicalClick(){
  // film prompt has priority
  if (filmSession && filmSession.promptVisible){
    const a = filmSession.spec.action
    stopAllMedia()
    hideCaption()
    if (a) goto(a)
    return
  }
  
  // Choice system has second priority
  if (activeHotspot && choiceSession && choiceSession.choices) {
    const selectedChoice = choiceSession.choices[choiceSession.currentIndex]
    if (selectedChoice && selectedChoice.action) {
      console.log('Choice selected:', selectedChoice.action, 'from choice', choiceSession.currentIndex)
      choiceSession = null // Clear choice session
      deactivateHotspot()
      goto(selectedChoice.action)
      return
    }
  }
  
  // Standard hotspot handling
  if (activeHotspot){
    const a = activeHotspot.action
    deactivateHotspot()
    if (a) goto(a)
    return
  }
  
  // Page-level choice system (when no hotspot is active)
  if (choiceSession && choiceSession.choices && !activeHotspot) {
    const selectedChoice = choiceSession.choices[choiceSession.currentIndex]
    if (selectedChoice && selectedChoice.action) {
      console.log('Page choice selected:', selectedChoice.action, 'from choice', choiceSession.currentIndex)
      choiceSession = null // Clear choice session
      pageChoiceTimer = null // Clear page timer
      goto(selectedChoice.action)
      return
    }
  }
}

function showCaption(t=''){
  captionText.html(t || '')
  captionBar.removeClass('hide')
  timerFill.elt.style.width = '0%'
  showFooter(); // Show footer when caption is shown
}

function hideCaption(){
  captionBar.addClass('hide')
  timerFill.elt.style.width = '0%'
  hideFooter(); // Hide footer when caption is hidden
}

function startTimerUi(){
  // width is updated in draw()
  timerFill.elt.style.width = '0%'
}

function activateHotspot(h){
  if (activeHotspot === h) return
  
  // Check if hotspot is exhausted
  if (h.meta && h.meta.maxActivations && h.meta.activationCount >= h.meta.maxActivations) {
    showHotspotCounter(settings.hotspotExhaustedText)
    return
  }
  
  activeHotspot = h
  hotspotStart = millis()
  overlayAlpha = 0

  // Update activation counter
  if (h.meta && h.meta.maxActivations) {
    h.meta.activationCount = (h.meta.activationCount || 0) + 1
    const remaining = h.meta.maxActivations - h.meta.activationCount
    showHotspotCounter(settings.activationCounterText + remaining)
  }

  // caption
  showCaption(h.text || '')

  // Check if this is a choice hotspot
  if (h.actions && Array.isArray(h.actions) && h.actions.length > 0) {
    // Set up choice system
    choiceSession = {
      choices: h.actions,
      currentIndex: 0,
      lastSwitch: millis(),
      images: []
    }
    
    // Preload choice images
    h.actions.forEach((choice, index) => {
      if (choice.image) {
        loadImageSafe(choice.image, img => {
          if (choiceSession && choiceSession.images) {
            choiceSession.images[index] = img
          }
        })
      }
    })
    
    console.log('Choice system activated with', h.actions.length, 'choices')
  }

  // Standard overlay image handling (works alongside choice system)
  activeOverlayImg = null;
  if (h.media && h.media.overlay){
    let overlayPath, overlayCoords = null;
    
    // Handle both string and object formats for overlay
    if (typeof h.media.overlay === 'string') {
      overlayPath = h.media.overlay;
    } else if (typeof h.media.overlay === 'object') {
      overlayPath = h.media.overlay.image || h.media.overlay.src;
      overlayCoords = h.media.overlay;
    }
    
    if (overlayPath) {
      loadImageSafe(overlayPath, img => { 
        activeOverlayImg = img;
        // Store custom coordinates if provided
        if (overlayCoords && (overlayCoords.x !== undefined || overlayCoords.y !== undefined || overlayCoords.w !== undefined || overlayCoords.h !== undefined)) {
          activeOverlayImg._customCoords = overlayCoords;
        }
      });
    }
  }

  // overlay video if provided
  if (activeOverlayVideo) {
    activeOverlayVideo.stop();
    activeOverlayVideo.remove();
    activeOverlayVideo = null;
  }
  if (h.media && h.media.video){
    // Beregn position og størrelse
    let x = h.x, y = h.y, w = h.w, hH = h.h;
    if (x <= 1 && y <= 1) {
      x = percentToPixel(x, 'x');
      y = percentToPixel(y, 'y');
      if (w && w <= 1) w = w * width;
      if (hH && hH <= 1) hH = hH * height;
    }
    activeOverlayVideo = createVideo(h.media.video, ()=>{
      activeOverlayVideo.size(w || 320, hH || 180);
      activeOverlayVideo.play();
    // update timer UI for film prompt
    if (filmSession && filmSession.promptVisible && filmSession.duration > 0){
      const elapsed = millis() - filmSession.start
      const dur = filmSession.duration
      const pct = constrain(elapsed / dur, 0, 1)
      timerFill.elt.style.width = (pct * 100).toFixed(2) + '%'
      if (pct >= 1){
        // timeout path for film
        filmSession.promptVisible = false
        hideCaption()
        if (filmSession.spec.timeoutAction) goto(filmSession.spec.timeoutAction)
      }
    }
      activeOverlayVideo.hide();
    });
    // Gem params til draw
    activeOverlayVideo._drawParams = { x, y, w: w || 320, h: hH || 180 };
  }
  // audio if provided
  if (h.media && h.media.audio){
    if (activeAudio) {
      activeAudio.stop()
      activeAudio = null
    }
    activeAudio = loadSound(h.media.audio, () => {
      if (activeAudio) {
        activeAudio.play()
      }
    }, (error) => {
      console.log('Failed to load audio:', h.media.audio, error)
      activeAudio = null
    })
  }
}

function deactivateHotspot(){
  activeHotspot = null
  activeOverlayImg = null
  choiceSession = null // Clear choice session
  overlayAlpha = 0
  hideCaption()
  hideHotspotCounter()
  if (activeAudio) {
    activeAudio.stop()
    activeAudio = null
  }
}

function showHotspotCounter(text) {
  if (hotspotCounter) {
    hotspotCounter.html(text)
    hotspotCounter.removeClass('hide')
  }
}

function hideHotspotCounter() {
  if (hotspotCounter) {
    hotspotCounter.addClass('hide')
  }
}

function setupJumpscare(page) {
  if (page.jumpscare && page.jumpscare.wait) {
    jumpscareSession = {
      start: millis(),
      wait: page.jumpscare.wait,
      duration: page.jumpscare.duration || 3000,
      media: page.jumpscare,
      nextPage: page.jumpscare.nextPage,
      triggered: false
    }
    
    // Preload jumpscare media
    if (page.jumpscare.image) {
      loadImageSafe(page.jumpscare.image, img => {
        if (jumpscareSession) {
          jumpscareSession.preloadedImage = img
        }
      })
    }
    
    console.log('Jumpscare setup - will trigger in', page.jumpscare.wait, 'ms')
  }
}

function setupPageChoices(page) {
  if (page.actions && Array.isArray(page.actions) && page.actions.length > 0 && page.duration) {
    pageChoiceTimer = {
      startTime: millis(),
      duration: page.duration,
      activated: false
    }
    
    console.log('Page choice system setup - will activate in', page.duration, 'ms with', page.actions.length, 'choices')
  }
}

function activatePageChoices() {
  if (!pageChoiceTimer || pageChoiceTimer.activated || !current.actions) return
  
  pageChoiceTimer.activated = true
  
  // Deactivate any active hotspots - page choices take priority
  if (activeHotspot) {
    console.log('Deactivating hotspot to make way for page choices')
    deactivateHotspot()
  }
  
  // Set up choice system (similar to hotspot choice system)
  choiceSession = {
    choices: current.actions,
    currentIndex: 0,
    lastSwitch: millis(),
    images: []
  }
  
  // Preload choice images
  current.actions.forEach((choice, index) => {
    if (choice.image) {
      loadImageSafe(choice.image, img => {
        if (choiceSession && choiceSession.images) {
          choiceSession.images[index] = img
        }
      })
    }
  })
  
  console.log('Page choice system activated with', current.actions.length, 'choices')
}

function triggerJumpscare() {
  if (!jumpscareSession || jumpscareSession.triggered) return
  
  jumpscareSession.triggered = true
  jumpscareSession.showStart = millis()
  
  // Stop all current media
  stopAllMedia()
  
  // Show jumpscare content
  jumpscareContent.html('')
  
  if (jumpscareSession.media.image && jumpscareSession.preloadedImage) {
    const img = createImg(jumpscareSession.media.image, '')
    img.parent(jumpscareContent)
  } else if (jumpscareSession.media.video) {
    const video = createVideo(jumpscareSession.media.video)
    video.parent(jumpscareContent)
    video.play()
  }
  
  // Play jumpscare audio
  if (jumpscareSession.media.audio) {
    if (activeAudio) activeAudio.stop()
    activeAudio = loadSound(jumpscareSession.media.audio, () => {
      if (activeAudio) {
        activeAudio.play()
      }
    }, (error) => {
      console.log('Failed to load jumpscare audio:', jumpscareSession.media.audio, error)
      activeAudio = null
    })
  }
  
  // Show overlay
  showJumpscare()
  
  // Set timer to hide and continue
  setTimeout(() => {
    hideJumpscare()
    if (jumpscareSession.nextPage) {
      setTimeout(() => goto(jumpscareSession.nextPage), 500)
    }
  }, jumpscareSession.duration)
}

function showJumpscare() {
  if (jumpscareOverlay) {
    jumpscareOverlay.removeClass('hide')
    jumpscareOverlay.addClass('visible')
  }
}

function hideJumpscare() {
  if (jumpscareOverlay) {
    jumpscareOverlay.removeClass('visible')
    jumpscareOverlay.addClass('hide')
  }
}

function mouseMoved(){
  if (!current) return
  if (filmSession) return

  const h = hitTestHotspotUnderMouse()
  if (h && h !== activeHotspot){
    activateHotspot(h)
  } else if (!h && activeHotspot){
    deactivateHotspot()
  }
}

function hitTestHotspotUnderMouse(){
  if (!current || !current.hotspots) return null
  for (let i = current.hotspots.length - 1; i >= 0; i--){
    const h = current.hotspots[i]
    if (pointInHotspot(mouseX, mouseY, h)) return h
  }
  return null
}

function percentToPixel(val, axis) {
  // val: 0..1, axis: 'x' eller 'y'
  return axis === 'x' ? val * width : val * height
}

function pointInHotspot(px, py, h){
  let x = h.x, y = h.y, r = h.r, w = h.w, hH = h.h
  if (x <= 1 && y <= 1) {
    x = percentToPixel(x, 'x')
    y = percentToPixel(y, 'y')
    if (r && r <= 1) r = r * Math.min(width, height)
    if (w && w <= 1) w = w * width
    if (hH && hH <= 1) hH = hH * height
  }
  if (r){
    const dx = px - x
    const dy = py - y
    return dx*dx + dy*dy <= r*r
  }
  if (w && hH){
    return px >= x && px <= x + w && py >= y && py <= y + hH
  }
  return false
}

function loadImageSafe(path, cb){
  // Try preloaded asset first
  const preloaded = getPreloadedImage(path);
  if (preloaded) {
    cb(preloaded);
    return;
  }
  
  // Fallback to dynamic loading with error handling
  try {
    loadImage(path, img => cb(img), err => {
      console.warn('Image load failed:', path, 'trying fallback')
      loadImage('./assets/dummy.png', img2 => cb(img2), err2 => {
        console.warn('Fallback image also failed, using null')
        cb(null)
      })
    })
  } catch (e) {
    console.warn('loadImage threw error:', path, e)
    cb(null)
  }
}

function drawHotspotDebug(hotspots) {
  push()
  noFill()
  stroke(0, 255, 0)
  strokeWeight(2)
  for (const h of hotspots) {
    // Brug procent-koordinater hvis de findes
    let x = h.x, y = h.y, r = h.r, w = h.w, hH = h.h
    if (x <= 1 && y <= 1) {
      x = percentToPixel(x, 'x')
      y = percentToPixel(y, 'y')
      if (r && r <= 1) r = r * Math.min(width, height)
      if (w && w <= 1) w = w * width
      if (hH && hH <= 1) hH = hH * height
    }
    if (r) {
      ellipse(x, y, r*2, r*2)
    } else if (w && hH) {
      rect(x, y, w, hH)
    }
  }
  pop()
}

function showFooter() {
  select('footer').addClass('footer-active');
}

function hideFooter() {
  select('footer').removeClass('footer-active');
}


function touchStarted() {
   if (getAudioContext().state !== 'running') {
     getAudioContext().resume();
   }
}