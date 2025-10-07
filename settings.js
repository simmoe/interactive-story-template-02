// settings.js
// Eleverne kan ændre disse indstillinger

const settings = {
  startTitle:'Tryk for at starte oplevelse',
  startBackground: './assets/away.png',
  debugHotspots: false, // Vis debug-rammer omkring hotspots
  // Hotspot activation counter texts
  activationCounterText: 'Antal aktiveringer: ',
  hotspotExhaustedText: 'Hotspot opbrugt',
  
  // MQTT Settings
  mqttTopic: 'interactive-story',
  mqttEnabled: true, // Enable/disable MQTT connection
  mouseEnabled: false, // Enable/disable mouse clicks (when MQTT is used)
  mqttServer: 'wss://mqtt.nextservices.dk' // MQTT server URL
}

