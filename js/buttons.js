import Audio from "./utils/audio.js";
import { State } from "./utils/mixins.js";
import { currentState } from "./state.js";

export class ClickyButton extends State(HTMLElement, {
    disabled: false,
    active: false,
    hover: false,
}) {
    innerButton = null;

    constructor() {
        super();
    }

    stateChangedCallback(state, _oldValue, newValue) {
        if (this.innerButton == null) return;

        switch (state) {
            case "disabled":
                if (newValue) this.innerButton.setAttribute("disabled", "");
                else this.innerButton.removeAttribute("disabled");
                break;

            case "active":
                this.innerButton.setAttribute("active", newValue);
                if (newValue) currentState.getAudio("buttonDown").play();
                else currentState.getAudio("buttonUp").play();
                break;

            default:
                this.innerButton.setAttribute(state, newValue);
        }
    }

    // using arrow functions because otherwise `this` is the wrong value
    #pressStart = () => {
        if (!this.disabled) this.active = true;
    };

    #pressEnd = () => {
        if (!this.disabled && this.active) this.active = false;
    };

    #hoverStart = () => {
        if (!this.disabled) {
            this.hover = true;

            currentState.getAudio("buttonHover").play();
        }
    };

    #hoverEnd = () => {
        if (!this.disabled) this.hover = false;
    };

    connectedCallback() {
        const button = document.createElement("button");
        button.classList.add("clicky-button");

        button.addEventListener("pointerdown", this.#pressStart);
        document.addEventListener("pointerup", this.#pressEnd);
        button.addEventListener("mouseenter", this.#hoverStart);
        button.addEventListener("mouseout", this.#hoverEnd);

        for (const child of this.childNodes) {
            button.appendChild(child);
        }

        this.innerButton = button;

        this.appendChild(button);

        // re triggers the callback
        this.disabled = this.disabled;
    }

    attributeChangedCallback(name, _oldValue, newValue) {
        if (name == "disabled") {
            this.disabled = newValue;
        }
    }

    static get observedAttributes() {
        return ["disabled"];
    }
}
customElements.define("clicky-button", ClickyButton);

export class ClickyHoldButton extends ClickyButton {
    #interval = null;
    #currentHold = 0;
    #holdDuration = 0;

    constructor() {
        super();

        this.#holdDuration = parseInt(this.getAttribute("hold-duration"));
    }

    stateChangedCallback(state, oldValue, newValue) {
        super.stateChangedCallback(state, oldValue, newValue);

        const reset = () => {
            this.#currentHold = 0;
            cancelAnimationFrame(this.#interval);
            this.innerButton.style.background = "transparent";
        };

        if (this.active && this.hover) {
            reset();

            this.dispatchEvent(new CustomEvent("start"));

            let startTime = 0;

            const hold = (t) => {
                if (!this.active || !this.hover) {
                    reset();
                    this.dispatchEvent(new CustomEvent("cancelled"));
                    return;
                }

                let elapsed = t - startTime;

                if (elapsed > this.#holdDuration) {
                    reset();
                    this.active = false;
                    this.dispatchEvent(new CustomEvent("completed"));
                    return;
                }

                const percent = (elapsed / this.#holdDuration) * 100;
                this.innerButton.style.background = `linear-gradient(90deg, #fff ${percent}%, transparent ${percent}%)`;

                this.dispatchEvent(
                    new CustomEvent("progress", { detail: percent })
                );

                this.#interval = requestAnimationFrame(hold);
            };

            this.#interval = requestAnimationFrame((t) => {
                startTime = t;
                hold(t);
            });
        } else if ((!this.active || !this.hover) && this.#currentHold > 0) {
            this.dispatchEvent(new CustomEvent("cancelled"));
            reset();
        }
    }

    connectedCallback() {
        super.connectedCallback();
    }
}

customElements.define("clicky-hold-button", ClickyHoldButton);
