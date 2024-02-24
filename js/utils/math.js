export const map = (x, a, b, c, d) => ((x - a) / (b - a)) * (d - c) + c;

export const random = (max) => {
    return Math.floor(Math.random() * max);
};
