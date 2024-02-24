import { map, random } from "./utils/math.js";
import { STARTING_COLS } from "./colors.js";
import Audio from "./utils/audio.js";

/**
 * @type {HTMLCanvasElement}
 */
const canvas = document.getElementById("canvas");

const dyingNoise = document.querySelector(".dying-noise");

/**
 * @type {CanvasRenderingContext2D}
 */
const ctx = canvas.getContext("2d");

let time = 0;
let delta = 0;

const updateTime = (t) => {
    let newTime = t / 1000;
    delta = newTime - time;
    time = newTime;
};

const PIXEL_SIZE = 60;
const PIXEL_SPACING = 5;
const WIDTH = 17;
const HEIGHT = 13;
// const WIDTH = 3;
// const HEIGHT = 3;
const SCREEN_WIDTH = WIDTH * PIXEL_SIZE + (WIDTH - 1) * PIXEL_SPACING;
const SCREEN_HEIGHT = HEIGHT * PIXEL_SIZE + (HEIGHT - 1) * PIXEL_SPACING;
const TIME_TO_DIE = 12000;

let whiteNoise = null;

document.onclick = () => {
    whiteNoise = new Audio(
        "../assets/sounds/249313__jarredgibb__white-noise-20dbfs-30-second.wav"
    )
        .loop()
        .volume(0)
        .play();
};

let userPixels = [[Math.floor(WIDTH / 2), Math.floor(HEIGHT / 2)]];

const isUserPixel = (x, y) => {
    let v = userPixels.some((p) => p[0] == x && p[1] == y);
    console.log(v);
    return v;
};

class Square {
    litTime = 0;
    color = [0, 0, 0];
    isUserPixel = false;

    get brightness() {
        let t = 1 - Math.min(1, Math.max((time - this.litTime) / 3, 0));
        return Math.pow(t, 2);
    }

    randomiseColor() {
        this.color = nextColor.next().value;
    }

    constructor(isUserPixel) {
        this.isUserPixel = isUserPixel;
    }
}

function* getRandomColor() {
    while (true) {
        let amount = random(5) + 3;
        let color = STARTING_COLS[random(STARTING_COLS.length)].color;
        for (let i = 0; i < amount; i++) {
            yield color;
        }
    }
}
let nextColor = getRandomColor();

/**
 * @type {Square[][]}
 */
let squares = Array(WIDTH)
    .fill()
    .map((_, x) =>
        Array(HEIGHT)
            .fill()
            .map((_, y) => new Square(isUserPixel(x, y)))
    );

let nextTime = 2;

let nextPixel = 0;
const getLit = () => {
    let x = nextPixel % WIDTH;
    let y = Math.floor(nextPixel / WIDTH);

    if (!(userPixels[0] == x && userPixels[1] == y)) {
        squares[x][y].randomiseColor();
    }

    squares[x][y].litTime = time;
    nextPixel += 1;
    nextPixel = nextPixel % (WIDTH * HEIGHT);
    return nextPixel;
};

const bellCurveEasing = (pixel) => {
    let t =
        (100 / 2) *
        Math.exp(-Math.pow((pixel - (WIDTH * HEIGHT) / 2) / 30, 2) / 2);
    return map(t, 1.1, 50, 0.01, 0.08);
};

const easeInExpo = (x) => {
    return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
};

const frame = (t) => {
    updateTime(t);

    const deathPercent = easeInExpo((time * 1000) / TIME_TO_DIE) * 100;
    dyingNoise.style.opacity = `${deathPercent}%`;
    whiteNoise && whiteNoise.volume(deathPercent / 100);

    if (time >= nextTime) {
        const nextPixel = getLit();

        nextTime += bellCurveEasing(nextPixel);
    }

    // DRAWING
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const min = Math.min(canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(min / 1200, min / 1200);

    for (let x = 0; x < WIDTH; x++) {
        for (let y = 0; y < HEIGHT; y++) {
            let square = squares[x][y];

            const color = square.color;

            ctx.beginPath();
            ctx.strokeStyle = "transparent";

            ctx.rect(
                x * (PIXEL_SIZE + PIXEL_SPACING) - SCREEN_WIDTH / 2,
                y * (PIXEL_SIZE + PIXEL_SPACING) - SCREEN_HEIGHT / 2,
                PIXEL_SIZE,
                PIXEL_SIZE
            );

            if (square.isUserPixel) {
                ctx.lineWidth = 4;
                ctx.strokeStyle = "white";

                ctx.fillStyle = "black";
            } else {
                ctx.fillStyle = `rgb(${color[0] * square.brightness}, ${
                    color[1] * square.brightness
                }, ${color[2] * square.brightness})`;
            }

            ctx.stroke();
            ctx.fill();
        }
    }

    requestAnimationFrame(frame);
};

requestAnimationFrame(frame);
