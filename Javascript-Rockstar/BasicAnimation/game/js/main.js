// Basic Animation Demo Using Canvas
// Copyright (c) 2016 by Jeffrey Sprague
// This source code is intended for educational purposes.
// Author grants permission to use this code as a foundation for creating other derivative works.

window.addEventListener("load", initApp, false);

var KEY = {LEFT: 37, RIGHT: 39, SPACE: 32, ENTER: 13 };
var keyState = [];
var PLAYFIELD_WIDTH = 480;
var PLAYFIELD_HEIGHT = 640;

var ctx;    // Main canvas context
var shipImg, laserImg, alienImg;
var firing = false;
var shipX = 100, shipY = 580;
var missileX, missileY;
var alienX, alienY = -25;
var score = 0;

/*************************************************/
function initApp () {
    console.log("Initializing...");

    var canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    ctx.font = "20px sans_serif";

    document.addEventListener("keydown", function (ev) {
        keyState[ev.keyCode] = true;
    });

    document.addEventListener("keyup", function (ev) {
        keyState[ev.keyCode] = false;
    });

    shipX = 100 + Math.floor(Math.random() * 250);
    alienX = 100 + Math.floor(Math.random() * 250);

    loadImages(gameLoop);
}

/*************************************************/
function loadImages(callback) {
    var numLoaded = 0;
    var numToLoad = 3;

    var loadImage = function(src){
        var image = new Image();
        image.onload = function() {
            if (++numLoaded == numToLoad) {
                callback();
            }
        };
        image.src = src;
        return image;
    };

    shipImg = loadImage('resources/ship.png');
    laserImg = loadImage('resources/laser.png');
    alienImg = loadImage('resources/alien.png');
}

/*************************************************/
function gameLoop() {
/*************************************************/

    // CLEAR CANVAS
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT);

    // UPDATE POSITIONS
    if (keyState[KEY.LEFT]) {
        if (shipX >= 8) {
            shipX -= 4;
        }
    }

    if (keyState[KEY.RIGHT]) {
        if (shipX <= PLAYFIELD_WIDTH - 46) {
            shipX += 4;
        }
    }

    if (keyState[KEY.SPACE]) {
        if (!firing) {
            firing = true;
            missileX = shipX + 17;
            missileY = shipY;
        }
    }

    if (firing) {
        missileY -= 16;
        if (missileY < 0) {
            firing = false;
        }
        ctx.drawImage(laserImg, missileX, missileY);
    }

    alienY += 4;
    ctx.drawImage(alienImg, alienX, alienY);
    ctx.drawImage(shipImg, shipX, shipY);

    // CHECK COLLISIONS
    if (missileX >= alienX && missileX < alienX + 24 && missileY > alienY && missileY < alienY + 24) {
        score += 1;
        firing = false;
        alienY = -24;
        alienX = 20 + Math.floor(Math.random() * (PLAYFIELD_WIDTH - 64));
    }

    ctx.fillStyle = "#008000";
    ctx.fillText('SCORE: ' + score, 10, 25);

    // SCHEDULE NEXT FRAME UNLESS ALIEN HAS REACHED THE BOTTOM
    if (alienY < PLAYFIELD_HEIGHT - 25) {
        window.requestAnimationFrame(gameLoop);
    } else {
        ctx.fillText('GAME OVER', 180, 225);
    }
}

