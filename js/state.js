import { Canvas } from "./canvas.js";
import { Colors } from "./hud.js";
import { ClickToPlay, DyingNoise, HowToPlay, TitleScreen } from "./uis.js";
import AudioPlayer, { AudioSource } from "./utils/audio.js";

export class GameState {
    #currentUi = null;
    #previousUi = null;

    bestTime = localStorage.getItem("bestTime") ?? 0;

    #audios = {
        whitenoise: new AudioSource(
            "../assets/sounds/249313__jarredgibb__white-noise-20dbfs-30-second.wav"
        ),
        hum: new AudioSource(
            "../assets/sounds/721295__timbre__loopable-60hz-synthesized-domestic-video-artifact-vcr-crt-buzz-hum.flac"
        ),
        monitorStartup: new AudioSource(
            "../assets/sounds/415594__corkob__crt-computer-monitor-startup_shortened.wav"
        ),
        buttonDown: new AudioSource(
            "../assets/sounds/412050__eyenorth__button-click_down.wav"
        ),
        buttonUp: new AudioSource(
            "../assets/sounds/412050__eyenorth__button-click_up.wav"
        ),
        buttonHover: new AudioSource(
            "../assets/sounds/540269__zepurple__hover-over-a-button.wav"
        ),
        beep: new AudioSource(
            "../assets/sounds/504761__lartti__hiss-and-beep.wav"
        ),
        monitorShutdown: new AudioSource(
            "../assets/sounds/519981__timbre__simulated-crt-tv-power-offon-remix-of-freesound-519627.wav"
        ),
        miss: new AudioSource("../assets/sounds/483598__raclure__wrong.wav"),
    };

    uis = {
        [ClickToPlay.ID]: new ClickToPlay(this),
        [TitleScreen.ID]: new TitleScreen(this),
        [HowToPlay.ID]: new HowToPlay(this),
        [Canvas.ID]: new Canvas(this),
        [DyingNoise.ID]: new DyingNoise(this),
        [Colors.ID]: new Colors(this),
    };

    constructor() {
        this.#currentUi = this.uis.titleScreen;
        this.#previousUi = this.#currentUi;

        this.#currentUi.show();
    }

    get currentUiId() {
        return this.#currentUi.id;
    }

    get previousUiId() {
        return this.#previousUi.id;
    }

    async changeToUi(id) {
        this.#previousUi = this.#currentUi;

        await this.#currentUi.hide(id);

        this.#currentUi = this.uis[id];

        await this.#currentUi.show();
    }

    changeTopreviousUi() {
        this.changeToUi(this.#previousUi.id);
    }

    /**
     *1
     * @returns {AudioPlayer}
     */
    getAudio(id) {
        return this.#audios[id].getAudio();
    }

    saveBestTime() {
        localStorage.setItem("bestTime", this.bestTime);
    }
}

/** @type {GameState} */
export let currentState = null;

document.addEventListener("DOMContentLoaded", () => {
    currentState = new GameState();
});
