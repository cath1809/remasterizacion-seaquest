// Configuración del juego
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        // update: update
    }
};

// Variables globales
let game = new Phaser.Game(config);
let player;
let enemies;
let divers;
let bubbles;
let oxygen = 100;
let score = 0;
let rescuedDivers = 0;
let lives = 3;
let cursors;
let fireButton;
let lastFired = 0;
let oxygenTimer;
let background;
let isOutOfBounds = false;
let currentScene;

// Límites para enemigos y buzos (zona del mar)
const MAR_TOP = 150;
const MAR_BOTTOM = 450;
const MAR_LEFT = 50;
const MAR_RIGHT = 750;

// Límites para el jugador (un poco más amplios)
const PLAYER_TOP = MAR_TOP - 20;
const PLAYER_BOTTOM = MAR_BOTTOM + 100;
const PLAYER_LEFT = MAR_LEFT;
const PLAYER_RIGHT = MAR_RIGHT;

function preload() {
    this.load.svg('ocean', 'ocean.svg');
    this.load.svg('submarine', 'submarinoJugador.svg');
    this.load.svg('enemy', 'pezMalvado.svg');
    this.load.svg('diver', 'buzo.svg');
    this.load.svg('bubble', 'bubble.svg');
    this.load.svg('torpedo', 'torpedo.svg');
}

function create() {
    currentScene = this;
    
    // Fondo
    background = this.add.image(0, 0, 'ocean').setOrigin(0, 0);
    background.displayWidth = 800;
    background.displayHeight = 600;

    // Partículas de burbujas
    this.bubbles = this.add.particles(0, 0, 'bubble', {
        frame: 0,
        scale: { 
            start: 0.2, 
            end: 0.5,
            random: true
        },
        speedY: { 
            min: -30,
            max: -60 
        },
        speedX: { 
            min: -5,
            max: 5 
        },
        lifespan: 3000,
        frequency: 300,
        quantity: 1,
        blendMode: 'ADD',
        alpha: { start: 0.7, end: 0 },
        emitZone: {
            type: 'random',
            source: new Phaser.Geom.Rectangle(
                MAR_LEFT,
                MAR_TOP + 50,
                MAR_RIGHT - MAR_LEFT,
                MAR_BOTTOM - MAR_TOP - 50
            )
        }
    });
    this.bubbles.setDepth(1);

    // Jugador
    player = this.physics.add.sprite(400, MAR_BOTTOM - 50, 'submarine');
    player.setCollideWorldBounds(false);
    player.setScale(0.8);
    
    // Enemigos
    enemies = this.physics.add.group();
    
    // Burbujas (disparos)
    bubbles = this.physics.add.group();
    
    // Buzos
    divers = this.physics.add.group();
    
    // Controles
    cursors = this.input.keyboard.createCursorKeys();
    fireButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Temporizadores
    oxygenTimer = this.time.addEvent({
        delay: 1000,
        callback: decreaseOxygen,
        callbackScope: this,
        loop: true
    });
    
    // Generar enemigos
    this.time.addEvent({
        delay: 2000,
        callback: spawnEnemy,
        callbackScope: this,
        loop: true
    });
    
    // Generar buzos
    this.time.addEvent({
        delay: 5000,
        callback: spawnDiver,
        callbackScope: this,
        loop: true
    });
    
    // Colisiones
    this.physics.add.overlap(bubbles, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, divers, rescueDiver, null, this);
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);
    
    // Inicializar HUD
    updateHUD();
}
