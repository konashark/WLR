// Copyright (c) 2015 Jeffrey R. Sprague
// ***************************************************
var imgA = document.getElementById('imgA');
var imgB = document.getElementById('imgB');
var topImage = 0;
var filmstripCells = [];

document.getElementById('banner').src = GALLERY.BANNER;
var imageIndex = parseInt(Math.random() * GALLERY.IMG_LIST.length);
imgA.src = GALLERY.IMG_LIST[imageIndex].uri;
imgB.src = GALLERY.IMG_LIST[imageIndex+1].uri;

var ENTER = 'imageEnterAnim';
var EXIT = 'imageExitAnim';
var DISSOLVE = 'dissolveAnim';

var webkit = /WebKit/.test(navigator.userAgent);

// ***************************************************
var clickedImage = function() {
    imageIndex++;
    imageIndex = imageIndex % GALLERY.IMG_LIST.length;

    displayImageZoom();
    setFilmstripPosition();
};

// ***************************************************
var moveLeft = function() {
    imageIndex--;

    if (imageIndex < 0) {
        imageIndex = GALLERY.IMG_LIST.length -1;
    }

    setFilmstripPosition();
    displayImageDissolve();
};

// ***************************************************
var moveRight = function() {
    imageIndex++;

    if (imageIndex > GALLERY.IMG_LIST.length - 1) {
        imageIndex = 0;
    }
    setFilmstripPosition();
    displayImageDissolve();
};

// ***************************************************
// Set up some listeners for user input
document.getElementById('imgA').onclick = clickedImage;
document.getElementById('imgB').onclick = clickedImage;

document.getElementById('filmstripArrowLeft').onclick = moveLeft;
document.getElementById('filmstripArrowRight').onclick = moveRight;

document.getElementById('filmstripMask').onclick = function(ev) {
    var clickX = (ev.offsetX == undefined) ? ev.layerX : ev.offsetX;

    var cell = parseInt((clickX + 60) / 160) - 3;
    imageIndex += cell;
    if (imageIndex < 0) { imageIndex = 0; }
    if (imageIndex > GALLERY.IMG_LIST.length - 1) { imageIndex = GALLERY.IMG_LIST.length - 1; }
    setFilmstripPosition();
    displayImageDissolve();
};

// ***************************************************
var displayImageZoom = function() {
    topImage = (topImage === 0) ? 1 : 0;
    imgA.classList.remove(ENTER);
    imgA.classList.remove(EXIT);
    imgB.classList.remove(ENTER);
    imgB.classList.remove(EXIT);

    if (topImage) {
        imgB.src = GALLERY.IMG_LIST[imageIndex].uri;

        animate(imgB, ENTER, function () {
            imgA.style.zIndex = '1';
        })
        animate(imgA, EXIT, function () {
            imgA.style.zIndex = '1';
        })
    } else {
        imgA.src = GALLERY.IMG_LIST[imageIndex].uri;

        animate(imgA, ENTER, function () {
            imgA.style.zIndex = '3';
        })
        animate(imgB, EXIT, function () {
            imgA.style.zIndex = '3';
        })
    }
};

// ***************************************************
var displayImageDissolve = function() {
    topImage = (topImage === 0) ? 1 : 0;
    imgA.classList.remove(DISSOLVE);
    imgB.classList.remove(DISSOLVE);

    if (topImage) {
        imgB.src = GALLERY.IMG_LIST[imageIndex].uri;

        animate(imgA, DISSOLVE, function () {
            imgA.style.zIndex = '1';
        })
    } else {
        imgA.src = GALLERY.IMG_LIST[imageIndex].uri;

        animate(imgB, DISSOLVE, function () {
            imgA.style.zIndex = '3';
        })
    }
};

// ***************************************************
document.onkeydown = function(event) {
    console.log("KEY: " + event.keyCode);

    switch (event.keyCode) {
        case 37:    // LEFT
            moveLeft();
            break;

        case 39:    // RIGHT
            moveRight();
            break;

        case 13:    // ENTER
            clickedImage();
            break;
    }
};

// ***************************************************
var setFilmstripPosition = function() {
    document.getElementById('filmstripLayer').style.left = ((420-(imageIndex * 160)) + 'px');
};

// ***************************************************
var setTopImage = function() {
    if (topImage) {
        imgB.src = GALLERY.IMG_LIST[imageIndex].uri;
    } else {
        imgA.src = GALLERY.IMG_LIST[imageIndex].uri;
    }
};

// ********************************************
var animate = function (element, animClass, callback) {
    if (!webkit) {
        if (callback) {
            callback();
        }
        return;
    }

    if (element) {
        element.addEventListener("webkitAnimationEnd", function () {
            console.log("ANIMATION END");
            element.removeEventListener("webkitAnimationEnd", arguments.callee);
            element.classList.remove(animClass);
            if (callback) {
                callback();
            }
        }.bind(this));

        element.classList.add(animClass);
    }
};

// ***************************************************
var loadImages = function() {
    for (var i = 0; i < GALLERY.IMG_LIST.length; i++) {
        filmstripCells[i] = UTILS.createElementFromId('div','filmstripLayer',('cell'+i), 'filmstripCell');
        filmstripCells[i].style.left = ((i * 160) + 'px');
        var image = UTILS.createElementFromId('img',filmstripCells[i],('image'+i), 'filmstripCellImage');
        image.src = GALLERY.IMG_LIST[i].uri;
    }

    setFilmstripPosition();
};

// ***************************************************
// START!
window.onload = loadImages;
