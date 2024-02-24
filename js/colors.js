import { random } from "./utils/math.js";
import { Ui } from "./uis.js";

const TOTAL_COLS = 5;

export const STARTING_COLS = [
    {
        color: [255, 0, 0],
        key: "1",
    },
    {
        color: [0, 255, 0],
        key: "2",
    },
    {
        color: [0, 0, 255],
        key: "3",
    },
];

export function* getRandomColor(minColors, maxColours) {
    while (true) {
        let amount = random(minColors, maxColours);

        let color = STARTING_COLS[random(0, STARTING_COLS.length - 1)].color;

        for (let i = 0; i < amount; i++) {
            yield color;
        }
    }
}

export class Colors extends Ui("colorsHud") {
    colors = STARTING_COLS;
    #colButtons = Array(5)
        .fill(null)
        .map((_, i) => document.getElementById(`color-${i + 1}`));

    selectedColor = null;

    constructor(state) {
        super(state);
    }

    onReady() {
        document.addEventListener("keydown", (e) => {
            if (parseInt(e.key) <= this.colors.length) {
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
}
