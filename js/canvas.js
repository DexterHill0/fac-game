import { map, easeInExpo, random, wrap } from "./utils/math.js";
import { Ui } from "./uis.js";

const PIXEL_SIZE = 60;
const PIXEL_SPACING = 5;
const WIDTH = 17;
const COLOR_CHANGE_THRESHOLD = 5;
const HEIGHT = 13;
const SCREEN_WIDTH = WIDTH * PIXEL_SIZE + (WIDTH - 1) * PIXEL_SPACING;
const SCREEN_HEIGHT = HEIGHT * PIXEL_SIZE + (HEIGHT - 1) * PIXEL_SPACING;
// how long before the noise is at its peak
// the noise does not fade in linearlly
const TIME_TO_DIE = 30000;
const MIN_CHALLENGE_TIME = 12; //12
const MAX_CHALLENGE_TIME = 20; //20

let userPixels = [[Math.floor(WIDTH / 2), Math.floor(HEIGHT / 2)]];

const isUserPixel = (x, y) => {
    return userPixels.some((p) => p[0] == x && p[1] == y);
};

const isWithinRangeOfUserPixel = (x, y, range) => {
    return userPixels.some((p) => p[0] - range <= x && p[1] == y);
};

const pixelCoordFromIdx = (idx) => ({
    x: idx % WIDTH,
    y: Math.floor(idx / WIDTH),
});
const pixelIdxFromCoord = ([x, y]) => y * WIDTH + x;

class Pixel {
    litTime = 0;
    color = [0, 0, 0];

    reset() {
        this.litTime = 0;
        this.color = [0, 0, 0];
    }

    // gets the brightness of the pixel from a given time
    brightness(time) {
        let t = 1 - Math.min(1, Math.max((time - this.litTime) / 6, 0));
        return Math.pow(t, 2);
    }

    constructor(time) {
        this.litTime = time;
    }
}

const ALL_CHALLENGES = [
    "extraPixel",
    "color",
    "color",
    "area",
    "speed",
    "decThreshold",
    "filter",
    "dontPress",
];
const CHALLENGE_DESCRIPTIONS = {
    extraPixel: "Extra Pixel!",
    color: "New Color!",
    area: "Speed Up!",
    speed: "Speed Up!",
    decThreshold: "Randomness++",
    filter: "Interference...",
};

let challenges = [...ALL_CHALLENGES];

export class Canvas extends Ui("canvas") {
    #currentAnimationCb = null;

    /**
     * @type {CanvasRenderingContext2D}
     */
    #ctx = this.self.getContext("2d");

    #startTime = 0;
    get #time() {
        return Date.now() / 1000 - this.#startTime;
    }
    #nextTime = 0;
    #nextPixel = 0;

    #minChallengeTime = MIN_CHALLENGE_TIME;
    #maxChallengeTime = MAX_CHALLENGE_TIME;
    #nextChallengeTime = random(this.#minChallengeTime, this.#maxChallengeTime);

    #colorGen = null;
    /**
     * @type {Pixel[][]}
     */
    #pixels = Array(WIDTH)
        .fill()
        .map((_, x) =>
            Array(HEIGHT)
                .fill()
                .map((_, y) => new Pixel(x, y, this.#time))
        );

    // stop the color being able to change like 1 pixel before yours
    // which would give not much time to react
    #colorChangeThreshold = COLOR_CHANGE_THRESHOLD;
    #color = null;

    #currentDeathTime = 0;

    #bellCurveArea = 18;
    #litTimeSpeed = 0.12;

    #dontPressChallenge = false;

    #bgMusic = null;

    #pixelAtIdx(idx) {
        let { x, y } = pixelCoordFromIdx(idx);
        if (y == -1) {
            console.log(`pinor ${x} ${y} ${idx}`);
        }
        return this.#pixels[x][y];
    }

    // bell-curve-like easing that makes the the fading of the pixels slow down very signficantly as it gets closer to
    // a given pixel, and then speed back up again very quickly
    #bellCurveEasing(forPixel, userPixel) {
        let t =
            (100 / 2) *
            Math.exp(
                -Math.pow((forPixel - userPixel) / this.#bellCurveArea, 2) / 2
            );
        return map(t, 1.1, 50, 0.005, this.#litTimeSpeed);
    }
    // calculates the easings for multiple pixels
    #cumulativeEasing(forPixel) {
        return Math.max(
            ...userPixels.map((coord) =>
                this.#bellCurveEasing(forPixel, pixelIdxFromCoord(coord))
            )
        );
    }

    #getLitPixel() {
        let x = this.#nextPixel % WIDTH;
        let y = Math.floor(this.#nextPixel / WIDTH);

        if (isWithinRangeOfUserPixel(x, y, this.#colorChangeThreshold)) {
            if (!isUserPixel(x, y)) {
                // repeat previously saved color
                this.#pixels[x][y].color = this.#color;
            }
        } else {
            const color = this.#colorGen.next().value;
            this.#color = color;
            this.#pixels[x][y].color = color;
        }

        this.#pixels[x][y].litTime = this.#time;

        this.#nextPixel += 1;
        this.#nextPixel = this.#nextPixel % (WIDTH * HEIGHT);

        return { x, y };
    }

    #randomFilter(cb) {
        const filters = ["sepia", "contrast", "saturate"];
        const filter = filters[random(0, filters.length)];
        const percent = random(15, 50);
        const duration = random(3, 8);

        this.self.style.filter = `${filter}(${percent}%)`;
        setTimeout(() => {
            this.self.style.filter = "none";
            cb();
        }, duration * 1000);
    }

    #createChallenge() {
        const index = random(0, challenges.length - 1);
        const challenge = challenges[index];

        this.state.getAudio("challenge").volume(0.4).play();

        switch (challenge) {
            case "extraPixel":
                const [x, y] = [random(0, WIDTH - 1), random(0, HEIGHT - 1)];
                if (!userPixels.some((v) => v[0] == x && v[1] == y)) {
                    userPixels.push([x, y]);
                }
                break;
            case "color":
                this.state.uis.hud.addNewColor();
                challenges.splice(index, 1);
                break;
            case "speed":
                this.#litTimeSpeed *= 0.9375;
                break;
            case "area":
                this.#bellCurveArea *= 0.9;
                break;
            case "decThreshold":
                this.#colorChangeThreshold--;
                break;
            case "filter":
                // dont allow other filters to be applied while there is an active filter
                challenges.splice(index, 1);
                // only add filter challenge back to the array once the current filter is done
                this.#randomFilter(() => challenges.push("filter"));
                break;
            case "dontPress":
                this.#dontPressChallenge = true;
                this.state.uis.hud.dontPressChallenge(true);
                return;
        }

        this.state.uis.hud.createChallengeText(
            CHALLENGE_DESCRIPTIONS[challenge]
        );
    }

    hide() {
        cancelAnimationFrame(this.#currentAnimationCb);

        this.state.uis.hud.hide();

        this.state.uis.hud.updateBestTime(0);

        this.#currentDeathTime = 0;
        this.#colorChangeThreshold = COLOR_CHANGE_THRESHOLD;
        this.#color = null;
        this.#nextTime = 0;
        this.#nextPixel = 0;
        this.#minChallengeTime = MIN_CHALLENGE_TIME;
        this.#maxChallengeTime = MAX_CHALLENGE_TIME;

        this.#ctx.clearRect(0, 0, this.self.width, this.self.height);

        for (const pixels of this.#pixels)
            for (const pixel of pixels) pixel.reset();

        this.self.classList.remove("jerk");
        this.state.uis.hud.self.classList.remove("jerk");

        this.#bgMusic.stop();

        super.hide();
    }

    #draw = () => {
        this.state.uis.hud.updateBestTime(this.#time * 1000);

        const width = this.self.width;
        const height = this.self.height;

        this.#currentDeathTime += 0.85;

        this.#minChallengeTime -= 0.00008;
        this.#maxChallengeTime -= 0.00008;

        if (this.#time >= this.#nextChallengeTime) {
            this.#createChallenge();
            this.#nextChallengeTime =
                this.#time +
                random(this.#minChallengeTime, this.#maxChallengeTime);
        }

        if (this.#time >= this.#nextTime) {
            let { x, y } = this.#getLitPixel();

            if (isUserPixel(x, y)) {
                const selectedColor = this.state.uis.hud.selectedColor;

                let correctColor = this.#pixelAtIdx(
                    wrap(pixelIdxFromCoord([x, y]) - 1, 0, WIDTH * HEIGHT)
                ).color;

                const miss = () => {
                    this.state.getAudio("miss").play();
                    this.#pixels[x][y].color = [128, 128, 128];
                    this.#currentDeathTime += 50;
                    this.state.uis.hud.selectedColor = null;
                };
                const correct = () => {
                    this.#pixels[x][y].color = correctColor;
                    this.#currentDeathTime = Math.max(
                        0,
                        this.#currentDeathTime - 1000
                    );
                    this.state.uis.hud.selectedColor = null;
                    this.state.getAudio("correct").play();
                };

                if (this.#dontPressChallenge) {
                    if (selectedColor != null) miss();
                    else correct();

                    this.#dontPressChallenge = false;
                    this.state.uis.hud.dontPressChallenge(false);
                } else {
                    if (
                        selectedColor != null &&
                        selectedColor[0] == correctColor[0] &&
                        selectedColor[1] == correctColor[1] &&
                        selectedColor[2] == correctColor[2]
                    )
                        correct();
                    else miss();
                }
            }

            this.#nextTime =
                this.#time + this.#cumulativeEasing(this.#nextPixel);
        }

        // DRAWING
        this.#ctx.resetTransform();
        this.#ctx.clearRect(0, 0, width, height);

        const min = Math.min(width, height);

        this.#ctx.translate(width / 2, (height / 2) * 1.1);
        this.#ctx.scale(min / 1200, min / 1200);

        for (let x = 0; x < WIDTH; x++) {
            for (let y = 0; y < HEIGHT; y++) {
                const pixel = this.#pixels[x][y];

                this.#ctx.beginPath();
                this.#ctx.strokeStyle = "transparent";

                let cornerX =
                    x * (PIXEL_SIZE + PIXEL_SPACING) - SCREEN_WIDTH / 2;
                let cornerY =
                    y * (PIXEL_SIZE + PIXEL_SPACING) - SCREEN_HEIGHT / 2;
                const DIV = 2;

                const transform = (tx, ty) => {
                    let d = Math.hypot(tx, ty);
                    let mod = Math.exp(-((d / 800) ** 2)) * 0.5 + 0.75;
                    return [tx * mod, ty * mod];
                };

                const drawLine = (x0, y0, x1, y1) => {
                    for (let i = 0; i < DIV; i++) {
                        let p = (i + 1) / DIV;

                        let [tx, ty] = transform(
                            x0 + (x1 - x0) * p,
                            y0 + (y1 - y0) * p
                        );

                        this.#ctx.lineTo(tx, ty);
                    }
                };

                let [cornerXT, cornerYT] = transform(cornerX, cornerY);
                this.#ctx.moveTo(cornerXT, cornerYT);
                drawLine(cornerX, cornerY, cornerX + PIXEL_SIZE, cornerY);
                drawLine(
                    cornerX + PIXEL_SIZE,
                    cornerY,
                    cornerX + PIXEL_SIZE,
                    cornerY + PIXEL_SIZE
                );
                drawLine(
                    cornerX + PIXEL_SIZE,
                    cornerY + PIXEL_SIZE,
                    cornerX,
                    cornerY + PIXEL_SIZE
                );
                drawLine(cornerX, cornerY + PIXEL_SIZE, cornerX, cornerY);

                this.#ctx.closePath();

                if (isUserPixel(x, y)) {
                    this.#ctx.lineWidth = 4;
                    this.#ctx.strokeStyle = "white";
                }

                const brightness = pixel.brightness(this.#time);
                const color = pixel.color;

                this.#ctx.fillStyle = `rgb(${color[0] * brightness}, ${
                    color[1] * brightness
                }, ${color[2] * brightness})`;

                this.#ctx.stroke();
                this.#ctx.fill();
            }
        }

        const deathPercent =
            easeInExpo((this.#currentDeathTime * 10) / TIME_TO_DIE) * 100;

        if (deathPercent >= 100) {
            this.state.uis.dyingNoise.reset();
            this.state.getAudio("monitorShutdown").play();
            this.state.changeToUi("titleScreen");
            return;
        } else {
            this.state.uis.dyingNoise.setDeathProgress(deathPercent);
        }

        this.#currentAnimationCb = requestAnimationFrame(this.#draw);
    };

    show() {
        this.self.classList.add("jerk");
        this.state.uis.hud.self.classList.add("jerk");

        this.state.uis.hud.show();

        this.#currentAnimationCb = requestAnimationFrame(this.#draw);

        this.#colorGen = this.state.uis.hud.colorGenerator(5, 9);

        this.#startTime = Date.now() / 1000;

        this.#bgMusic = this.state.getAudio("bg").loop().play();

        super.show();
    }
}
