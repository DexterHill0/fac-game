import { ClickToPlay, HowToPlay, TitleScreen } from "./uis.js";

export class HasState {
    state;

    constructor(state) {
        this.state = state;
    }
}

export class GameState {
    #currentUi = null;
    #previousUi = null;

    constructor() {
        this.uis = {
            [ClickToPlay.ID]: new ClickToPlay(this),
            [TitleScreen.ID]: new TitleScreen(this),
            [HowToPlay.ID]: new HowToPlay(this),
        };

        this.#currentUi = this.uis.clickToPlay;
        this.#previousUi = this.#currentUi;

        this.#currentUi.show();
    }

    changeToUi(id) {
        this.#previousUi = this.#currentUi;

        this.#currentUi.hide();

        this.#currentUi = this.uis[id];

        this.#currentUi.show();
    }

    previousUi() {
        this.changeToUi(this.#previousUi.id);
    }
}

// export const currentState = new GameState();

document.addEventListener("DOMContentLoaded", () => {
    new GameState();
});
