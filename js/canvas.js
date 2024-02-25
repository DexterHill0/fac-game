import { map, easeInExpo, random } from "./utils/math.js";
// import { STARTING_COLS } from "./colors.js";
// import Audio from "./utils/audio.js";
import { Ui } from "./uis.js";
// import { getRandomColor } from "./colors.js";

const PIXEL_SIZE = 60;
const PIXEL_SPACING = 5;
const WIDTH = 17;
const COLOR_CHANGE_THRESHOLD = 5;
const HEIGHT = 13;
const SCREEN_WIDTH = WIDTH * PIXEL_SIZE + (WIDTH - 1) * PIXEL_SPACING;
const SCREEN_HEIGHT = HEIGHT * PIXEL_SIZE + (HEIGHT - 1) * PIXEL_SPACING;
// how long before the noise is at its peak
// the noise does not fade in linearlly
const TIME_TO_DIE = 25000;

let userPixels = [
    [Math.floor(WIDTH / 2) + 2, Math.floor(HEIGHT / 2)],
    [Math.floor(WIDTH / 2) - 1, Math.floor(HEIGHT / 2)],
];

const isUserPixel = (x, y) => {
    return userPixels.some((p) => p[0] == x && p[1] == y);
};

const isWithinRangeOfUserPixel = (x, y, range) => {
    return userPixels.some((p) => p[0] - range <= x && p[1] == y);
};

const userPixelIndex = (x, y) => {
    return userPixels.findIndex(([x1, y1]) => x1 == x && y1 == y);
};

const pixelCoordFromIdx = (idx) => ({
    x: idx % WIDTH,
    y: Math.floor(idx / WIDTH),
});
const pixelIdxFromCoord = ([x, y]) => y * WIDTH + x;

const sortPixels = () => {
    userPixels = userPixels.sort((a, b) =>
        pixelIdxFromCoord(a) > pixelCoordFromIdx(b) ? -1 : 1
    );
};

class Pixel {
    litTime = 0;
    color = [0, 0, 0];
    // is a pixel that the user is controlling?
    isUserPixel = false;

    reset() {
        this.litTime = 0;
        this.color = [0, 0, 0];
    }

    // gets the brightness of the pixel from a given time
    brightness(time) {
        let t = 1 - Math.min(1, Math.max((time - this.litTime) / 3, 0));
        return Math.pow(t, 2);
    }

    constructor(x, y, time) {
        this.litTime = time;
        this.isUserPixel = isUserPixel(x, y);
    }
}

export class Canvas extends Ui("canvas") {
    #currentAnimationCb = null;

    /**
     * @type {CanvasRenderingContext2D}
     */
    #ctx = this.self.getContext("2d");

    #time = 0;
    #nextTime = 0;
    #nextPixel = 0;

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

    #hasMissedPixel = false;
    #previousUserPixelIdx = -1;

    #pixelAtIdx(idx) {
        let { x, y } = pixelCoordFromIdx(idx);
        return this.#pixels[x][y];
    }

    // bell-curve-like easing that makes the the fading of the pixels slow down very signficantly as it gets closer to
    // a given pixel, and then speed back up again very quickly
    #bellCurveEasing(forPixel, userPixel) {
        let t =
            (100 / 2) * Math.exp(-Math.pow((forPixel - userPixel) / 20, 2) / 2);
        return map(t, 1.1, 50, 0.005, 0.08);
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

    hide() {
        cancelAnimationFrame(this.#currentAnimationCb);

        this.state.uis.hud.hide();

        this.#time = 0;
        this.#currentDeathTime = 0;
        this.#colorChangeThreshold = COLOR_CHANGE_THRESHOLD;
        this.#color = null;
        this.#nextTime = 0;
        this.#nextPixel = 0;

        this.#ctx.clearRect(0, 0, this.self.width, this.self.height);

        for (const pixels of this.#pixels)
            for (const pixel of pixels) pixel.reset();

        this.self.classList.remove("jerk");
        this.state.uis.hud.self.classList.remove("jerk");

        super.hide();
    }

    #draw = (t) => {
        this.state.uis.hud.updateBestTime(t);

        const width = this.self.width;
        const height = this.self.height;

        this.#time = t / 1000;

        this.#currentDeathTime += 1;

        if (this.#time >= this.#nextTime) {
            let { x, y } = this.#getLitPixel();

            if (this.#nextPixel == 0) {
                this.#hasMissedPixel = false;
                this.#previousUserPixelIdx = -1;
            }

            if (this.#pixels[x][y].isUserPixel) {
                const selectedColor = this.state.uis.hud.selectedColor;

                let correctColor = this.#pixelAtIdx(
                    pixelIdxFromCoord([x, y]) - 1
                ).color;

                if (this.#hasMissedPixel) {
                    this.#hasMissedPixel = false;
                    this.#pixels[x][y].color = [0, 0, 0];

                    this.state
                        .getAudio("whitenoise")
                        .volume(1)
                        .play()
                        .stopAfter(200);

                    this.state.uis.hud.selectedColor = null;
                } else {
                    if (
                        selectedColor != null &&
                        selectedColor[0] == correctColor[0] &&
                        selectedColor[1] == correctColor[1] &&
                        selectedColor[2] == correctColor[2]
                    ) {
                        this.#pixels[x][y].color = correctColor;
                        this.#currentDeathTime = 0;
                        this.state.uis.hud.selectedColor = null;
                    } else {
                        const pixelIdx = userPixelIndex(x, y);

                        if (pixelIdx > this.#previousUserPixelIdx) {
                            this.#hasMissedPixel = true;
                            this.#previousUserPixelIdx = pixelIdx;
                        }

                        this.state.getAudio("miss").play();
                        this.#pixels[x][y].color = [128, 128, 128];
                        this.#currentDeathTime += 50;
                        this.state.uis.hud.selectedColor = null;
                    }
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

                const next = userPixels[this.#previousUserPixelIdx + 1];

                const drawLine = (x0, y0, x1, y1) => {
                    for (let i = 0; i < DIV; i++) {
                        let p = (i + 1) / DIV;

                        let [tx, ty] = [0, 0];

                        if (
                            next != undefined &&
                            pixel.isUserPixel &&
                            this.#hasMissedPixel &&
                            this.#nextPixel == pixelIdxFromCoord([x, y]) &&
                            next[0] == x &&
                            next[1] == y
                        ) {
                            [tx, ty] = transform(
                                random(-1, 2) + (x1 - x0) * p,
                                -random(-1, 2) - (y0 - y1) * -p
                            );
                        } else {
                            [tx, ty] = transform(
                                x0 + (x1 - x0) * p,
                                y0 + (y1 - y0) * p
                            );
                        }

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

                if (pixel.isUserPixel) {
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
        sortPixels();

        this.state.uis.hud.addNewColor();

        this.self.classList.add("jerk");
        this.state.uis.hud.self.classList.add("jerk");

        this.state.uis.hud.show();

        this.#currentAnimationCb = requestAnimationFrame(this.#draw);

        this.#colorGen = this.state.uis.hud.colorGenerator(5, 9);

        super.show();
    }
}
