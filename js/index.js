import { showTitleScreen } from "./titlescreen.js";
import Audio from "./utils/audio.js";

const canvas = document.getElementById("canvas");

if (canvas == null) throw Error("canvas is null");

// https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio#correcting_resolution_in_a_canvas
const resizeCanvas = () => {
    const scale = window.devicePixelRatio;
    const dprWidth = Math.floor(window.innerWidth * scale);
    const dprHeight = Math.floor(window.innerHeight * scale);

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    canvas.width = dprWidth;
    canvas.height = dprHeight;
};

window.addEventListener("resize", () => {
    resizeCanvas();
});

resizeCanvas();

const startButton = document.getElementById("click-to-begin");
startButton.addEventListener("click", () => {
    startButton.setAttribute("data-hidden", "");

    showTitleScreen();
});
