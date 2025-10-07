// Live Story Editor
// Activated with Shift+9 keyboard shortcut

let editorVisible = false;
let editorContainer = null;
let settingsEditor = null;
let structureEditor = null;

function initializeEditor() {
  // Create editor container
  editorContainer = document.createElement('div');
  editorContainer.id = 'storyEditor';
  editorContainer.className = 'hide';
  editorContainer.innerHTML = `
    <div class="editor-backdrop" onclick="hideEditor()"></div>
    <div class="editor-panel">
      <div class="editor-header">
        <h2>📝 Story Editor</h2>
        <div class="editor-info">
          <small>Press <kbd>Ctrl+E</kbd> to open • <kbd>Esc</kbd> to close</small>
        </div>
        <div class="editor-controls">
          <button onclick="applyChanges()" class="btn-primary">Apply Changes</button>
          <button onclick="exportConfig()" class="btn-secondary">Export</button>
          <button onclick="importConfig()" class="btn-secondary">Import</button>
          <button onclick="hideEditor()" class="btn-close">×</button>
        </div>
      </div>
      
      <div class="editor-content">
        <div class="editor-tabs">
          <button class="tab-btn active" onclick="switchTab('settings')">⚙️ Settings</button>
          <button class="tab-btn" onclick="switchTab('structure')">📖 Story Structure</button>
          <button class="tab-btn" onclick="switchTab('assets')">🖼️ Assets Guide</button>
          <button class="tab-btn" onclick="switchTab('help')">❓ Help & Reference</button>
        </div>
        
        <div class="tab-content">
          <div id="settingsTab" class="tab-pane active">
            <h3>Settings Configuration</h3>
            <p>Customize your story's appearance and behavior:</p>
            <textarea id="settingsEditor" placeholder="Loading settings..."></textarea>
          </div>
          
          <div id="structureTab" class="tab-pane">
            <h3>Story Structure</h3>
            <p>Define your pages and interactive elements:</p>
            <textarea id="structureEditor" placeholder="Loading story structure..."></textarea>
          </div>
          
          <div id="assetsTab" class="tab-pane">
            <h3>📁 Asset Management Guide</h3>
            <div class="asset-guide">
              <h4>🎯 How to Add Your Media Files</h4>
              
              <div class="method">
                <h5>📂 Method 1: GitHub Repository (Recommended)</h5>
                <ol>
                  <li>Upload your images, videos, and audio files to the <code>assets/</code> folder in your GitHub repository</li>
                  <li>Reference them in your story structure like: <code>"./assets/your-image.png"</code></li>
                  <li>Supported formats:
                    <ul>
                      <li><strong>Images:</strong> .png, .jpg, .jpeg, .gif</li>
                      <li><strong>Videos:</strong> .mp4, .mov, .webm</li>
                      <li><strong>Audio:</strong> .mp3, .wav, .flac</li>
                    </ul>
                  </li>
                </ol>
              </div>
              
              <div class="method">
                <h5>🌐 Method 2: External URLs</h5>
                <p>You can also use direct URLs to images/videos hosted elsewhere:</p>
                <code>"https://example.com/path/to/image.png"</code>
              </div>
              
              <div class="example">
                <h5>💡 Example Usage</h5>
                <pre><code>{
  id: '#page1',
  background: './assets/my-background.png',
  hotspots: [{
    media: {
      overlay: './assets/my-overlay.png',
      audio: './assets/my-sound.mp3'
    }
  }]
}</code></pre>
              </div>
              
              <div class="tips">
                <h5>💡 Pro Tips</h5>
                <ul>
                  <li>Keep file sizes reasonable (images under 2MB, videos under 10MB)</li>
                  <li>Use descriptive filenames: <code>office-background.png</code> instead of <code>img1.png</code></li>
                  <li>Test your story after adding new assets</li>
                  <li>Consider using compressed formats (JPEG for photos, PNG for graphics)</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div id="helpTab" class="tab-pane">
            <h3>📚 Interactive Story Framework Reference</h3>
            <div class="help-content">
              <div class="help-section">
                <h4>🎯 What You Can Create</h4>
                <ul>
                  <li><strong>Branching narratives</strong> with multiple paths and endings</li>
                  <li><strong>Video-driven stories</strong> with timed user choices</li>
                  <li><strong>Interactive environments</strong> with clickable hotspots</li>
                  <li><strong>Multimedia experiences</strong> combining images, audio, and video</li>
                  <li><strong>Educational content</strong> with engagement tracking</li>
                </ul>
              </div>

              <div class="help-section">
                <h4>📖 Story Structure Guide</h4>
                <h5>Required Page Fields:</h5>
                <table class="help-table">
                  <tr><th>Field</th><th>Type</th><th>Description</th><th>Example</th></tr>
                  <tr><td><code>id</code></td><td>string</td><td>Unique identifier</td><td><code>'#page1'</code></td></tr>
                  <tr><td><code>title</code></td><td>string</td><td>Page title</td><td><code>'The Basement'</code></td></tr>
                  <tr><td><code>background</code></td><td>string</td><td>Background image path</td><td><code>'./assets/basement.png'</code></td></tr>
                </table>

                <h5>Optional Page Features:</h5>
                <div class="feature-example">
                  <h6>🎬 Video Scenes</h6>
                  <pre><code>film: {
  video: './assets/girl.mp4',
  videoDuration: 4000,
  duration: 3000,
  text: 'Help the girl or run?',
  overlay: {
    image: './assets/choice-overlay.png',
    x: 0.2, y: 0.2, w: 0.6, h: 0.6
  },
  action: '#help',
  timeoutAction: '#run'
}</code></pre>
                </div>

                <div class="feature-example">
                  <h6>👻 Jumpscares</h6>
                  <pre><code>jumpscare: {
  wait: 10000,
  duration: 3000,
  image: './assets/jumpscare.jpg',
  audio: './assets/scream.wav',
  nextPage: '#death'
}</code></pre>
                </div>

                <div class="feature-example">
                  <h6>🎯 Interactive Hotspots</h6>
                  <pre><code>hotspots: [{
  type: 'hotspot',
  x: 0.5, y: 0.3, r: 0.1,  // 50% width, 30% height, 10% radius
  text: 'Examine the door',
  duration: 5000,
  action: '#nextRoom',
  timeoutAction: '#stay',
  media: {
    audio: './assets/door.mp3',
    overlay: './assets/door-open.png'
  },
  meta: {
    maxActivations: 3,
    activationCount: 0
  }
}]</code></pre>
                </div>
              </div>

              <div class="help-section">
                <h4>🎮 Interaction Pattern</h4>
                <p>This framework uses a <strong>binary choice system</strong>:</p>
                <ul>
                  <li><strong>🖱️ CLICK</strong> (press button during timer) → Goes to <code>action</code></li>
                  <li><strong>⏱️ TIMEOUT</strong> (wait for timer to expire) → Goes to <code>timeoutAction</code></li>
                </ul>
                <p>Perfect for educational settings with single physical button via MQTT.</p>
              </div>

              <div class="help-section">
                <h4>🎨 Design Best Practices</h4>
                <ul>
                  <li><strong>Responsive Coordinates:</strong> Always use percentage values (0-1) for positions</li>
                  <li><strong>Clear Timing:</strong> Quick reactions (2-3s), Examination (5-7s), Tension (8-15s)</li>
                  <li><strong>File Organization:</strong> Keep assets in <code>./assets/</code> folder</li>
                  <li><strong>File Sizes:</strong> Images under 2MB, videos under 10MB</li>
                </ul>
              </div>

              <div class="help-section">
                <h4>🛠️ Development Tools</h4>
                <ul>
                  <li><strong>Debug Mode:</strong> Set <code>debugHotspots: true</code> in settings to see hotspot outlines</li>
                  <li><strong>Editor Shortcuts:</strong> <kbd>Ctrl+E</kbd> to open, <kbd>Esc</kbd> to close</li>
                  <li><strong>Export/Import:</strong> Save and share your configurations as JSON files</li>
                </ul>
              </div>

              <div class="help-section">
                <h4>📡 MQTT Integration</h4>
                <p>Connect physical buttons via MQTT for interactive installations:</p>
                <div class="feature-example">
                  <h6>Settings Configuration:</h6>
                  <pre><code>const settings = {
  mqttEnabled: true,        // Enable MQTT connection
  mouseEnabled: false,      // Disable mouse clicks (use MQTT only)
  mqttTopic: 'my-story',    // MQTT topic to subscribe to
  mqttServer: 'wss://mqtt.nextservices.dk'  // MQTT server URL
}</code></pre>
                </div>
                <ul>
                  <li><strong>Any message</strong> on the MQTT topic triggers a "click"</li>
                  <li><strong>Mouse clicks</strong> can be disabled when using MQTT</li>
                  <li><strong>Connection status</strong> shown in top-left corner</li>
                  <li><strong>Perfect for</strong> physical installations with hardware buttons</li>
                </ul>
              </div>

              <div class="help-section">
                <h4>💡 Example Patterns</h4>
                <div class="pattern-example">
                  <h6>Mystery/Horror Story:</h6>
                  <pre><code>{
  id: '#investigation',
  background: './assets/crime-scene.png',
  heading: 'The Evidence',
  hotspots: [{
    x: 0.2, y: 0.4, r: 0.08,
    text: 'Examine the bloodstain',
    media: { overlay: './assets/blood-closeup.png' },
    duration: 4000,
    action: '#revelation',
    timeoutAction: '#missed-clue'
  }]
}</code></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <input type="file" id="importFile" accept=".json" style="display: none;" onchange="handleImport(event)">
  `;
  
  document.body.appendChild(editorContainer);
  
  // Initialize editors with current content
  updateEditorContent();
  
  // Add keyboard shortcut listener (will be handled by p5's keyPressed function)
  // Removed DOM listener in favor of p5's keyPressed()
}

// Remove the old handleKeyboard function since we're using p5's keyPressed
// Keyboard handling is now in sketch.js keyPressed() function

function toggleEditor() {
  if (editorVisible) {
    hideEditor();
  } else {
    showEditor();
  }
}

function showEditor() {
  editorVisible = true;
  editorContainer.classList.remove('hide');
  updateEditorContent();
  
  // Focus the active editor
  const activeTab = document.querySelector('.tab-btn.active').onclick.toString().match(/'(.+)'/)[1];
  if (activeTab === 'settings') {
    document.getElementById('settingsEditor').focus();
  } else if (activeTab === 'structure') {
    document.getElementById('structureEditor').focus();
  }
}

function hideEditor() {
  editorVisible = false;
  editorContainer.classList.add('hide');
}

function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  document.getElementById(tabName + 'Tab').classList.add('active');
}

function updateEditorContent() {
  // Update settings editor
  const settingsTextarea = document.getElementById('settingsEditor');
  if (settingsTextarea && typeof settings !== 'undefined') {
    settingsTextarea.value = JSON.stringify(settings, null, 2);
  }
  
  // Update structure editor
  const structureTextarea = document.getElementById('structureEditor');
  if (structureTextarea && typeof pages !== 'undefined') {
    structureTextarea.value = JSON.stringify(pages, null, 2);
  }
}

function applyChanges() {
  try {
    // Parse and validate JSON first
    const settingsText = document.getElementById('settingsEditor').value;
    const newSettings = JSON.parse(settingsText);
    
    const structureText = document.getElementById('structureEditor').value;
    const newPages = JSON.parse(structureText);
    
    // Store in localStorage for persistence across reload
    localStorage.setItem('tempSettings', JSON.stringify(newSettings));
    localStorage.setItem('tempPages', JSON.stringify(newPages));
    localStorage.setItem('editorAppliedChanges', 'true');
    
    showNotification('✅ Changes applied! Reloading story...', 'success');
    hideEditor();
    
    // Reload page to apply changes cleanly (avoids DOM conflicts)
    setTimeout(() => {
      location.reload();
    }, 800);
    
  } catch (error) {
    showNotification('❌ JSON Syntax Error: ' + error.message, 'error', 7000);
    console.error('Editor error:', error);
  }
}

function exportConfig() {
  const config = {
    settings: settings,
    pages: pages,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  
  const dataStr = JSON.stringify(config, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = 'story-config.json';
  link.click();
}

function importConfig() {
  document.getElementById('importFile').click();
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const config = JSON.parse(e.target.result);
      
      if (config.settings) {
        document.getElementById('settingsEditor').value = JSON.stringify(config.settings, null, 2);
      }
      
      if (config.pages) {
        document.getElementById('structureEditor').value = JSON.stringify(config.pages, null, 2);
      }
      
      alert('✅ Configuration imported successfully! Click "Apply Changes" to use it.');
      
    } catch (error) {
      alert('❌ Error importing file: ' + error.message);
    }
  };
  
  reader.readAsText(file);
  event.target.value = ''; // Reset file input
}

// Initialize editor when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Apply any pending changes from localStorage
  applyStoredChanges();
  
  initializeEditor();
  
  // Show a subtle hint about the editor on first load
  setTimeout(() => {
    if (!localStorage.getItem('editorHintShown')) {
      showNotification('💡 Tip: Press Ctrl+E to open the story editor!', 'info', 5000);
      localStorage.setItem('editorHintShown', 'true');
    }
    
    // Show success message if we just applied changes
    if (localStorage.getItem('editorAppliedChanges')) {
      showNotification('✅ Story updated successfully!', 'success', 3000);
      localStorage.removeItem('editorAppliedChanges');
    }
  }, 1000);
});

function applyStoredChanges() {
  try {
    const tempSettings = localStorage.getItem('tempSettings');
    const tempPages = localStorage.getItem('tempPages');
    
    if (tempSettings) {
      const newSettings = JSON.parse(tempSettings);
      Object.assign(settings, newSettings);
      localStorage.removeItem('tempSettings');
    }
    
    if (tempPages) {
      const newPages = JSON.parse(tempPages);
      pages.length = 0;
      pages.push(...newPages);
      localStorage.removeItem('tempPages');
      
      // Refresh asset collection after loading new pages
      if (typeof collectAssetsFromStructure === 'function') {
        collectAssetsFromStructure();
      }
    }
  } catch (error) {
    console.error('Error applying stored changes:', error);
  }
}

function showNotification(message, type = 'success', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Auto-remove
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, duration);
}