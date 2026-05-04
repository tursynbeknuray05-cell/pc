let tableImg, pcImg;
let weirdImgs = [];

const H = 520;
const W = 660;

let TABLE_TOP;
const TABLE_W = 340;
const TABLE_H = 90;

const OBJ_W = 68;
const OBJ_H = 62;

const SIDE_MARGIN = 140;

let score, objects, fallingObj;
let swayX, swayDir, swaySp;
let dropPending, gameOver;
let msg;

let cameraY = 0;
let targetCameraY = 0;

function preload() {
  tableImg = loadImage("table_pc.png");
  pcImg = loadImage("pc_og.png");

  weirdImgs = [];
  for (let i = 1; i <= 9; i++) {
    weirdImgs.push(loadImage("pc_weird" + i + ".png"));
  }
}

function setup() {
  let c = createCanvas(W, H);

  // center the canvas manually
  c.position(
    (windowWidth - width) / 2,
    (windowHeight - height) / 2
  );

  imageMode(CENTER);
  textAlign(CENTER, CENTER);
  init();
}

function windowResized() {
  resizeCanvas(W, H);

  // re-center
  let c = document.querySelector("canvas");
  c.style.left = (windowWidth - width) / 2 + "px";
  c.style.top = (windowHeight - height) / 2 + "px";
}

function init() {
  TABLE_TOP = H - 100;

  score = 0;
  objects = [];
  fallingObj = null;

  swayX = W / 2;
  swayDir = 1;
  swaySp = 2.5;

  cameraY = 0;
  targetCameraY = 0;

  dropPending = false;
  gameOver = false;
  msg = "Click anywhere to drop!";

  spawnFalling();
}

function choosePCImage() {
  if (score >= 4 && random() < 0.75) {
    return random(weirdImgs);
  }
  return pcImg;
}

function spawnFalling() {
  fallingObj = {
    x: swayX,
    y: 100 - targetCameraY,
    vy: 0,
    landed: false,
    baseY: 0,
    img: choosePCImage()
  };
}

function draw() {
  background(255);

  cameraY = lerp(cameraY, targetCameraY, 0.08);

  push();
  translate(0, cameraY);

  drawTable();

  if (fallingObj && !dropPending && !fallingObj.landed) {
    swayX += swayDir * swaySp;

    if (swayX > W - SIDE_MARGIN || swayX < SIDE_MARGIN) {
      swayDir *= -1;
    }

    fallingObj.x = swayX;
    fallingObj.y = 100 - cameraY;
  }

  if (fallingObj && dropPending && !fallingObj.landed) {
    fallingObj.vy += 0.55;
    fallingObj.y += fallingObj.vy;

    let landY = getLandY();

    if (fallingObj.y >= landY) {
      fallingObj.y = landY;
      fallingObj.vy *= -0.2;

      if (abs(fallingObj.vy) < 0.8) {
        fallingObj.vy = 0;
        fallingObj.landed = true;
        fallingObj.baseY = fallingObj.y;

        let refX =
          objects.length === 0
            ? W / 2
            : objects[objects.length - 1].x;

        let diff = abs(fallingObj.x - refX);
        let tolerance = OBJ_W * 0.85;

        if (diff > tolerance) {
          endGame("It fell off! Score: " + score);
          pop();
          drawUI();
          return;
        }

        let lean = (fallingObj.x - refX) / OBJ_W;

        for (let o of objects) {
          o.x += lean * 5;
        }

        if (objects.length > 0) {
          let maxDrift = max(objects.map(o => abs(o.x - W / 2)));

          if (maxDrift > TABLE_W / 2 - 10) {
            endGame("Stack toppled! Score: " + score);
            pop();
            drawUI();
            return;
          }
        }

        objects.push({ ...fallingObj });

        score++;

        if (score > 3) {
          targetCameraY += OBJ_H;
        }

        swaySp = min(2.5 + score * 0.28, 7.5);

        fallingObj = null;
        dropPending = false;

        msg = "Click to drop another!";

        setTimeout(() => {
          if (!gameOver) spawnFalling();
        }, 300);
      }
    }
  }

  for (let o of objects) {
    drawPC(o.x, o.baseY, o.img);
  }

  if (fallingObj) {
    if (!dropPending) {
      stroke(0, 35);
      strokeWeight(1);
      drawingContext.setLineDash([5, 5]);

      line(
        fallingObj.x,
        fallingObj.y + OBJ_H / 2,
        fallingObj.x,
        getLandY()
      );

      drawingContext.setLineDash([]);
    }

    drawPC(fallingObj.x, fallingObj.y, fallingObj.img);
  }

  pop();

  drawUI();
}

function drawTable() {
  image(tableImg, W / 2, TABLE_TOP + TABLE_H / 2, TABLE_W, TABLE_H);
}

function drawPC(x, y, img) {
  if (img) {
    image(img, x, y, OBJ_W, OBJ_H);
  }
}

function getLandY() {
  if (objects.length === 0) {
    return TABLE_TOP - OBJ_H / 2 + 4;
  }

  let last = objects[objects.length - 1];
  return last.baseY - OBJ_H;
}

function drawUI() {
  noStroke();

  fill(34);
  textSize(15);
  text("Score: " + score, W / 2, 24);

  fill(100);
  textSize(13);
  text(msg, W / 2, 46);

  if (gameOver) {
    fill(255);
    stroke(180);

    rectMode(CENTER);
    rect(W / 2, 82, 120, 32, 8);

    noStroke();
    fill(34);

    textSize(13);
    text("Play again", W / 2, 82);

    rectMode(CORNER);
  }
}

function mousePressed() {
  if (gameOver) {
    if (
      mouseX > W / 2 - 60 &&
      mouseX < W / 2 + 60 &&
      mouseY > 66 &&
      mouseY < 98
    ) {
      init();
    }
    return;
  }

  drop();
}

function drop() {
  if (gameOver || !fallingObj || dropPending || fallingObj.landed) {
    return;
  }

  dropPending = true;
  msg = "Dropping...";
}

function endGame(newMsg) {
  gameOver = true;
  msg = newMsg;
}