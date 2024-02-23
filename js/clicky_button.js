import Audio from "./utils/audio.js";

export class ClickyButton extends HTMLButtonElement {
    #innerButton = null;
    #isDisabled = false;
    #isActive = false;

    constructor() {
        super();
    }

    get disabled() {
        return this.#isDisabled;
    }

    set disabled(val) {
        if (val) {
            this.#isDisabled = true;
        } else {
            this.#isDisabled = false;
        }

        this.#update();
    }

    #update() {
        if (this.#isDisabled) this.#innerButton.setAttribute("disabled", "");
        else this.#innerButton.removeAttribute("disabled");
    }

    // using arrow functions because otherwise `this` is the wrong value
    #pressStart = () => {
        if (!this.#isDisabled) {
            this.#innerButton.setAttribute("active", "true");
            this.#isActive = true;

            new Audio(
                "../assets/sounds/412050__eyenorth__button-click_down.wav"
            ).play();
        }
    };

    #pressEnd = () => {
        if (!this.#isDisabled && this.#isActive) {
            this.#innerButton.setAttribute("active", "false");
            this.#isActive = false;

            new Audio(
                "../assets/sounds/412050__eyenorth__button-click_up.wav"
            ).play();
        }
    };

    #hoverStart = () => {
        if (!this.#isDisabled) {
            this.#innerButton.setAttribute("hover", "true");

            new Audio(
                "../assets/sounds/540269__zepurple__hover-over-a-button.wav"
            ).play();
        }
    };

    #hoverEnd = () => {
        if (!this.#isDisabled) this.#innerButton.setAttribute("hover", "false");
    };

    connectedCallback() {
        const button = document.createElement("button");
        button.classList.add("clicky-button");
        button.id = this.id;

        button.addEventListener("pointerdown", this.#pressStart);
        document.addEventListener("pointerup", this.#pressEnd);
        button.addEventListener("mouseenter", this.#hoverStart);
        button.addEventListener("mouseout", this.#hoverEnd);

        button.appendChild(this.childNodes[0]);

        this.#innerButton = button;

        this.#update();

        this.appendChild(button);
    }

    attributeChangedCallback(name, _oldValue, newValue) {
        if (name == "disabled") {
            this.#isDisabled = newValue;
        }

        this.#update();
    }

    static get observedAttributes() {
        return ["disabled"];
    }
}

customElements.define("clicky-button", ClickyButton, { extends: "button" });
