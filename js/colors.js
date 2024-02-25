import { random } from "./utils/math.js";
import { displayTimer } from "./utils/util.js";
import { Ui } from "./uis.js";

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

    #usedColors = [];
    colors = [...STARTING_COLS];
    #colButtons = Array(5)
        .fill(null)
        .map((_, i) => document.getElementById(`color-${i + 1}`));

    selectedColor = null;

    hide() {
        super.hide();

        for (let i = STARTING_COLS.length; i < this.colors.length; i++) {
            this.#colButtons[i].children[1].replaceChildren(
                document.createTextNode("???")
            );
        }

        this.#usedColors = [];
        this.colors = [...STARTING_COLS];
        this.selectedColor = null;
    }

    addNewColor() {
        let index = -1;
        while (true) {
            index = random(0, EXTRA_COLS.length - 1);
            if (!this.#usedColors.includes(index)) break;
        }

        this.#usedColors.push(index);
        this.colors.push(EXTRA_COLS[index]);

        console.log(this.colors);

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
        this.state.bestTime = time;

        this.#bestTime.replaceChildren(
            document.createTextNode(displayTimer(time))
        );
    }
}
