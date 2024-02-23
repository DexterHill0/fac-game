export default class Audio {
    #src = "";
    #opts = {};

    constructor(src) {
        this.#src = src;
    }

    loop() {
        this.#opts.loop = true;
        return this;
    }

    wait(duration) {
        this.#opts.wait = duration;
        return this;
    }

    play() {
        const play = () => {
            const audio = new window.Audio(this.#src);
            audio.loop = this.#opts.loop;
            audio.play();
        };

        if (this.#opts.wait != null) {
            setTimeout(play, this.#opts.wait);
        } else {
            play();
        }
    }
}
