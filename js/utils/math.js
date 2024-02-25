export const map = (x, a, b, c, d) => ((x - a) / (b - a)) * (d - c) + c;

export const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const easeInExpo = (x) => {
    return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
};

export const easeInQuart = (x) => {
    return x * x * x * x;
};

export const wrap = (x, min, max) => {
    return x - Math.floor((x - min) / (max - min)) * (max - min);
};
