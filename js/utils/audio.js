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

export class AudioSource {
    #audio;

    constructor(src) {
        this.#audio = new window.Audio(src);
    }

    /**
     * @return {Audio}
     */
    getAudio() {
        return new AudioPlayer(this.#audio.cloneNode());
    }
}

export default class AudioPlayer {
    #audio;

    constructor(audio) {
        this.#audio = audio;
    }

    loop() {
        this.#audio.loop = true;
        return this;
    }

    /**
     *
     * @param {number} volume
     * @returns
     */
    volume(volume) {
        this.#audio.volume = volume;
        return this;
    }

    /**
     *
     * @returns {ActiveAudio}
     */
    play() {
        this.#audio.play();

        return new ActiveAudio(this.#audio);
    }

    /**
     *
     * @param {number} time
     * @returns {Promise<ActiveAudio>}
     */
    playAfter(time) {
        return new Promise((res) => {
            setTimeout(() => {
                res(this.play());
            }, time);
        });
    }
}
