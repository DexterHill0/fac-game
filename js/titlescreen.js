import Animate, { EASINGS } from "./utils/animate.js";
import Audio from "./utils/audio.js";

// script is loaded with `defer` which means it will load *after* the dom, so the elements must exist
const titleScreen = document.querySelector("[data-ui='title_screen']");
// const glow = document.getElementById("startup-glow")

export const showTitleScreen = () => {
    new Audio(
        "../assets/sounds/415594__corkob__crt-computer-monitor-startup_shortened.wav"
    ).play();

    new Audio(
        "../assets/sounds/721295__timbre__loopable-60hz-synthesized-domestic-video-artifact-vcr-crt-buzz-hum.flac"
    )
        .loop()
        .wait(800)
        .play();

    new Animate(titleScreen)
        .from({ opacity: 0 })
        .to({ opacity: 1 })
        .duration(4000)
        .easing(EASINGS.CUBIC_IN_OUT)
        .begin();

    titleScreen.removeAttribute("data-hidden");
};
