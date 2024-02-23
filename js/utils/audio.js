export class ActiveAudio {
    #audio = null;

    constructor(audio) {
        this.#audio = audio;
    }

    stop() {
        this.#audio.pause();
        this.#audio.remove();
    }

    volume(volume) {
        this.#audio.volume = volume;
        return this;
    }
}

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

    /**
     *
     * @param {number} volume
     * @returns
     */
    volume(volume) {
        this.#opts.volume = volume;
        return this;
    }

    /**
     *
     * @returns {ActiveAudio}
     */
    play() {
        const audio = new window.Audio(this.#src);
        audio.loop = this.#opts.loop;
        audio.volume = this.#opts.volume ?? 1;
        audio.play();

        return new ActiveAudio(audio);
    }

    /**
     *
     * @returns {Promise<ActiveAudio>}
     */
    playAfter() {
        return new Promise((res) => {
            setTimeout(() => {
                res(this.play());
            }, this.#opts.wait);
        });
    }
}
