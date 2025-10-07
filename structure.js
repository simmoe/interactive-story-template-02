/*
  Interaktiv historie – structure.js
  ----------------------------------
  'pages' er et array af side-objekter. Hver side beskriver en interaktiv "tavle".

  ✅ Felter i et side-objekt (minimum):
  - id:        Unikt id (string), fx "#page1"
  - title:     Kort titel (string)
  - background: Sti til baggrundsbillede (string) – kan være lokal eller url
  - hotspots:  Liste af klik- eller hover-områder (array)

  ➕ Mulige ekstra felter i et side-objekt:
  - heading:   (string) En synlig overskrift der renderes som <h1> midt på siden
  - buttons:   (array) Liste af knapper: [{ text: 'Tekst', action: '#id', style?: 'primary|secondary' }]
  - button:    (object) En valgfri knap med tekst og evt. handling (bagudkompatibilitet)
  - film:      (object) Valgfrit fuldskærms-klip, der afspilles automatisk og slutter med valg via CLICK/TIMEOUT
               Struktur: { video: '...mp4', duration: ms, text: 'bjælketekst', action?: '#id', timeoutAction?: '#id' }
  - jumpscare: (object) Automatisk fuldskærms jumpscare efter ventetid
               Struktur: { wait: ms, duration: ms, image?: '...jpg', video?: '...mp4', audio?: '...wav', nextPage?: '#id' }

  ✅ Felter i et hotspot-objekt (enkelt og konsekvent):
  - type:   "text" | "goto" | "audio" | "video" | "image" | "hotspot"
  - x, y:   centrum-koordinater i pixels
  - r:      radius (cirkelområde) – brug r ELLER w+h
  - w, h:   bredde og højde (rektangelområde)
  - text:   tekst der kan vises (tooltip eller bjælke nederst)
  - action: mål for navigation (fx "#page2") – valgfri
  - timeoutAction: mål for navigation hvis timeren udløber uden klik (valgfri)
  - media:  objekt med evt. { audio, overlay, image, video }
            overlay kan være string (sti) eller objekt: { image: 'sti.png', x: 0.1, y: 0.2, w: 0.5, h: 0.3 }
            hvis overlay-objekt har x,y,w,h coords bruges disse, ellers arves fra hotspot
  - duration: varighed i ms (timer-bjælken er altid blå)
  - meta:  valgfrit objekt, fx { tooltip: "...", maxActivations: 3 }

  INTERAKTION (kun én fysisk knap):
  - Spilleren kan KUN vælge ved at trykke på knappen MENS timeren kører (CLICK),
    eller ved IKKE at trykke indtil timeren løber ud (TIMEOUT).
  - Dette matcher et MQTT-input til websiden. `action` bruges til CLICK, `timeoutAction` til TIMEOUT.

  Bemærk: Ingen logik her – kun data. En visningsmotor kan senere parse disse felter.
*/

pages = [
  // ------------------------
  // Side 1 – Anslag (Forsiden)
  // ------------------------
  {
    id: '#page1',
    title: 'Huset i passet',
    background: './assets/front.png',
    heading: 'Velkommen til passet',
    buttons: [
      { 
        text: 'Gå ind af fordøren', 
        action: '#page2', 
        style: 'primary' 
      }
    ],
    backgroundSound: './assets/storm.mp3',
    hotspots: [
      // Månen – foreshadowing + genvej til klimaks-aksen
      {
        type: 'hotspot',
        x: 0.38, y: 0.25, r: 0.08, // 800/1000, 200/1000, 60/750
        text: 'Gå direkte ned i kælderen?',
        media: {
          audio: './assets/doorOhh.mp3',
          overlay: './assets/bloodmoon.png'
        },
        duration: 5000,
        action: '#page4',
        meta: {
          maxActivations: 3,
          activationCount: 0
        }
      }
    ]
  },

  // ----------------------------------------
  // Side 2 – Kontoret (Præsentation/Forstyrrelse)
  // ----------------------------------------
  {
    id: '#page2',
    title: 'Kontoret',
    background: './assets/office.png',
    heading: 'Kontoret',
    backgroundSound: './assets/tv.wav',
    buttons: [
      { text: 'Tilbage', action: '#page1', style: 'secondary' },
      { text: 'Gå videre til gangen', action: '#page3', style: 'primary' }
    ],

    hotspots: [
      {
        type: 'hotspot',
        x: 0.3, y: 0.55, w: 0.25, h: 0.2, // 600/1000, 420/750, 180/1000, 90/750
        text: 'Papirerne...',
        media: {
          audio: './assets/doorOhh.mp3',
          overlay: './assets/papers.png'
        },
        duration: 2500,
        action: '#page2',
        timeoutAction: '#page2',
        meta: {
          maxActivations: 1,
          activationCount: 0
        }
      },
    ]
  },

  // --------------------------------------
  // Side 3 – Gang/trapper (Point of no return)
  // --------------------------------------
  {
    id: '#page3',
    title: 'Gangen',
    background: './assets/gangen.png',
    backgroundSound: './assets/hall_background.flac',
    heading: 'Gangen',
    buttons: [
      { text: 'Tilbage til kontoret', action: '#page2', style: 'secondary' }
    ],
    jumpscare: {
      audio: './assets/jumpscare.wav',
      image: './assets/jumpscare.jpg',
      wait:10000,
      duration:5000,
      nextPage:'#death'
    },
    hotspots: [
      {
        type: 'hotspot',
        x: 0.6, y: 0.3, w: .1, h: 0.4, // 300/1000, 500/750, 140/1000, 70/750
        text: 'Gå ned ad trappen?',
        media: { video: './assets/stairs.mov' },
        duration: 5000,
        action: '#page4',
        timeoutAction: '#death',
        meta: { tooltip: 'Tryk for at se i skuffen' }
      },

    ]
  },

  // ------------------------------
  // Side 4 – Kælderen (Klimaks)
  // ------------------------------
  {
    id: '#page4',
    title: 'Kælderen',
    heading: 'Pigen',
    film: {
      video: './assets/girl.mp4',
      videoDuration: 4000,
      duration: 3000,
      text: 'Gå op til pigen eller tilbage på kontoret?',
      action: '#page2',
      timeoutAction: '#death'
    },
    hotspots: [
      {
        type: 'hotspot',
        x: 0.38, y: 0.25, r: 0.08, // 800/1000, 200/1000, 60/750
        text: 'Gå direkte ned i kælderen?',
        media: {
          audio: './assets/doorOhh.mp3',
          overlay: {
            image: './assets/choice-overlay.png',
            x: 0.2, y: 0.2, w: 0.6, h: 0.6
          }
        },
        duration: 5000,
        action: '#page4',
        meta: {
          maxActivations: 3,
          activationCount: 0
        }
      },
      {
        type: 'hotspot',
        x: 0, y: 0, w: 0.22, h: 0.22, // 420/1000, 520/750, 220/1000, 100/750
        text: 'Lyden flytter sig – hold vejret',
        media: {
          audio: './assets/doorOhh.mp3',
          overlay: './assets/papers.png'
        },
        duration: 5000,
        action: '#escape',
        timeoutAction: '#death'
      }
    ]
  },

  // ------------------------------
  // Side 5 – Dødssiden (Jumpscare)
  // ------------------------------
  {
    id: '#death',
    title: 'Mørket falder på',
    background: './assets/basement.png',
    heading: 'Død...',
    backgroundSound:'./assets/jumpscare.wav',
    buttons: [
      { text: 'Prøv igen', action: '#page1', style: 'primary' }
    ],
    hotspots: [
      {
        type: 'hotspot',
        x: 0.64, y: 0.62, w: 0.24, h: 0.11, // 640/1000, 620/750, 240/1000, 110/750
        text: 'Prøv igen fra begyndelsen',
        duration: 1500,
        action: '#page1'
      }
    ]
  },

  // ---------------------------------
  // Side 6 – Overlevelse (Udtoning)
  // ---------------------------------
  {
    id: '#escape',
    title: 'Du slap væk',
    background: './assets/away.png',
    heading: 'Du slap ud – for nu',
    buttons: [
      { text: 'Spil igen', action: '#page1', style: 'primary' }
    ],
    hotspots: [
      {
        type: 'hotspot',
        x: 0.64, y: 0.62, w: 0.26, h: 0.11, // 640/1000, 620/750, 260/1000, 110/750
        text: 'Spil igen med andre valg',
        duration: 1500,
        action: '#page1'
      }
    ]
  },

  // ---------------------------------
  // Deroute-side – fuldskærmsfilm m. afslutningsvalg
  // ---------------------------------
  {
    id: '#deroute',
    title: 'Overvågning',
    film: {
      video: './assets/stairs.mov',
      videoDuration: 7000,
      duration: 3000,
      text: 'Du synes du mærker noget bag dig. Vend dig om og se?',
      action: '#page3',
      timeoutAction: '#page2'
    },
    hotspots: []
  }
]

/*
  Strukturprincipper i brug:
  - Enkelt input: CLICK (knap) vs TIMEOUT (ingen tryk). Det håndteres med action/timeoutAction.
  - Foldback: Side 2’s hotspots fører til #page3 eller #deroute, men hovedforløbet samles igen i #page3 → #page4.
  - Klimaks i kælderen (#page4): CLICK ⇒ #escape, TIMEOUT ⇒ #death.
  - Deroute-side (#deroute): fuldskærmsfilm; efter duration vises tekstbjælke med CLICK/TIMEOUT der sender tilbage til #page2 eller frem til #page3.
  - Hotspots er rene data: text, media, duration, action, timeoutAction og enkel meta; film-sider bruger samme CLICK/TIMEOUT-princip.
*/

