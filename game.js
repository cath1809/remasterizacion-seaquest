
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
        update: update
    }
};


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
let playerDirection = 'right'; 


const MAR_TOP = 150;
const MAR_BOTTOM = 450;
const MAR_LEFT = 50;
const MAR_RIGHT = 750;
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
    
    background = this.add.image(0, 0, 'ocean').setOrigin(0, 0);
    background.displayWidth = 800;
    background.displayHeight = 600;

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

    player = this.physics.add.sprite(400, MAR_BOTTOM - 50, 'submarine');
    player.setCollideWorldBounds(false);
    player.setScale(0.8);
    player.flipX = false;
    player.setSize(80, 30); 
    player.setOffset(10, 15);

    enemies = this.physics.add.group();
    bubbles = this.physics.add.group();
    divers = this.physics.add.group();
    

    cursors = this.input.keyboard.createCursorKeys();
    fireButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    oxygenTimer = this.time.addEvent({
        delay: 1000,
        callback: decreaseOxygen,
        callbackScope: this,
        loop: true
    });

    this.time.addEvent({
        delay: 2000,
        callback: spawnEnemy,
        callbackScope: this,
        loop: true
    });
    
    this.time.addEvent({
        delay: 5000,
        callback: spawnDiver,
        callbackScope: this,
        loop: true
    });
    

    this.physics.add.overlap(bubbles, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, divers, rescueDiver, null, this);
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);
    

    updateHUD();
}

function update(time) {
    handlePlayerMovement();

    if (fireButton.isDown && time > lastFired) {
        fireBubble();
        lastFired = time + 500;
    }

    if (oxygen <= 0) {
        loseLife();
        oxygen = 100;
    }
}

function handlePlayerMovement() {
    player.setVelocity(0);
    
    if (cursors.left.isDown) {
        player.setVelocityX(-200);
        player.flipX = true;
        playerDirection = 'left';
    } else if (cursors.right.isDown) {
        player.setVelocityX(200);
        player.flipX = false;
        playerDirection = 'right';
    }
    
    if (cursors.up.isDown) {
        player.setVelocityY(-200);
    } else if (cursors.down.isDown) {
        player.setVelocityY(200);
    }
    
    player.x = Phaser.Math.Clamp(player.x, PLAYER_LEFT, PLAYER_RIGHT);
    player.y = Phaser.Math.Clamp(player.y, PLAYER_TOP, PLAYER_BOTTOM);
    
    const isNowOutOfBounds = player.y < MAR_TOP || player.x < MAR_LEFT || player.x > MAR_RIGHT;
    if (isNowOutOfBounds && !isOutOfBounds) {
        loseLife();
    }
    isOutOfBounds = isNowOutOfBounds;
}

function fireBubble() {
    const bubble = bubbles.create(
        playerDirection === 'left' ? player.x - 40 : player.x + 40, 
        player.y, 
        'torpedo'
    );
 
    if (playerDirection === 'left') {
        bubble.setVelocityX(300);
        bubble.flipX = true;
    } else {
        bubble.setVelocityX(-300);
        bubble.flipX = false;
    }
    
    bubble.setScale(0.5);
    bubble.setSize(60, 10);
    bubble.setOffset(10, 5);
}

function spawnEnemy() {
    const y = Phaser.Math.Between(MAR_TOP + 70, MAR_BOTTOM - 70);
    const enemy = enemies.create(MAR_RIGHT, y, 'enemy');
    enemy.setVelocityX(Phaser.Math.Between(-150, -50));
    enemy.setScale(0.7);
    enemy.flipX = true;
    enemy.setSize(60, 30);
    enemy.setOffset(10, 10);
    enemy.setCollideWorldBounds(false);
    enemy.checkWorldBounds = true;
    enemy.outOfBoundsKill = true;
}

function spawnDiver() {
    if (divers.getLength() < 3) {
        const y = Phaser.Math.Between(MAR_TOP + 70, MAR_BOTTOM - 70);
        const diver = divers.create(MAR_RIGHT, y, 'diver');
        diver.setVelocityX(Phaser.Math.Between(-80, -30));
        diver.setScale(0.6);
        diver.setSize(40, 40);
        diver.setOffset(10, 5);
        diver.setCollideWorldBounds(false);
        diver.checkWorldBounds = true;
        diver.outOfBoundsKill = true;
    }
}

function hitEnemy(bubble, enemy) {
    bubble.destroy();
    enemy.destroy();
    score += 100;
    updateHUD();
}

function rescueDiver(player, diver) {
    diver.destroy();
    rescuedDivers++;
    score += 200;
    oxygen = Math.min(100, oxygen + 10);
    
    if (rescuedDivers >= 6) {
        score += 1000;
        rescuedDivers = 0;
    }
    updateHUD();
}

function hitPlayer(player, enemy) {
    enemy.destroy();
    loseLife();
}

function loseLife() {
    lives--;
    updateHUD();
    
    if (lives <= 0) {
        showGameOver();
    } else {
        resetPlayer();
    }
}

function resetPlayer() {
    player.x = 400;
    player.y = MAR_BOTTOM - 50;
    player.flipX = false;
    playerDirection = 'right';
    oxygen = 100;
}

function showGameOver() {
    currentScene.scene.pause();
    
    const gameOverDiv = document.createElement('div');
    gameOverDiv.id = 'game-over';
    gameOverDiv.style.position = 'absolute';
    gameOverDiv.style.top = '50%';
    gameOverDiv.style.left = '50%';
    gameOverDiv.style.transform = 'translate(-50%, -50%)';
    gameOverDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverDiv.style.padding = '20px';
    gameOverDiv.style.borderRadius = '10px';
    gameOverDiv.style.textAlign = 'center';
    gameOverDiv.style.color = 'white';
    gameOverDiv.style.zIndex = '1000';
    
    const gameOverText = document.createElement('h1');
    gameOverText.textContent = 'GAME OVER';
    gameOverText.style.marginTop = '0';
    gameOverDiv.appendChild(gameOverText);
    
    const finalScore = document.createElement('p');
    finalScore.textContent = `Puntaje final: ${score}`;
    gameOverDiv.appendChild(finalScore);
    
    const restartButton = document.createElement('button');
    restartButton.textContent = 'Reiniciar Juego';
    restartButton.style.padding = '10px 20px';
    restartButton.style.margin = '10px';
    restartButton.style.fontSize = '16px';
    restartButton.style.cursor = 'pointer';
    restartButton.style.backgroundColor = '#4CAF50';
    restartButton.style.color = 'white';
    restartButton.style.border = 'none';
    restartButton.style.borderRadius = '5px';
    
    restartButton.addEventListener('click', () => {
        document.body.removeChild(gameOverDiv);
        currentScene.scene.restart();
        lives = 3;
        score = 0;
        rescuedDivers = 0;
        oxygen = 100;
    });
    
    gameOverDiv.appendChild(restartButton);
    document.body.appendChild(gameOverDiv);
}

function decreaseOxygen() {
    oxygen -= 1;
    updateHUD();
    
    if (oxygen < 20) {
        document.getElementById('oxygen').style.color = 'red';
    } else {
        document.getElementById('oxygen').style.color = 'white';
    }
}

function updateHUD() {
    document.getElementById('oxygen').textContent = oxygen;
    document.getElementById('score').textContent = score;
    document.getElementById('divers').textContent = rescuedDivers;
    document.getElementById('lives').textContent = lives;
}