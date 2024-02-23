import { ClickToPlay, HowToPlay, TitleScreen } from "./uis.js";
import Audio, { ActiveAudio } from "./utils/audio.js";

export class HasState {
    state;

    constructor(state) {
        this.state = state;
    }
}

export class GameState {
    #currentUi = null;
    previousUi = null;

    #audios = {};

    constructor() {
        this.uis = {
            [ClickToPlay.ID]: new ClickToPlay(this),
            [TitleScreen.ID]: new TitleScreen(this),
            [HowToPlay.ID]: new HowToPlay(this),
        };

        this.#currentUi = this.uis.clickToPlay;
        this.previousUi = this.#currentUi;

        this.#currentUi.show();
    }

    changeToUi(id) {
        this.previousUi = this.#currentUi;

        this.#currentUi.hide();

        this.#currentUi = this.uis[id];

        this.#currentUi.show();
    }

    changeTopreviousUi() {
        this.changeToUi(this.previousUi.id);
    }

    /**
     *
     * @param {string} id
     * @param {ActiveAudio | Promise<ActiveAudio>} audio
     */
    playingAudio(id, audio) {
        if (this.#audios[id] != undefined) this.#audios[id].stop();
        this.#audios[id] = audio;
    }

    /**
     *
     * @param {string} id
     */
    stopAudio(id) {
        this.#audios[id]?.stop();
    }

    stopAllAudio() {
        for (const audio of Object.values(this.#audios)) {
            if (audio instanceof Promise) audio.then((a) => a.stop());
            else audio.stop();
        }
    }
}

// export const currentState = new GameState();

document.addEventListener("DOMContentLoaded", () => {
    new GameState();
});
