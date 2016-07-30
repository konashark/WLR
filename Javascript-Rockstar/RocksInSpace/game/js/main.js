// Rocks In Space
// Copyright (c) 2016 by Jeffrey Sprague
// See the accompanying book for thorough, step-by-step explanation of how this application works.
// This source code is intended for educational purposes for use by owners of the accompanying book. Derivative works
// that are significantly modified may be used for any reasonable purpose. Duplicate or lightly modified versions of
// this code may not be distributed or sold without permission from the author.

console.log("Rocks in Space is starting!");
console.log("Source code licensed for use by owners of the book 'Javascript Rockstar Vol 1'");
console.log("www.wildlizardranch.com/jsrockstar/vol1");
console.log("Copyright (c) 2016 Jeffrey Sprague");

window.addEventListener("load", initApp, false);

// ASCII key codes for the keys used in this game
var KEY = {LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40, SPACE: 32, ENTER: 13, H: 72, P: 80, Q: 81, Z: 90 };
var keyState = [];

// Configuration options that don't change during application lifecycle
var NUM_TORPEDOS = 8;
var CANVAS_W = 960;
var CANVAS_H = 640;
var FIRING_SPEED = 6;   // How often we can fire (in frames)
var MAX_SPEED = 6;      // Maximum speed of our ship (in pixels per frame)

// Rock sizes
var LARGE = 0;
var MEDIUM = 1;
var SMALL = 2;
var ROCK_SCALE = 1.25;

// Game State
var START_GAME = 0;
var IN_PLAY = 1;
var PAUSED = 2;
var END_GAME = 3;
var QUIT = 4;
var PENDING_NEXT_ROUND = 5;
var gameState = START_GAME;

var numRocks;
var score = 0;

var ctx;                // Main canvas context
var risTitleImg, risNebulaImg, shipImg, shipThrustImg, shieldImg, torpedoImg, explosionImg,
    rockLg1Img, rockLg2Img, rockMedImg, rockSmImg;
var spriteList;         // our master list of all JGL sprites
var ship = {};          // where we'll store deta related to our ship
var explosionSprite;    // used when ship explodes
var explosionSound;     // used when ship explodes
var rocks = [];         // where we'll keep track of our rock objects
var rockSpeedBase;      // minimum speed that the rocks will move
var torpedoes = [];     // where we track our torpedoes
var firingThrottle = 1; // controls when we can shoot
var framesTilEndOfGame = 0; // used to create a small delay between logical end of game, and end-of-game display
var shieldsRaised;

/*************************************************/
function initApp () {
    console.log("Initializing...");

    // Initialize the JGL sprite utility
    jgl = new Jgl;
    spriteList = jgl.newSpriteList();

    // Get our graphics context from the DOM
    var canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    document.addEventListener("keydown", function (ev) {
        keyState[ev.keyCode] = true;    // Track which keys are are down
        processKeyDown(ev.keyCode);
    });

    document.addEventListener("keyup", function (ev) {
        keyState[ev.keyCode] = false;   // Track which keys are are up
    });

    // Once external files are loaded, we can start the main game loop
    loadResources(function() {
        resetGame();
        gameLoop(); // Kick off the main animation loop once the images are loaded
    });
}

/*************************************************/
function processKeyDown(keyCode) {
    switch (keyCode)
    {
        case KEY.ENTER:
            if (gameState === START_GAME) {
                gameState = IN_PLAY;
                ship.sprite.show();
            }
            if (gameState === END_GAME) {
                resetGame();
            }
            break;

        case KEY.Q:
            gameState = QUIT;
            break;

        case KEY.P:
            if (gameState == IN_PLAY) {
                gameState = PAUSED;
            } else {
                if (gameState == PAUSED) {
                    gameState = IN_PLAY;
                    gameLoop(); // kickstart the animation loop again
                }
            }
            break;

        case KEY.H:
            doHyperjump();
            break;

        default:
            //console.log("Pressed key: " + keyCode);
    }
}

/*************************************************/
function resetGame() {
    // Global variables we have to reset to start a new game
    numRocks = 3;
    rockSpeedBase = 0.5;
    framesTilEndOfGame = 0;
    score = 0;
    gameState = START_GAME;

    ship.x = CANVAS_W / 2;
    ship.y = CANVAS_H / 2;
    ship.speedX = ship.speedY = 0;
    ship.rotation = 0;
    ship.shields = 100;

    deleteAllRocks();
    makeNewRocks();
}

/*************************************************/
function makeNewRocks() {
    for (var i = 0; i < numRocks; i++) {
        createRock(LARGE);
    }
}

/*************************************************/
function lostShip() {
    explosionSprite.setAnimActions(true, false, true);
    explosionSprite.setCurrentFrame(0);
    explosionSprite.x = ship.sprite.x;
    explosionSprite.y = ship.sprite.y;
    explosionSprite.show();
    explosionSound.play();
    ship.sprite.hide();

    framesTilEndOfGame = 60;    // this will trigger a 60-frame delay (1 second) before putting up the END GAME oerlay
}

/*************************************************/
function doHyperjump() {
    // Jump to a random location - safety not guaranteed!
    ship.x = 100 + Math.floor(Math.random() * (CANVAS_W - 200));
    ship.y = 100 + Math.floor(Math.random() * (CANVAS_H - 200));
    ship.rotation = Math.floor(Math.random() * 360);
    ship.speedX = Math.random() - 0.5;
    ship.speedY = Math.random() - 0.5;
}

/*************************************************/
function createRock(size, x, y) {
    var rock = {};
    var angle;

    if (size === LARGE) {
        sprite = spriteList.newSprite({
            image: (Math.random() >= 0.5 ? rockLg1Img : rockLg2Img),
            width: 64, height: 64, center: true, scale: ROCK_SCALE
        });
    } else if (size === MEDIUM) {
        sprite = spriteList.newSprite(
            { image: rockMedImg, width: 32, height: 32, center: true, scale: ROCK_SCALE });
    } else if (size === SMALL) {
        sprite = spriteList.newSprite(
            { image: rockSmImg, width: 16, height: 16, center: true, scale: ROCK_SCALE });
    }

    rock.sprite = sprite;
    rock.size = size;

    if (x || y) {
        rock.x = x;
        rock.y = y;
    } else {
        // If no coordinates specified, place the rock at least 100 pixels away from the ship
        angle = (Math.floor(Math.random() * 360)) * Math.PI / 180;
        rock.x = ship.x + Math.sin(angle) * (100 + Math.floor(Math.random() * 220));
        rock.y = ship.y - Math.cos(angle) * (100 + Math.floor(Math.random() * 220));
    }

    angle = (Math.floor(Math.random()*360)) * Math.PI / 180;
    rock.xMove = Math.sin(angle);
    rock.yMove = -Math.cos(angle);
    rock.speed = rockSpeedBase + Math.random();
    rock.rot = Math.floor(Math.random() * 360);
    rock.rotSpeed = -1 + Math.random() * 2;
    rocks.push(rock);

    rock.sprite.show();
}

/*************************************************/
function destroyRock(rock) {
    spriteList.deleteSprite(rock.sprite);
    var index = rocks.indexOf(rock);
    if (index >= 0) {
        rocks.splice(index, 1);
    }

    // Are there any more rocks left? If not, start a new round.
    if (rocks.length === 0) {
        numRocks++; // Every round, we add one more
        makeNewRocks();
    }
}

/*************************************************/
function deleteAllRocks() {
    for (var i = 0; i < rocks.length;i++) {
        spriteList.deleteSprite(rocks[i].sprite);
    }
    rocks = [];
}
/*************************************************/
function shipInClear() {
    // Determine if there are any rocks near the ship. This is called from the animation loop when preparing to start
    // the next round. We don't want to start a new round with an exploding ship. Uncool.
    var i;
    var tooClose = false;
    for (i = 0; i < rocks.length; i++) {
        var xd = rocks[i].x - ship.x;
        var yd = rocks[i].y - ship.y;
        if (Math.sqrt(xd * xd + yd * yd) < 150) {
            tooClose = true;
            break;
        }
    }

    return !tooClose;
}

/*************************************************/
function loadResources(callback) {
    var numToLoad = 10;
    var frame, i;

    var isLoadComplete = function() {
        if (--numToLoad == 0) {
            callback();
        }
    };

    // Load the ship image
    shipImg = jgl.newImage('resources/ris_ship.png', function() {
        ship.sprite = spriteList.newSprite({
            image: shipImg,
            x: 200, y: CANVAS_H - 60, width: 28, height: 40, scale: 0.75, center: true,
            active: false
        });
        isLoadComplete();
    });

    // Load the shield image
    shieldImg = jgl.newImage('resources/shield.png', function() {
        ship.shieldSprite = spriteList.newSprite({
            image: shieldImg,
            x: 0, y: 0, width: 72, height: 72, center: true,
            active: false
        });
        isLoadComplete();
    });

    // Load all the images we will make screens or sprites out of
    risTitleImg  = jgl.newImage('resources/ris_title.jpg',  isLoadComplete);
    risNebulaImg = jgl.newImage('resources/nebula.png',     isLoadComplete);
    rockLg1Img   = jgl.newImage('resources/rock1Large.png', isLoadComplete);
    rockLg2Img   = jgl.newImage('resources/rock2Large.png', isLoadComplete);
    rockMedImg   = jgl.newImage('resources/rockMed.png',    isLoadComplete);
    rockSmImg    = jgl.newImage('resources/rockSmall.png',  isLoadComplete);
    shipThrustImg= jgl.newImage('resources/ris_ship_thrust.png',  isLoadComplete);

    torpedoImg = jgl.newImage('resources/torpedo.png', function() {
        // once loaded, create our reusable torpedo objects and sprites
        for (i = 0; i < NUM_TORPEDOS; i++) {
            torpedoes[i] = {};
            torpedoes[i].sprite = spriteList.newSprite({
                image: torpedoImg,
                width: 7, height: 7,
                active: false
            });
            torpedoes[i].torpedoSound = new Audio('resources/torpedo.mp3');
            torpedoes[i].explosionSound = new Audio('resources/crash.mp3');
        }

        // Load the explosion image then create an animated sprite
        explosionImg = jgl.newImage("resources/explosion.png", function() {
            for (i = 0; i < NUM_TORPEDOS; i++) {
                sprite = spriteList.newSprite({
                    width: 88, height: 90, center: true,    // each frame
                    image: explosionImg,    // image from which the frames come
                    animate: true,          // cycle through frames with every loop
                    autoLoop: false,        // stop animating after cycling through every frame
                    autoDeactivate: true,   // hide the sprite once the animation is done
                    currentFrame: 0,        // tracks which frame is currently showing
                    startFrame: 0,
                    endFrame: 39,
                    active: false
                });

                // Define animation frames
                for (frame = 0; frame < 40; frame++) {
                    sprite.setAnimFrame(frame, explosionImg, frame * 88, 0, 88, 90);
                }
                torpedoes[i].explosionSprite = sprite;
            }

            // Now create a stand-alone explosion sprite for when the ship blows up (let's face it, eventually it will)
            explosionSprite = spriteList.newSprite({
                width: 88, height: 90, scale: 3, center: true,
                image: explosionImg,
                animate: true,
                autoLoop: false,
                autoDeactivate: true,
                currentFrame: 0,
                startFrame: 0,
                endFrame: 39,
                active: false
            });

            // Define animation frames
            for (frame = 0; frame < 40; frame++) {
                explosionSprite.setAnimFrame(frame, explosionImg, frame * 88, 0, 88, 90);
            }
            explosionSound = new Audio('resources/crash.mp3');

            isLoadComplete();
        });
    });
}

/*************************************************/
function fireTorpedo() {
    if (ship.sprite.active) {
        if (--firingThrottle < 1) {
            for (var i = 0; i < NUM_TORPEDOS; i++) {
                var torpedo = torpedoes[i];
                if (torpedo.sprite.active == false) {
                    torpedo.torpedoSound.play();
                    torpedo.yMove = -Math.cos(ship.rotation * Math.PI/180) * 8; // torpedo speed
                    torpedo.xMove = Math.sin(ship.rotation * Math.PI/180) * 8;
                    torpedo.x = ship.sprite.x - 3 + (torpedo.xMove * 2.5);
                    torpedo.y = ship.sprite.y - 3 + (torpedo.yMove * 2.5)
                    torpedo.distance = 0;
                    torpedo.sprite.setPosition(torpedo.x, torpedo.y);
                    torpedo.sprite.show();
                    // add a little recoil just be evil
                    ship.speedX -= (Math.sin(ship.radians) / 25);
                    ship.speedY += (Math.cos(ship.radians) / 25);
                    break;
                }
            }
            firingThrottle = FIRING_SPEED;
        }
    }
}

/*************************************************/
function explodeRock(torpedo, rock) {
    torpedo.explosionSound.play();
    var sprite = torpedo.explosionSprite;
    sprite.setRotation(Math.floor(Math.random() * 360));
    sprite.setAnimActions(true);
    sprite.setPosition(rock.x, rock.y);
    sprite.setCurrentFrame(0);
    sprite.show();
    if (rock.size == LARGE) {
        sprite.setScale(2); // bigger rocks need bigger explosions!
    } else {
        sprite.setScale(1);
    }

    // Unless it's already the smallest rock size, create 3 new smaller rocks to replace the one we just exploded
    if (rock.size !== SMALL) {
        for (var i = 0; i < 3; i++) {
            createRock(rock.size + 1,
                rock.x + Math.floor(Math.random() * 20) - 10,
                rock.y + Math.floor(Math.random() * 20) - 10);
        }
    }

    score += (rock.size + 1) * 10;
    destroyRock(rock);
}

/*************************************************/
function didCollideWithRock(sprite) {
    for (var i = 0; i < rocks.length; i++) {
        if (spriteList.collision(rocks[i].sprite, sprite, 0, true)) {
            return rocks[i];
        }
    }
    return false;
}

/*************************************************/
function gameLoop() {
/*************************************************/

    if (gameState == QUIT || gameState == PAUSED) { return; }

    // Recompose screen elements, from bottom-most layer to top-most
    ship.shieldSprite.hide();
    shieldsRaised = false;

    updateBackground();
    updateTorpedos();
    updateRocks();
    updateShip();

    spriteList.drawSprites(ctx);
    updateStatus();

    // Delay exiting the game for a little while after you explode
    if (framesTilEndOfGame) {
        if (--framesTilEndOfGame == 0) {
            gameState = END_GAME;
            ship.sprite.hide();
        }
    }

    // Things we draw based on current game state
    switch (gameState) {
        case START_GAME:
            startGameOverlay();
            break;
        case END_GAME:
            endGameOverlay();
            break;
        case PENDING_NEXT_ROUND:
            if (shipInClear()) {
                ship.sprite.show();
                gameState = IN_PLAY;
            }
            break;
    }

    // Go idle until the next frame begins - then wake us up by calling this animation loop again. 60 times per second!
    window.requestAnimationFrame(gameLoop);
}

/*************************************************/
function updateBackground() {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (gameState == START_GAME) {
        ctx.drawImage(risTitleImg, 0, 0, 960, 720, 0, 0, CANVAS_W, CANVAS_H );
    } else if (gameState == IN_PLAY || gameState == END_GAME) {
        ctx.drawImage(risNebulaImg, 0, 0, 960, 640, 0, 0, CANVAS_W, CANVAS_H );
    }
}

/*************************************************/
function updateShip() {
    if (gameState === IN_PLAY) {
        // Is the player rotating?
        if (keyState[KEY.LEFT]){
            ship.rotation -= 3;
        }
        if (keyState[KEY.RIGHT]){
            ship.rotation += 3;
        }
        if (ship.rotation > 360) {
            ship.rotation = ship.rotation % 360;
        }
        if (ship.rotation < 0) {
            ship.rotation = ship.rotation + 360;
        }

        ship.radians = ship.rotation * Math.PI/180;

        // Is the player accelerating?
        if (keyState[KEY.UP]) {
            ship.speedX += (Math.sin(ship.radians) / 10);
            ship.speedY -= (Math.cos(ship.radians) / 10);

            if (ship.speedX > MAX_SPEED) {
                ship.speedX = MAX_SPEED;
            }
            if (ship.speedY > MAX_SPEED) {
                ship.speedY = MAX_SPEED;
            }
            if (ship.speedX < (-MAX_SPEED)) {
                ship.speedX = (-MAX_SPEED);
            }
            if (ship.speedY < (-MAX_SPEED)) {
                ship.speedY = (-MAX_SPEED);
            }
            ship.sprite.setImage(shipThrustImg, 0, 0, 28, 40);
        } else {
            ship.sprite.setImage(shipImg, 0, 0, 28, 40);
        }

        // Update our ship's position but keep it within screen bounds
        ship.x += ship.speedX;
        ship.y += ship.speedY;

        if (ship.y > CANVAS_H) {
            ship.y -= CANVAS_H;
        } else if (ship.y < 0) {
            ship.y += CANVAS_H;
        }
        if (ship.x > CANVAS_W) {
            ship.x -= CANVAS_W;
        } else if (ship.x < 0) {
            ship.x += CANVAS_W;
        }

        ship.sprite.setPosition(ship.x, ship.y, ship.rotation);

        if (keyState[KEY.Z] && gameState === IN_PLAY) {
            raiseShields();
        }

        if (!shieldsRaised && didCollideWithRock(ship.sprite)) {
            lostShip();
        }
    }
}

/*************************************************/
function updateTorpedos() {
    var torpedoIndex;
    for (torpedoIndex = 0; torpedoIndex < NUM_TORPEDOS; torpedoIndex++) {
        var torpedo = torpedoes[torpedoIndex];

        if (torpedo.sprite.active) {
            torpedo.y += torpedo.yMove;
            torpedo.x += torpedo.xMove;

            if (torpedo.y > CANVAS_H) {
                torpedo.y -= CANVAS_H;
            } else if (torpedo.y < 0) {
                torpedo.y += CANVAS_H;
            }

            if (torpedo.x > CANVAS_W) {
                torpedo.x -= CANVAS_W;
            } else if (torpedo.x < 0) {
                torpedo.x += CANVAS_W;
            }

            torpedo.sprite.setPosition(torpedo.x, torpedo.y);

            if (torpedo.distance++ > 70) {
                torpedo.sprite.hide();
            } else {
                var rockHit = didCollideWithRock(torpedo.sprite);
                if (rockHit) {
                    torpedo.sprite.hide();
                    explodeRock(torpedo, rockHit);
                }
            }
        }
    }

    if (keyState[KEY.SPACE] && gameState === IN_PLAY) {
        fireTorpedo();
    }
}

/*************************************************/
function updateRocks() {
    var rockIndex;
    for (rockIndex = 0; rockIndex < rocks.length; rockIndex++) {
        var rock = rocks[rockIndex];

        if (rock.sprite.active) {
            rock.x += rock.xMove * rock.speed;
            rock.y += rock.yMove * rock.speed;
            rock.rot += rock.rotSpeed;

            if (rock.rot > 360) {
                rock.rot -= 360;
            }
            if (rock.rot < 0) {
                rock.rot += 360;
            }
            if (rock.x > CANVAS_W) {
                rock.x -= CANVAS_W;
            }
            if (rock.x < 0) {
                rock.x += CANVAS_W;
            }
            if (rock.y > CANVAS_H) {
                rock.y -= CANVAS_H;
            }
            if (rock.y < 0) {
                rock.y += CANVAS_H;
            }

            rock.sprite.setPosition(rock.x, rock.y, rock.rot);
        }
    }
}

/*************************************************/
function updateStatus() {
    ctx.fillStyle = "#FC0";
    ctx.fillText('ROCKS IN SPACE', 60, 35);
    ctx.fillStyle = "#080";
    ctx.fillText('SCORE: ' + score, 760, 35);
}

/*************************************************/
function raiseShields() {
    ship.shields -= .5;
    if (ship.shields < 0) {
        ship.shields = 0;
        shieldsRaised = false;
    } else {
        shieldsRaised = true;

        ship.shieldSprite.setPosition(ship.x, ship.y);
        ship.shieldSprite.show();

        ctx.fillStyle = "#080";
        ctx.fillText(Math.floor(ship.shields) + '%', ship.shieldSprite.x + 35, ship.shieldSprite.y + 32);
    }
}

/*************************************************/
function startGameOverlay() {
    ctx.fillStyle = "#FC0";
    ctx.fillStyle = "#080";
    ctx.font = "20px ocr";
    ctx.fillText('PRESS ENTER TO START', CANVAS_W / 2 - 145, CANVAS_H - 80);
}

/*************************************************/
function endGameOverlay() {
    ctx.fillStyle = "#FC0";
    ctx.font = "40px ocr";
    ctx.fillText('GAME OVER', CANVAS_W / 2 - 130, CANVAS_H / 3);
    ctx.fillStyle = "#C90";
    ctx.font = "20px ocr";
    ctx.fillText('PRESS ENTER TO RESTART', CANVAS_W / 2 - 150, CANVAS_H / 3 + 40);
}
