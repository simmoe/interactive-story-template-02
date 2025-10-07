let startPage = "#page1"
// Initialiser pagesById med det samme
let pagesById = {}
pages.forEach(p => pagesById[p.id] = p)
let current = null

let activeHotspot = null
let hotspotStart = 0
let activeOverlayImg = null
let overlayAlpha = 0

let filmSession = null

let captionBar, captionText, timerFill, pageHeading, buttonsContainer, hotspotCounter
let jumpscareOverlay, jumpscareContent
let canvas

let activeAudio = null // hotspot-lyd
let activeBackgroundAudio = null // backgroundsound
let activeOverlayVideo = null; // p5.MediaElement
let activeBackgroundVideo = null; // p5.MediaElement
let overlayVideoAlpha = 0;

let jumpscareSession = null // { start, wait, duration, media, nextPage }
let userInteracted = false

function setupDomBindings(){
  captionBar = select('#captionBar')
  captionText = select('#captionText')
  timerFill = select('#timerFill')
  pageHeading = select('#pageHeading')
  buttonsContainer = select('#buttonsContainer')
  hotspotCounter = select('#hotspotCounter')
  jumpscareOverlay = select('#jumpscareOverlay')
  jumpscareContent = select('#jumpscareContent')
  console.log('DOM bindings sat:', {captionBar, captionText, timerFill, pageHeading, buttonsContainer, hotspotCounter, jumpscareOverlay})
}

function preload(){
  // index pages
  pages.forEach(p => pagesById[p.id] = p)
}

function setup(){
  select('#clickToStartAudio').mousePressed(() => {
    select('#clickToStartAudio').hide()

  const wrap = select('#canvasWrap')
  const rect = wrap.elt.getBoundingClientRect()
  canvas = createCanvas(rect.width, rect.height)
  canvas.parent('canvasWrap')

  setupDomBindings()
  enterPage(startPage)
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
  } else {
    console.log('Intet baggrundsbillede loaded endnu')
  }

  // DEBUG: tegn rammer omkring hotspots
  if (settings.debugHotspots && current && current.hotspots) {
    drawHotspotDebug(current.hotspots)
  }

  // film mode
  if (activeBackgroundVideo){
      image(activeBackgroundVideo, 0, 0, width, height)
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
}

function enterPage(id){
  current = pagesById[id]
  activeHotspot = null
  filmSession = null
  jumpscareSession = null
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

  // buttons - support both single button (backward compatibility) and buttons array
  setupPageButtons(current)
  
  // setup jumpscare if defined
  setupJumpscare(current)

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
    activeBackgroundVideo = createVideo(current.film.video, ()=>{
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
  }
}


function goto(id){
  if (!id) return
  stopAllMedia()
  enterPage(id)
}

function stopAllMedia(){
  // stop video if any
  if (filmSession && filmSession.video){
    try { filmSession.video.pause() } catch(e){}
    try { filmSession.video.remove() } catch(e){}
  }
  filmSession = null
  // stop backgroundsound hvis der er en aktiv
  if (activeBackgroundAudio) {
    activeBackgroundAudio.stop()
    activeBackgroundAudio = null
  }
  // stop hotspot-lyd hvis der er en aktiv
  if (activeAudio) {
    activeAudio.stop()
    activeAudio = null
  }
}


function mousePressed(){
  // emulate physical click
  onPhysicalClick()
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
  if (activeHotspot){
    const a = activeHotspot.action
    deactivateHotspot()
    if (a) goto(a)
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
  
  // Cancel jumpscare only on actual hotspot activation (not just hover)
  // This will be handled in onPhysicalClick when hotspot is actually clicked
  
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

  // overlay image if provided
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

function setupPageButtons(page) {
  // Clear existing buttons
  buttonsContainer.html('')
  
  let buttons = []
  
  // Handle backward compatibility - single button object
  if (page.button && page.button.text) {
    buttons = [page.button]
  }
  // Handle new buttons array
  else if (page.buttons && Array.isArray(page.buttons)) {
    buttons = page.buttons.filter(btn => btn && btn.text)
  }
  
  if (buttons.length > 0) {
    buttons.forEach((btn, index) => {
      const buttonEl = createButton(btn.text)
      buttonEl.addClass('page-button')
      
      // Add styling classes
      if (btn.style === 'secondary' || (buttons.length > 1 && index > 0)) {
        buttonEl.addClass('secondary')
      } else {
        buttonEl.addClass('primary')
      }
      
      // Set click handler
      if (btn.action) {
        buttonEl.mousePressed(() => goto(btn.action))
      }
      
      // Append to container
      buttonEl.parent(buttonsContainer)
    })
    console.log('Satte', buttons.length, 'knapper')
  } else {
    console.log('Ingen knapper på denne side')
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
  loadImage(path, img => cb(img), err => {
    // fallback to dummy.png
    loadImage('./assets/dummy.png', img2 => cb(img2), err2 => cb(null))
  })
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