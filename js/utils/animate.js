export const EASINGS = {
    SINE_IN: "cubic-bezier(0.12, 0, 0.39, 0)",
    SINE_OUT: "cubic-bezier(0.61, 1, 0.88, 1)",
    SINE_IN_OUT: "ease-in-out",
    CUBIC_IN_OUT: "cubic-bezier(0.65, 0, 0.35, 1)",
    BACK_IN_OUT: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
    QUART_IN_OUT: "cubic-bezier(0.76, 0, 0.24, 1)",
    QUAD_OUT: "cubic-bezier(0.5, 1, 0.89, 1)",
    QUAD_IN: "cubic-bezier(0.11, 0, 0.5, 0)",
};

export const FILL = {
    FORWARDS: "forwards",
};

export default class Animate {
    #elem = null;
    #from = null;
    #to = null;
    #ops = {
        easing: EASINGS.SINE_IN_OUT,
        duration: 0,
        iterations: 1,
        fill: FILL.FORWARDS,
    };
    #initial = null;
    #after = [];
    #keyframes = [];

    /**
     *
     * @param {Element} elem
     */
    constructor(elem) {
        this.#elem = elem;
    }

    /**
     *
     * @param {Element} elem
     */
    setElem(elem) {
        this.#elem = elem;
    }

    /**
     *
     * @param {string | string[]} props
     * @returns
     */
    fromInitial(props) {
        if (typeof props == "string") {
            this.#keyframes.unshift({
                [props]: getComputedStyle(this.#elem)[props],
            });
        } else {
            const initial = {};
            for (let key of props) {
                initial[key] = getComputedStyle(this.#elem)[key];
            }
            this.#keyframes.unshift({ ...initial });
        }

        return this;
    }

    keyframe(definition) {
        this.#keyframes.push(definition);
        return this;
    }

    /**
     *
     * @param {number} duration
     * @returns
     */
    duration(duration) {
        this.#ops.duration = duration;
        return this;
    }

    /**
     *
     * @param {number} count
     * @returns
     */
    repeat(count) {
        this.#ops.iterations = count;
        return this;
    }

    /**
     *
     * @param {keyof FILL} fill
     * @returns
     */
    fill(fill) {
        this.#ops.fill = fill;
        return this;
    }

    /**
     *
     * @param {keyof EASINGS} easing
     * @returns
     */
    easing(easing) {
        this.#ops.easing = easing;
        return this;
    }

    /**
     *
     * @param {number} duration
     * @param {Animate | Animate[]} anims
     */
    chainAfter(duration, anims) {
        if (anims instanceof Animate) {
            this.#after.push({
                dur: duration,
                cb: () => {
                    anims.begin();
                },
            });
        } else {
            for (let anim of anims) {
                this.#after.push({
                    dur: duration,
                    cb: () => {
                        anim.begin();
                    },
                });
            }
        }
    }

    reverse() {
        this.#keyframes.reverse();
        return this;
    }

    begin() {
        if (this.#elem != null) {
            const slf = this;
            return new Promise((res) => {
                const anim = this.#elem.animate(this.#keyframes, {
                    duration: this.#ops.duration,
                    easing: this.#ops.easing,
                    iterations: this.#ops.iterations,
                    fill: this.#ops.fill,
                });

                anim.addEventListener("finish", () => res(slf));
                anim.addEventListener("cancel", () => res(slf));
                anim.addEventListener("remove", () => res(slf));
            });
        }
        for (let after of this.#after) {
            setTimeout(after.cb, after.dur);
        }
    }

    /**
     * @returns {Element | null}
     */
    get element() {
        return this.#elem;
    }
}
