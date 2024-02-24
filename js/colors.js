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

// make a custom element that stores the colours and displays them
export class Colors extends HTMLUListElement {
    #colors = [];

    /**
     *
     * @param {{ color: string, key: string }} defaultColors
     */
    constructor() {
        super();
    }

    static get observedAttributes() {
        return ["colors"];
    }

    attributeChangedCallback(name, _oldValue, newValue) {
        if (name == "colors") {
            this.#colors = JSON.parse(newValue);
        }
    }
}

customElements.define("hud-colors", Colors, { extends: "ul" });
