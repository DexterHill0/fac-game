import Animate, { EASINGS } from "./utils/animate.js";
import Audio from "./utils/audio.js";

// script is loaded with `defer` which means it will load *after* the dom, so the elements must exist
const titleScreen = document.querySelector("[data-ui='title_screen']");
const holdToQuit = document.getElementById("click-to-quit");
const dyingNoise = document.querySelector(".dying-noise");
const startButton = document.getElementById("click-to-begin");

export const showTitleScreen = () => {
    new Audio(
        "../assets/sounds/415594__corkob__crt-computer-monitor-startup_shortened.wav"
    ).play();

    new Audio(
        "../assets/sounds/721295__timbre__loopable-60hz-synthesized-domestic-video-artifact-vcr-crt-buzz-hum.flac"
    )
        .loop()
        .playAfter(800);

    new Animate(titleScreen)
        .from({ opacity: 0 })
        .to({ opacity: 1 })
        .duration(4000)
        .easing(EASINGS.CUBIC_IN_OUT)
        .begin();

    titleScreen.removeAttribute("data-hidden");

    listenForQuit();
};

const listenForQuit = () => {
    let whiteNoise = null;

    holdToQuit.addEventListener("start", () => {
        whiteNoise = new Audio(
            "../assets/sounds/249313__jarredgibb__white-noise-20dbfs-30-second.wav"
        )
            .loop()
            .volume(0)
            .play();
    });

    const reset = () => {
        dyingNoise.style.opacity = 0;
        whiteNoise.stop();
        whiteNoise = null;
    };

    holdToQuit.addEventListener("cancelled", reset);

    holdToQuit.addEventListener("progress", (e) => {
        dyingNoise.style.opacity = `${e.detail}%`;
        whiteNoise.volume(e.detail / 100);
    });
    holdToQuit.addEventListener("completed", () => {
        reset();

        titleScreen.setAttribute("data-hidden", "");
        startButton.removeAttribute("data-hidden");
    });
};
