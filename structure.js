pages = [
  // ------------------------
  // Side 1 – Anslag (Forsiden)
  // ------------------------
  {
    id: '#page1',
    title: 'Huset i passet',
    background: './assets/front.png',
    heading: 'Velkommen til passet',
    backgroundSound: './assets/storm.mp3',
    hotspots: [
      // Månen – foreshadowing + genvej til klimaks-aksen
      {
        type: 'hotspot',
        x: 0.38, y: 0.25, r: 0.08, // 800/1000, 200/1000, 60/750
        //text: 'Eventuel tekst der beskriver valget...',
        //'Eventuel timer der deaktiverer valget...'        
        duration: 9000,
        //eventuelt defaultvalg:
        timeoutAction: '#death',
        media: {
          audio: './assets/doorOhh.mp3',
          overlay: './assets/bloodmoon.png'
        },
        actions:[
          {
            action:'#page2',
            image:"./assets/first-choice.png",
            x: 0.2, 
            y: 0.3,
            h: 0.4
          },
          {
            action:'#page4',
            image:"./assets/second-choice.png",
            x: 0.7, 
            y: 0.3,
            h:0.4
          }
        ],
        meta: {
          maxActivations: 300,
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
    duration:10000,
    actions:[
      {
        action:'#page4',
        image:"./assets/first-choice.png",
        x: 0.2, 
        y: 0.3,
        h: 0.4
      },
      {
        action:'#page3',
        image:"./assets/second-choice.png",
        x: 0.7, 
        y: 0.3,
        h:0.4
      }
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
        action: '#page3',
        timeoutAction: '#page4',
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
      },
    actions:[
      {
        action:'#page4',
        image:"./assets/first-choice.png",
        x: 0.2, 
        y: 0.3,
        h: 0.4
      },
      {
        action:'#page3',
        image:"./assets/second-choice.png",
        x: 0.7, 
        y: 0.3,
        h:0.4
      }
    ],
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

