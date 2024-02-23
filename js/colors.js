export const STARTING_COLS = [
    {
        color: "#ff0000",
        key: "1",
    },
    {
        color: "#00ff00",
        key: "1",
    },
    {
        color: "#00ff00",
        key: "1",
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
