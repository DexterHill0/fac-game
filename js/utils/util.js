export const displayTimer = (millis) => {
    if (millis == null) return "--:--";

    const t = millis / 1000;

    const mins = Math.floor(t / 60);
    const secs = Math.floor(t - mins * 60);
    const mils = Math.floor(millis % 1000);

    return `${mins >= 10 ? "" : "0"}${mins}:${
        secs >= 10 ? "" : "0"
    }${secs}.${mils}`;
};
