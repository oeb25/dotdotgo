export const colors = {
    red: '#EB5757',
    green: '#27AE60',
    blue: '#2F80ED',
    yellow: '#F2994A',
    white: '#F2F2F2'
}

export const lerpify = (fn: (number) => number) => (a: number, t: number, b: number) => a + fn(t) * (b - a)

export const curves = {
    lerp: lerpify(t => t),

    cosMod: lerpify(t => (1 - Math.cos(t * Math.PI)) / 2)
}

export const rand = (min: number, max: number) => Math.random() * (max - min) + min
export function chooseRand<A>(xs: A[]) { return xs[Math.floor(rand(0, xs.length))] }
export const randValue = (obj) => obj[chooseRand(Object.keys(obj))]