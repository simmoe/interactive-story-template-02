// Asset preloader - loads all assets to avoid CORS issues
let preloadedAssets = {
  images: {},
  videos: {},
  audio: {}
};

let assetsToPreload = [];
let preloadComplete = false;

function collectAssetsFromStructure() {
  assetsToPreload = [];
  
  // Collect from settings
  if (settings.startBackground) {
    addAssetToPreload(settings.startBackground, 'image');
  }
  
  // Collect from pages
  pages.forEach(page => {
    if (page.background) {
      addAssetToPreload(page.background, 'image');
    }
    
    if (page.backgroundSound) {
      addAssetToPreload(page.backgroundSound, 'audio');
    }
    
    if (page.film && page.film.video) {
      addAssetToPreload(page.film.video, 'video');
    }
    
    if (page.film && page.film.overlay && page.film.overlay.image) {
      addAssetToPreload(page.film.overlay.image, 'image');
    }
    
    if (page.jumpscare) {
      if (page.jumpscare.image) addAssetToPreload(page.jumpscare.image, 'image');
      if (page.jumpscare.video) addAssetToPreload(page.jumpscare.video, 'video');
      if (page.jumpscare.audio) addAssetToPreload(page.jumpscare.audio, 'audio');
    }
    
    if (page.hotspots) {
      page.hotspots.forEach(hotspot => {
        if (hotspot.media) {
          if (hotspot.media.overlay) {
            if (typeof hotspot.media.overlay === 'string') {
              addAssetToPreload(hotspot.media.overlay, 'image');
            } else if (hotspot.media.overlay.image) {
              addAssetToPreload(hotspot.media.overlay.image, 'image');
            }
          }
          if (hotspot.media.audio) addAssetToPreload(hotspot.media.audio, 'audio');
          if (hotspot.media.video) addAssetToPreload(hotspot.media.video, 'video');
        }
      });
    }
  });
  
  console.log('Assets to preload:', assetsToPreload);
}

function addAssetToPreload(path, type) {
  if (path && !assetsToPreload.find(a => a.path === path)) {
    assetsToPreload.push({ path, type });
  }
}

function preloadAllAssets() {
  return new Promise((resolve, reject) => {
    if (assetsToPreload.length === 0) {
      preloadComplete = true;
      resolve();
      return;
    }
    
    let loadedCount = 0;
    let errorCount = 0;
    
    function checkComplete() {
      if (loadedCount + errorCount >= assetsToPreload.length) {
        preloadComplete = true;
        console.log(`Preloading complete: ${loadedCount} loaded, ${errorCount} failed`);
        resolve();
      }
    }
    
    assetsToPreload.forEach(asset => {
      if (asset.type === 'image') {
        // Use p5's loadImage for better compatibility
        try {
          preloadedAssets.images[asset.path] = loadImage(asset.path, 
            () => {
              loadedCount++;
              checkComplete();
            },
            () => {
              console.warn('Failed to load image:', asset.path);
              errorCount++;
              checkComplete();
            }
          );
        } catch (e) {
          console.warn('Error loading image:', asset.path, e);
          errorCount++;
          checkComplete();
        }
      } else if (asset.type === 'audio') {
        // Skip audio preloading to avoid CORS issues - load on demand
        loadedCount++;
        checkComplete();
      } else if (asset.type === 'video') {
        // Skip video preloading to avoid CORS issues - load on demand  
        loadedCount++;
        checkComplete();
      }
    });
  });
}

// Override the existing asset loading functions to use preloaded assets
function getPreloadedImage(path) {
  return preloadedAssets.images[path] || null;
}

function safeLoadImage(path, successCallback, errorCallback) {
  const preloaded = getPreloadedImage(path);
  if (preloaded) {
    if (successCallback) successCallback();
    return preloaded;
  }
  
  // Fallback to p5 loadImage with error handling
  try {
    return loadImage(path, successCallback, errorCallback);
  } catch (e) {
    console.warn('Failed to load image:', path, e);
    if (errorCallback) errorCallback();
    return null;
  }
}

function safeCreateVideo(path, callback) {
  try {
    return createVideo(path, callback);
  } catch (e) {
    console.warn('Failed to load video:', path, e);
    if (callback) callback();
    return null;
  }
}

function safeLoadSound(path, callback, errorCallback) {
  try {
    return loadSound(path, callback, errorCallback);
  } catch (e) {
    console.warn('Failed to load audio:', path, e);
    if (errorCallback) errorCallback();
    return null;
  }
}