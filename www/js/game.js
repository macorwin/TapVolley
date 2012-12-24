(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", initialize, false);

    var preload, canvas, context, stage;

    var width = 1600;
    var height = 900;
    var centerX = width / 2;

    var scaleW = window.innerWidth / width;
    var scaleH = window.innerHeight / height;

    var playerHighScore = 0;
    var ball;
    var player1, player2;
    var aiTurn = false;
    var score1Text, score2Text;
    var scoreFreeze = true;
    var ballSidePrev = 2;
    var ballSide = 2;
    var ballHeight;
    var ballSequence;

    var beachImage, poleFImage, poleBImage, netLImage, netRImage, boundsBImage, boundsLImage, boundsRImage, ballImage, shadowImage;
    var beachBitmap, poleFBitmap, poleBBitmap, netLBitmap, netRBitmap, boundsBBitmap, boundsLBitmap, boundsRBitmap, ballBitmap, shadowBitmap;
    var ringImage = [];
    var ringBitmap = [];
    var ringFrame = [0,0,0,0];
    var ringCount = [0,0,0,0];
    var ringSpeed = 5;

    var updateFrame = 0;
    var updateSpeed = 2;

    var ballRotation = 0;
    var rotateFrame = 0;
    var rotateSpeed = 5;
    var rotateAngle = 5;

    var gravityFrame = 0;
    var gravitySpeed = 10;
    var gravity = .98;

    var height;
    var onGround = false;
    var ballHit, setBall, spikeBall;
    var hitY = height - 300;

    var singleClickTimer;
    var timerOn = false;
    var clickCount = 0;

    function Ball() {

        this.width = 147;
        this.height = 147;

        this.rightEdge = this.width / 2;
        this.leftEdge = -1 * this.width / 2;
        this.topEdge = -1 * this.height / 2;
        this.bottomEdge = this.height / 2;

        this.positionX = width * 3 / 4;
        this.positionY = height / 4;

        this.maxX = width - this.rightEdge;
        this.minX = -1 * this.leftEdge;
        this.maxY = -1 * this.topEdge;
        this.minY = height - this.bottomEdge - 25;

        this.vX = 0;
        this.vY = 3;
    }

    function Player(side, ai) {

        this.score = 0;
        this.hitCount = 0;
        this.side = side;
        this.ai = ai;
    }

    function chooseBallSequence() {

        var ballSpeed = Math.sqrt(ball.vX * ball.vX + ball.vY * ball.vY);

        if (ballSpeed >= 12) {
            var randomMiss = Math.floor(Math.random() * 2 + 1);
            if (randomMiss > 2) {
                ballSequence = 1; //return
                setBall = false;
                hitY = height - 300;
            }
            else {
                ballSequence = -1; //miss
                hitY = height - 300;
            }
        }
        else if (ballSpeed >= 8) {
            ballSequence = 2; //bump, set, spike
            setBall = false;
            hitY = height - 300;
        }
        else {
            ballSequence = 3; //set, spike
            setBall = true;
            hitY = height - 300;
        }

        ballHit = true;

        
    }

    function autoTap() {

        var tapX, tapY, errorX, errorY;
        var ballMiss = false;
        ballHit = true;
        spikeBall = false;

        if (ballSide == 1) {
            if (ballSequence == 1) {
                tapX = ball.positionX - Math.abs(ball.vX) * 5 - 50;
                if (Math.abs(tapX) < 5) {
                    tapX -= 10;
                }
                tapY = ball.positionY + Math.abs(ball.vY) * 10;
            }
            else if (ballSequence == 2) {
                tapX = ball.positionX + Math.abs(ball.vX) * 10;
                if (Math.abs(tapX) < 5) {
                    tapX += 10;
                }
                tapY = ball.positionY - ball.vY * 20;
                setBall = true;
                ballSequence = 3;
            }
            else if (ballSequence == 3) {
                if (setBall) {
                    tapX = ball.positionX + 0.05 * ball.vX;
                    tapY = ball.positionY + Math.abs(ball.vY) * 10;
                    hitY = height - 700;
                    setBall = false;
                }
                else {
                    if (ball.positionX >= width / 4) {
                        tapX = ball.positionX - 50;
                        tapY = ball.positionY - 30;
                        spikeBall = true;
                    }
                    else {
                        ballSequence = 1;
                        hitY = height - 300;
                        ballHit = false;
                    }
                }
            }
            else if (ballSequence == 0) {
                ballHit = false;
            }
            else if (ballSequence == -1) {
                ballMiss = true;
            }
        }
        else {
            tapX = ball.positionX + Math.abs(ball.vX) * 10;
            if (Math.abs(tapX) > 5) {
                tapX += 10;
            }
            tapY = ball.positionY - ball.vY * 10;
        }

        if (tapX < 0) {
            tapX = 0;
        }
        else if (tapX >= centerX) {
            tapX = centerX - 1;
        }

        if (tapY < 0) {
            tapY = 0;
        }
        else if (tapY > height) {
            tapY = height;
        }
           

        if (ballHit) {
            if (ballMiss) {
                tapX = ball.positionX;
                tapY = ball.positionY - 100;
                ballSequence = 0;
                ballMiss = false;
                ballHit = false;
            }
            else {
                errorX = Math.floor(Math.random() * 100 - 50);
                errorY = Math.floor(Math.random() * 100 - 50);
                tapX += errorX;
                tapY += errorY;
            }
            singleClick(tapX, tapY);
            if (spikeBall) {
                spike(tapX, tapY);
                ballSequence = 0;
                hitY = height - 300;
            }
        }

    }

    function updateScore(player) {

        if (player == 1) {
            score1Text.text = player1.score;
        }
        else {
            score2Text.text = player2.score;
        }
    }

    function singleClick(x, y) {

        displayRing(x, y, false);

        x /= scaleW;
        y /= scaleH;

        var dx = ball.positionX - x;
        var dy = ball.positionY - y;
        var d = Math.sqrt(dx * dx + dy * dy);

        var tapAngle = Math.atan(dy / dx);
        var tapSpeed = 0;
        var tapVx, tapVy;

        var inRange = false;
      
        if (d <= height / 3 && d <= width / 3) {
            tapSpeed = 2;
            inRange = true;
            scoreFreeze = false;
        }
        if (d <= height / 4 && d <= width / 4) {
            tapSpeed = 5;
        }
        if (d <= height / 8 && d <= width / 8) {
            tapSpeed = 8;
        }
        if (d <= height / 16 && d <= width / 16) {
            tapSpeed = 10;
        }

        if (inRange) {

            if (x < centerX) {
                player1.hitCount++;
            }
            else {
                player2.hitCount++;
            }

            if (player1.hitCount >= 4) {
                player2.score++;
                updateScore(2);
                player1.hitCount = 1;
            }
            if (player2.hitCount >= 4) {
                player1.score++;
                updateScore(1);
                player2.hitCount = 1;
            }

            if (dx >= 0) {
                tapVx = tapSpeed * Math.cos(tapAngle);
                tapVy = -tapSpeed * Math.sin(tapAngle);
            }
            else {
                tapVx = -tapSpeed * Math.cos(tapAngle);
                tapVy = tapSpeed * Math.sin(tapAngle);
            }

            if ((ball.vX >= 0 && tapVx >= 0) || (ball.vX <= 0 && tapVx <= 0)) {
                ball.vX += tapVx;
            }
            else {
                ball.vX = -.5 * ball.vX + tapVx;
            }

            if ((ball.vY >= 0 && tapVy >= 0) || (ball.vY <= 0 && tapVy <= 0)) {
                ball.vY += tapVy;
            }
            else {
                ball.vY = -.5 * ball.vY + tapVy;
            }

            clickCount++;
            gravityFrame = 0;
            onGround = false;
        }

    }

    function spike(x, y) {

        if (y < ball.positionY) {
            displayRing(x, y, true);
            ball.vX *= 1.75;
            ball.vY *= 1.5;
        }
    }

    function pointerUp(event) {

        if (!timerOn) {
            singleClickTimer = setTimeout(function () {
                timerOn = false;
                clickCount = 0;
            }, 300);
            timerOn = true;
            singleClick(event.x, event.y);
        } else if (clickCount == 1) {
            clearTimeout(singleClickTimer);
            timerOn = false;
            clickCount = 0;
            spike(event.x, event.y);
        }
    }

    function displayRing(x, y, spike) {

        var index = 0;

        if (x >= centerX) {
            index = 0;
        }
        else {
            index = 2;
        }

        if (spike) {
            index++;
        }
        
        ringBitmap[index].visible = true;
        ringBitmap[index].x = x;
        ringBitmap[index].y = y;

    }

    function updateImages() {

        ballBitmap.x = ball.positionX * scaleW;
        ballBitmap.y = ball.positionY * scaleH;

        shadowBitmap.x = ball.positionX * scaleW;
        shadowBitmap.y = (ball.minY + ball.height - 65) * scaleH;

        ballHeight = ball.minY - ball.positionY;
        shadowBitmap.alpha = .7 - (height - ball.positionY) / 3000;
        if (shadowBitmap.alpha < .2) {
            shadowBitmap.alpha = .2;
        }
        shadowBitmap.scaleX = (1 + ballHeight / 1000) * scaleW;
        shadowBitmap.scaleY = (1 + ballHeight / 1000) * scaleH;

        if (ball.positionX < width / 4) {
            poleBBitmap.x = (centerX - (width / 4) / 8) * scaleW;
            boundsLBitmap.rotation = 90;
            boundsRBitmap.rotation = 60;
            boundsLBitmap.scaleX = .125 * scaleW;
            boundsRBitmap.scaleX = (.125 + .00002 * width / 2) * scaleW;
            boundsBBitmap.x = 50 * scaleW;
        }
        else if (ball.positionX > width * 3 / 4) {
            poleBBitmap.x = (centerX + (width / 4) / 8) * scaleW;
            boundsRBitmap.rotation = 90;
            boundsLBitmap.rotation = 120;
            boundsRBitmap.scaleX = .125 * scaleW;
            boundsLBitmap.scaleX = (.125 + .00002 * width / 2) * scaleW;
            boundsBBitmap.x = 105 * scaleW;
        }
        else {
            poleBBitmap.x = (centerX + (ball.positionX - centerX) / 8) * scaleW;
            boundsLBitmap.rotation = 90 + 30 * (ball.positionX - width / 4) / (width / 2);
            boundsRBitmap.rotation = 90 - 30 * (width * 3 / 4 - ball.positionX) / (width / 2);
            boundsLBitmap.scaleX = (.125 + .00002 * (ball.positionX - width / 4) * (ball.positionX - width / 4) / (width / 2)) * scaleW;
            boundsRBitmap.scaleX = (.125 + .00002 * (width * 3 / 4 - ball.positionX) * (width * 3 / 4 - ball.positionX) / (width / 2)) * scaleW;
            boundsBBitmap.x = (50 + 54 * (ball.positionX - width / 4) / (width / 2)) * scaleW;
        }

        if (ball.positionX < centerX) {
            netLBitmap.visible = true;
            netRBitmap.visible = false;
            netLBitmap.scaleX = (centerX * scaleW - poleBBitmap.x) / 50;
        }
        else {
            netRBitmap.visible = true;
            netLBitmap.visible = false;
            netRBitmap.scaleX = (poleBBitmap.x - centerX * scaleW) / 50;
        }

        for (var i = 0; i <= 3; i++) {
            if (ringBitmap[i].visible) {
                if (ringFrame[i] >= ringSpeed) {
                    ringCount[i]++;
                    ringFrame[i] = 0;
                    ringBitmap[i].alpha = ringBitmap[i].alpha - .1;
                    ringBitmap[i].scaleX = (1 + ringCount[i] / 3) * scaleW;
                    ringBitmap[i].scaleY = (1 + ringCount[i] / 3) * scaleH;
                }
                if (ringCount[i] >= 10) {
                    ringCount[i] = 0;
                    ringBitmap[i].visible = false;
                    ringBitmap[i].alpha = 1;
                    ringBitmap[i].scaleX = scaleW;
                    ringBitmap[i].scaleY = scaleH;
                }
                ringFrame[i]++;
            }
        }
    }

    function collisionCheck() {

        if (ball.positionX >= ball.maxX) {
            ball.vX = -ball.vX;
            ball.positionX = ball.maxX - 1;
        }

        if (ball.positionX <= ball.minX) {
            ball.vX = -ball.vX;
            ball.positionX = ball.minX + 1;
        }

        if (ball.positionY + ball.bottomEdge >= height - 300 && ball.positionX + ball.rightEdge >= centerX - 10 && ball.positionX + ball.leftEdge <= centerX + 10) {
            if (ball.positionY + ball.bottomEdge <= height - 290) {
                if (ball.vY < 0) {
                    ball.vY = -.813 * ball.vY;
                }
            }
            else {
                ball.vX = -ball.vX;
                if (ball.vX <= 0.5) {
                    if (ball.positionX < centerX) {
                        ball.positionX = centerX - ball.rightEdge - 10;
                    }
                    else {
                        ball.positionX = centerX + ball.leftEdge + 10;
                    }
                }
            }
        }
    }

    function ballSideCheck() {

        if (ball.positionX >= width / 2) {
            ballSide = 2;
        }
        else {
            ballSide = 1;
        }

        if (ballSide != ballSidePrev) {
            clearTimeout(singleClickTimer);
            timerOn = false;
            clickCount = 0;
            player1.hitCount = 0;
            player2.hitCount = 0;
            if (ballSide == 1) {
                if (player1.ai) {
                    aiTurn = true;
                    chooseBallSequence();
                }
                else {
                    aiTurn = false;
                }
            }
            else {
                if (player2.ai) {
                    aiTurn = true;
                    chooseBallSequence();
                }
                else {
                    aiTurn = false;
                }
            }
        }

        ballSidePrev = ballSide;
    }

    function groundHit() {
        
        ball.positionY = ball.minY - 1;
        ball.vY = -.213 * ball.vY;
        ball.vX = .813 * ball.vX;
        if (!scoreFreeze) {
            if (ball.positionX > centerX) {
                player2.hitCount = 0;
                player1.score++;
                updateScore(1);
            }
            else {
                player1.hitCount = 0;
                player2.score++;
                updateScore(2);
            }
        }
        scoreFreeze = true;
    }

    function initialize() {
        //var appData = Windows.Storage.ApplicationData.current;
        //var roamingSettings = appData.roamingSettings;
        //var tempHighScore = roamingSettings.values["highscore"];
        //if (!tempHighScore) {
        //}
        //else {
        //    playerHighScore = tempHighScore;
        //}

        canvas = document.getElementById("canvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        context = canvas.getContext("2d");

        canvas.addEventListener("MSPointerUp", pointerUp, false);
        //canvas.addEventListener("MSPointerMove", pointerMove, false);
        //canvas.addEventListener("MSPointerDown", pointerDown, false);

        stage = new createjs.Stage(canvas);

        preload = new createjs.PreloadJS();
        preload.onComplete = prepareGame;

        var manifest = [
            { id: "ball", src: "images/GFX/volleyball.png" },
            { id: "ring_blue", src: "images/GFX/ring_blue.png" },
            { id: "ring_green", src: "images/GFX/ring_green.png" },
            { id: "ring_red", src: "images/GFX/ring_red.png" },
            { id: "ring_orange", src: "images/GFX/ring_orange.png" },
            { id: "bounds", src: "images/GFX/bounds.png" },
            { id: "divider", src: "images/GFX/divider.png" },
            { id: "net_left", src: "images/GFX/net_left.png" },
            { id: "net_right", src: "images/GFX/net_right.png" },
            { id: "shadow", src: "images/GFX/shadow.png" },
            { id: "beach", src: "images/GFX/beach.png" }
        ];

        preload.loadManifest(manifest);
    }

    function prepareGame() {

        beachImage = preload.getResult("beach").result;
        beachBitmap = new createjs.Bitmap(beachImage);
        beachBitmap.scaleX = scaleW;
        beachBitmap.scaleY = scaleH;
        beachBitmap.x = 0;
        beachBitmap.y = 0;
        stage.addChild(beachBitmap);

        boundsLImage = preload.getResult("bounds").result;
        boundsLBitmap = new createjs.Bitmap(boundsLImage);
        boundsLBitmap.regX = 800;
        boundsLBitmap.regY = 2.5;
        boundsLBitmap.scaleX = (1 / 8) * scaleW;
        boundsLBitmap.scaleY = scaleH;
        boundsLBitmap.rotation = 90;
        boundsLBitmap.x = 50 * scaleW;
        boundsLBitmap.y = height * scaleH;
        stage.addChild(boundsLBitmap);

        boundsRImage = preload.getResult("bounds").result;
        boundsRBitmap = new createjs.Bitmap(boundsRImage);
        boundsRBitmap.regX = 800;
        boundsRBitmap.regY = 2.5;
        boundsRBitmap.scaleX = (1 / 8) * scaleW;
        boundsRBitmap.scaleY = scaleH;
        boundsRBitmap.rotation = 90;
        boundsRBitmap.x = (width - 50) * scaleW;
        boundsRBitmap.y = height * scaleH;
        stage.addChild(boundsRBitmap);

        boundsBImage = preload.getResult("bounds").result;
        boundsBBitmap = new createjs.Bitmap(boundsBImage);
        boundsBBitmap.scaleX = ((width - 155) / 1600) * scaleW;
        boundsBBitmap.scaleY = scaleH;
        boundsBBitmap.x = boundsLBitmap.x;
        boundsBBitmap.y = (height - 100) * scaleH;
        stage.addChild(boundsBBitmap);

        poleBImage = preload.getResult("divider").result;
        poleBBitmap = new createjs.Bitmap(poleBImage);
        poleBBitmap.regX = 10;
        poleBBitmap.regY = 300;
        poleBBitmap.scaleX = (2 / 3) * scaleW;
        poleBBitmap.scaleY = (2 / 3) * scaleH;
        poleBBitmap.x = 0;
        poleBBitmap.y = (height - 100) * scaleH;
        stage.addChild(poleBBitmap);

        netLImage = preload.getResult("net_left").result;
        netLBitmap = new createjs.Bitmap(netLImage);
        netLBitmap.regX = 50;
        netLBitmap.regY = 300;
        netLBitmap.scaleX = scaleW;
        netLBitmap.scaleY = 0.5 * scaleH;
        netLBitmap.x = centerX * scaleW;
        netLBitmap.y = (height - 150) * scaleH;
        stage.addChild(netLBitmap);

        netRImage = preload.getResult("net_right").result;
        netRBitmap = new createjs.Bitmap(netRImage);
        netRBitmap.regX = 0;
        netRBitmap.regY = 300;
        netRBitmap.scaleX = scaleW;
        netRBitmap.scaleY = 0.5 * scaleH;
        netRBitmap.x = centerX * scaleW;
        netRBitmap.y = (height - 150) * scaleH;
        stage.addChild(netRBitmap);

        shadowImage = preload.getResult("shadow").result;
        shadowBitmap = new createjs.Bitmap(shadowImage);
        shadowBitmap.regX = 150 / 2;
        shadowBitmap.regY = 150;
        shadowBitmap.scaleX = scaleW;
        shadowBitmap.scaleY = scaleH;
        stage.addChild(shadowBitmap);

        poleFImage = preload.getResult("divider").result;
        poleFBitmap = new createjs.Bitmap(poleFImage);
        poleFBitmap.regX = 10;
        poleFBitmap.regY = 300;
        poleFBitmap.scaleX = scaleW;
        poleFBitmap.scaleY = scaleH;
        poleFBitmap.x = centerX * scaleW;
        poleFBitmap.y = height * scaleH;
        stage.addChild(poleFBitmap);

        score1Text = new createjs.Text("0", "36px Arial", "#000000");
        score2Text = new createjs.Text("0", "36px Arial", "#000000");
        score1Text.regX = 2;
        score2Text.regX = 2;
        score1Text.x = (width / 4) * scaleW;
        score1Text.y = (height / 8) * scaleH;
        score2Text.x = (width * 3 / 4) * scaleW;
        score2Text.y = (height / 8) * scaleH;
        stage.addChild(score1Text);
        stage.addChild(score2Text);

        ringImage[0] = preload.getResult("ring_blue").result;
        ringImage[1] = preload.getResult("ring_red").result;
        ringImage[2] = preload.getResult("ring_green").result;
        ringImage[3] = preload.getResult("ring_orange").result;

        for (var i = 0; i <= 3; i++) {
            ringBitmap[i] = new createjs.Bitmap(ringImage[i]);
            ringBitmap[i].regX = 35 / 2;
            ringBitmap[i].regY = 35 / 2;
            ringBitmap[i].scaleX = scaleW;
            ringBitmap[i].scaleY = scaleH;
            ringBitmap[i].visible = false;
            stage.addChild(ringBitmap[i]);
        }

        ballImage = preload.getResult("ball").result;
        ballBitmap = new createjs.Bitmap(ballImage);
        ballBitmap.regX = 150 / 2;
        ballBitmap.regY = 150 / 2;
        ballBitmap.scaleX = scaleW;
        ballBitmap.scaleY = scaleH;
        stage.addChild(ballBitmap);

        ball = new Ball();
        player1 = new Player(1, true);
        player2 = new Player(2, false);

        stage.update();

        startGame();
    }

    function startGame() {
        createjs.Ticker.setInterval(window.requestAnimationFrame);
        createjs.Ticker.addListener(gameLoop);
    }

    function gameLoop() {
        update();
        draw();
    }

    function update() {

        rotateFrame++;
        updateFrame++;

        if (updateFrame >= updateSpeed) {

            collisionCheck();

            ballSideCheck();

            if (!onGround) {

                if (ball.positionY >= ball.minY) {
                    groundHit();
                }

                if (gravityFrame >= gravitySpeed) {
                    ball.vY -= gravity;
                    gravityFrame = 0;
                }

                gravityFrame++;

                if (Math.abs(ball.vY) <= .5 && ball.positionY >= ball.minY - 5) {
                    ball.vY = 0;
                    ball.positionY = ball.minY - 1;
                    onGround = true;
                }

                ball.vX = ball.vX * .999;
            }
            else {
                ball.vX = .89 * ball.vX;
                ball.positionY = ball.minY - 1;
                if (Math.abs(ball.vX) <= .2) {
                    ball.vX = 0;
                }
            }
    

            rotateSpeed = 20 / Math.abs(ball.vX);

            if (rotateFrame >= rotateSpeed) {
                if (ball.vX > 0) {
                    ballBitmap.rotation += rotateAngle;
                }
                else if (ball.vX < 0) {
                    ballBitmap.rotation -= rotateAngle;
                }
                if (ballBitmap.rotation >= 360) {
                    ballBitmap.rotation = 0;
                }
                rotateFrame = 0;
            }

            ball.positionX += ball.vX;
            ball.positionY -= ball.vY;

            updateImages();

            updateFrame = 0;

            if (aiTurn) {
                if (ball.vY < 0 && ball.positionY >= hitY) {
                    autoTap();
                }
                else if (ball.vY < 0 && ball.positionY >= height - 300 && ballSequence > 0) {
                    autoTap();
                    ballSequence = 1;
                }
            }
        }


    }

    function draw() {
        stage.update();
    }

})();