import { Canvas } from "./canvas.js";
import Animate, { EASINGS } from "./utils/animate.js";
import { displayTimer } from "./utils/util.js";

export class HasState {
    state;

    constructor(state) {
        this.state = state;
    }
}

const id = document.getElementById.bind(document);
const query = document.querySelector.bind(document);

export const Ui = (id) =>
    class extends HasState {
        static ID = id;
        #self = null;
        #listeners = [];

        get self() {
            if (this.#self == null) this.#self = query(`[data-ui='${id}']`);
            return this.#self;
        }

        get id() {
            return this.constructor.ID;
        }

        dataHidden(on) {
            if (on) this.self.setAttribute("data-hidden", "");
            else this.self.removeAttribute("data-hidden");
        }

        show() {
            this.dataHidden(false);
        }
        hide() {
            this.removeAllListeners();
            this.dataHidden(true);
        }

        addEventListener(type, cb) {
            this.addListener(this, type, cb);
        }

        addListener(element, type, cb) {
            element.addEventListener(type, cb);
            this.#listeners.push({ element, type, cb });
        }

        removeAllListeners() {
            for (const listener of this.#listeners) {
                listener.element.removeEventListener(
                    listener.type,
                    listener.cb
                );
            }
        }
    };

export class ClickToPlay extends Ui("clickToPlay") {
    show() {
        this.addListener(this.self, "click", () => {
            this.state.changeToUi("titleScreen");
        });
        super.show();
    }
}

export class TitleScreen extends Ui("titleScreen") {
    #holdToQuit = id("click-to-quit");
    #howToPlay = id("how-to-play");
    #start = id("start");

    #bestTime = id("best-time");

    #humAudio = null;

    hide(to) {
        if (to == Canvas.ID) {
            this.#setButtonsDisabled(true);

            new Animate(this.self)
                .from({ scale: 1 })
                .to({ scale: 10 })
                .duration(0) //6000
                .easing(EASINGS.QUART_IN_OUT)
                .begin();

            return new Promise((res) => {
                new Animate(this.self)
                    .from({ opacity: 1 })
                    .to({ opacity: 0 })
                    .duration(0) // 4000
                    .easing(EASINGS.CUBIC_IN_OUT)
                    .begin()
                    .then(() => {
                        super.hide();
                        this.#setButtonsDisabled(false);
                        res();
                    });
            });
        } else {
            super.hide();
        }
    }

    #setButtonsDisabled(disabled) {
        this.#holdToQuit.disabled = disabled;
        this.#howToPlay.disabled = disabled;
        this.#start.disabled = disabled;
    }

    show() {
        this.#listenForQuit();
        this.#listenForHowToPlay();
        this.#listenForStart();

        const fromStart =
            this.state.previousUiId == (ClickToPlay.ID || Canvas.ID);

        if (fromStart) {
            this.state.getAudio("monitorStartup").play();
            this.#humAudio = this.state.getAudio("hum").loop().play();
        }

        this.self.style.opacity = 0;
        this.#setButtonsDisabled(true);

        this.dataHidden(false);

        this.#bestTime.replaceChildren(
            document.createTextNode(displayTimer(this.state.bestTime))
        );

        new Animate(this.self)
            .from({ opacity: 0, scale: 2 })
            .to({ opacity: 1, scale: 1 })
            .duration(fromStart ? 4000 : 0)
            .easing(EASINGS.CUBIC_IN_OUT)
            .begin()
            .then(() => {
                this.#setButtonsDisabled(false);
            });
    }

    #listenForHowToPlay() {
        this.addListener(this.#howToPlay, "click", () => {
            this.state.changeToUi("howToPlay");
        });
    }

    #listenForQuit() {
        this.addListener(this.#holdToQuit, "cancelled", () =>
            this.state.uis.dyingNoise.reset()
        );

        this.addListener(this.#holdToQuit, "progress", (e) => {
            this.state.uis.dyingNoise.setDeathProgress(e.detail);
        });
        this.addListener(this.#holdToQuit, "completed", () => {
            this.#humAudio?.stop();
            this.state.uis.dyingNoise.reset();
            this.state.getAudio("monitorShutdown").play();
            this.state.changeToUi("clickToPlay");
        });
    }

    #listenForStart() {
        this.addListener(this.#start, "click", () => {
            this.state.changeToUi("canvas");
        });
    }
}

export class HowToPlay extends Ui("howToPlay") {
    #back = id("back");

    show() {
        this.#listenForBack();
        super.show();
    }

    #listenForBack() {
        this.addListener(this.#back, "click", () =>
            this.state.changeTopreviousUi()
        );
    }
}

export class DyingNoise extends Ui("dyingNoise") {
    #noise = this.state.getAudio("whitenoise").loop().volume(0).play();

    setDeathProgress(progress) {
        this.self.style.opacity = `${progress}%`;
        this.#noise.volume(Math.max(Math.min(progress / 100, 100), 0));
    }

    reset() {
        this.self.style.opacity = 0;
        this.#noise.volume(0);
    }

    hide() {}
    show() {}
}
