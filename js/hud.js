import { random } from "./utils/math.js";
import { displayTimer } from "./utils/util.js";
import { Ui } from "./uis.js";
import Animate, { EASINGS } from "./utils/animate.js";

const EXTRA_COLS = [
    [255, 0, 255],
    [0, 255, 255],
    [255, 255, 0],
    [255, 255, 255],
];

const STARTING_COLS = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
];

function* colorGenerator(minColors, maxColours, colors) {
    while (true) {
        let amount = random(minColors, maxColours);

        let color = colors[random(0, colors.length - 1)];

        for (let i = 0; i < amount; i++) {
            yield color;
        }
    }
}

export class Colors extends Ui("hud") {
    #bestTime = document.getElementById("hud-best-time");
    #currentTime = 0;

    #dontPress = document.getElementById("hud-dont-press");

    #usedColors = [];
    colors = [...STARTING_COLS];
    #colButtons = Array(5)
        .fill(null)
        .map((_, i) => document.getElementById(`color-${i + 1}`));

    selectedColor = null;

    hide() {
        super.hide();

        if (this.#currentTime > this.state.bestTime) {
            this.state.bestTime = this.#currentTime;
            this.state.saveBestTime();
        }

        for (let i = STARTING_COLS.length; i < this.colors.length; i++) {
            this.#colButtons[i].children[1].replaceChildren(
                document.createTextNode("???")
            );
        }

        this.#usedColors = [];
        this.colors = [...STARTING_COLS];
        this.selectedColor = null;
        this.#currentTime = 0;
    }

    addNewColor() {
        let index = -1;
        while (true) {
            index = random(0, EXTRA_COLS.length - 1);
            if (!this.#usedColors.includes(index)) break;
        }

        this.#usedColors.push(index);
        this.colors.push(EXTRA_COLS[index]);

        this.#updateButton(this.colors.length - 1);
    }

    #updateButton(index) {
        const button = this.#colButtons[index];

        button.removeAttribute("data-locked");
        button.style.cssText = `--color: rgb(${this.colors[index].join(",")})`;
        button.children[1].replaceChildren(document.createTextNode(index + 1));
    }

    show() {
        super.show();

        window.addEventListener("keydown", (e) => {
            if (parseInt(e.key) <= this.colors.length && !e.repeat) {
                this.#onSelectedColor(parseInt(e.key));
            }
        });

        for (let i = 1; i <= this.#colButtons.length; i++) {
            this.#colButtons[i - 1].addEventListener("click", () => {
                if (i <= this.colors.length) this.#onSelectedColor(i);
            });
        }
    }

    #onSelectedColor(i) {
        this.state.getAudio("beep").play();

        this.selectedColor = this.colors[i - 1];
    }

    colorGenerator(min, max) {
        return colorGenerator(min, max, this.colors);
    }

    updateBestTime(time) {
        this.#currentTime = time;

        this.#bestTime.replaceChildren(
            document.createTextNode(displayTimer(time))
        );
    }

    dontPressChallenge(enable) {
        if (enable) this.#dontPress.removeAttribute("data-hidden");
        else this.#dontPress.setAttribute("data-hidden", "");
    }

    createChallengeText(text) {
        const px = (x) => `${x}px`;

        const THRESHOLD = 100;

        const p = document.createElement("p");
        p.appendChild(document.createTextNode(text));

        p.style.cssText = `--challenge-text-font-size: ${random(70, 100)}px`;
        p.classList.add("floating-challenge-text");

        document.body.appendChild(p);

        const duration = random(1500, 2500);

        new Animate(p)
            .keyframe({
                left: px(random(0, p.clientWidth)),
            })
            .keyframe({
                left: px(
                    random(
                        window.innerWidth - p.clientWidth - THRESHOLD * 2,
                        window.innerWidth - p.clientWidth
                    )
                ),
            })
            .duration(duration)
            .easing(EASINGS.SINE_IN_OUT)
            .begin();

        new Animate(p)
            .keyframe({
                bottom: 0,
            })
            .keyframe({
                bottom: px(
                    random(
                        THRESHOLD * 2,
                        window.innerHeight / 2 + THRESHOLD * 2
                    )
                ),
            })
            .easing(EASINGS.SINE_OUT)
            .duration(duration / 2)
            .begin()
            .then(() => {
                new Animate(p)
                    .fromInitial("bottom")
                    .keyframe({
                        bottom: 0,
                    })
                    .easing(EASINGS.SINE_IN)
                    .duration(duration / 2)
                    .begin();
            });

        new Animate(p)
            .keyframe({ opacity: 0 })
            .keyframe({ opacity: 1 })
            .keyframe({ opacity: 0 })
            .easing(EASINGS.SINE_IN_OUT)
            .duration(duration - 200)
            .begin()
            .then(() => p.remove());
    }
}
