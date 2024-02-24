import Animate, { EASINGS } from "./utils/animate.js";
import Audio from "./utils/audio.js";
import { HasState } from "./state.js";

const id = document.getElementById.bind(document);
const query = document.querySelector.bind(document);

const Ui = (id) =>
    class _Inner extends HasState {
        static ID = id;
        #self = null;

        get self() {
            if (this.#self == null) this.#self = query(`[data-ui='${id}']`);
            return this.#self;
        }

        get id() {
            return _Inner.ID;
        }

        dataHidden(on) {
            if (on) this.self.setAttribute("data-hidden", "");
            else this.self.removeAttribute("data-hidden");
        }

        show() {
            this.dataHidden(false);
        }
        hide() {
            this.dataHidden(true);
        }
    };

export class ClickToPlay extends Ui("clickToPlay") {
    constructor(state) {
        super(state);

        this.self.addEventListener("click", () => {
            this.state.changeToUi("titleScreen");
        });
    }
}

export class TitleScreen extends Ui("titleScreen") {
    #dyingNoise = query(".dying-noise");
    #holdToQuit = id("click-to-quit");
    #howToPlay = id("how-to-play");
    #start = id("start");

    constructor(state) {
        super(state);

        this.#listenForQuit();
        this.#listenForHowToPlay();
        this.#listenForStart();
    }

    show() {
        const fromStart = this.state.previousUi.id == "clickToPlay";

        if (fromStart)
            new Audio(
                "../assets/sounds/415594__corkob__crt-computer-monitor-startup_shortened.wav"
            ).play();

        this.state.playingAudio(
            "hum",
            new Audio(
                "../assets/sounds/721295__timbre__loopable-60hz-synthesized-domestic-video-artifact-vcr-crt-buzz-hum.flac"
            )
                .loop()
                .play()
        );

        this.self.style.opacity = 0;
        this.dataHidden(false);

        new Animate(this.self)
            .from({ opacity: 0, scale: 2 })
            .to({ opacity: 1, scale: 1 })
            .duration(fromStart ? 4000 : 0)
            .easing(EASINGS.CUBIC_IN_OUT)
            .begin();
    }

    #listenForHowToPlay() {
        this.#howToPlay.addEventListener("click", () => {
            this.state.changeToUi("howToPlay");
        });
    }

    #listenForQuit() {
        let whiteNoise = null;

        this.#holdToQuit.addEventListener("start", () => {
            whiteNoise = new Audio(
                "../assets/sounds/249313__jarredgibb__white-noise-20dbfs-30-second.wav"
            )
                .loop()
                .volume(0)
                .play();
        });

        const reset = () => {
            this.#dyingNoise.style.opacity = 0;
            whiteNoise.stop();
            whiteNoise = null;
        };

        this.#holdToQuit.addEventListener("cancelled", reset);

        this.#holdToQuit.addEventListener("progress", (e) => {
            this.#dyingNoise.style.opacity = `${e.detail}%`;
            whiteNoise.volume(e.detail / 100);
        });
        this.#holdToQuit.addEventListener("completed", () => {
            reset();

            this.state.stopAllAudio();
            this.state.changeToUi("clickToPlay");
        });
    }

    #listenForStart() {
        this.#start.addEventListener("click", () => {
            this.hide();
        });
    }
}

export class HowToPlay extends Ui("howToPlay") {
    #back = id("back");

    constructor(state) {
        super(state);

        this.#listenForBack();
    }

    #listenForBack() {
        this.#back.addEventListener("click", () =>
            this.state.changeTopreviousUi()
        );
    }
}
