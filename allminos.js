class Vec2 {
    constructor(x, y) {
        if (x instanceof Vec2) {
            this.x = x.x;
            this.y = x.y;
        } else if (Array.isArray(x)) {
            this.x = x[0];
            this.y = x[1];
        } else {
            this.x = x;
            this.y = y;
        }
    }

    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    flipX() {
        return new Vec2(-this.x, this.y);
    }

    flipY() {
        return new Vec2(this.x, -this.y);
    }

    neg() {
        return new Vec2(-this.x, -this.y);
    }

    rotate(angle) {
        angle = angle % 4;
        if (angle == 0) {
            return new Vec2(this);
        } else if (angle == 1) {
            return new Vec2(this.y, -this.x);
        } else if (angle == 2) {
            return this.neg();
        } else {
            return new Vec2(-this.y, this.x);
        }
    }

    isEq(other) {
        return this.x == other.x && this.y == other.y;
    }
}

function minosStr(minos) {
    return minos.map(x => `${x.x}${x.y}`).join("");
}

class Polymino {
    constructor(minos = [], color) {
        this.minos = minos;
        this.allSymmetrical = false;
        this.toCanonical();
    }

    clone() {
        return new Polymino([...this.minos.map(x => new Vec2(x))]);
    }

    toCanonical() {
        let bestLexic = "";
        let bestMinos;
        let count = 0;
        for (let r = 0; r < 4; r++) {
            let minos = this.minos.map(x => x.rotate(r));

            let leastX = Infinity;
            let leastY = Infinity;
            for (let mino of minos) {
                if (mino.x < leastX) leastX = mino.x;
                if (mino.y < leastY) leastY = mino.y;
            }
            let least = new Vec2(leastX, leastY);

            minos = minos.map(x => x.add(least.neg()));

            let centerX = 0;
            let centerY = 0;
            for (let mino of minos) {
                centerX += mino.x;
                centerY += mino.y;
            }
            let center = new Vec2(Math.round(centerX / minos.length), Math.round(centerY / minos.length));

            minos = minos.map(x => x.add(center.neg()));

            minos = minos.sort((a, b) =>
                a.x > b.x ? 1 :
                    a.x < b.x ? -1 :
                        a.y > b.y ? 1 : -1
            );

            let lexic = minosStr(minos);
            if (lexic > bestLexic) {
                bestLexic = lexic;
                bestMinos = minos;
            } else if (lexic == bestLexic) count++;
        }

        this.minos = bestMinos;
        this.allSymmetrical = count == 3;
    }

    isEq(other) {
        if (this.minos.length != other.minos.length) return false;
        for (let i = 0; i < this.minos.length; i++) {
            if (!this.minos[i].isEq(other.minos[i])) return false;
        }
        return true;
    }

    add(newMino) {
        if (this.minos.some(x => x.isEq(newMino))) return false;
        this.minos.push(newMino);
        this.toCanonical();
        return true;
    }

    setId(n, id) {
        return this.id = [n, id];
    }
}

const DIRS = [new Vec2(1, 0), new Vec2(0, 1), new Vec2(-1, 0), new Vec2(0, -1)];

const nMinos = [
    [],
    [new Polymino([new Vec2(0, 0)])]
];

const MAX_N = 10;

for (let n = 2; n <= MAX_N + 1; n++) {
    let lastPolyminos = nMinos[n - 1];
    for (let i = 0; i < lastPolyminos.length; i++) {
        lastPolyminos[i].color = `hsl(${Math.round(360 * prng(n - 1 + prng(i)))}, 60%, 60%)`;
        lastPolyminos[i].setId(n - 1, i);
    }
    if (n > MAX_N) break;

    nMinos.push([]);
    let lookup = new Set();
    for (const polymino of lastPolyminos) {
        for (const mino of polymino.minos) {
            for (const offset of DIRS) {
                let newPolymino = polymino.clone();

                let newMino = mino.add(offset);
                if (!newPolymino.add(newMino)) continue;

                let lex = minosStr(newPolymino.minos);
                if (!lookup.has(lex)) {
                    lookup.add(lex);
                    nMinos[n].push(newPolymino);
                }
            }
        }
    }
}

// mulberry
function prng(a) {
    a = a * 429496;
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function selectBlock(index) {
    const LEVEL_INTERVAL = 50;
    const MID_DISTRIBUTION = [11, 18, 12, 6, 2, 1, 1];
    const MID_SCORE = 20 * LEVEL_INTERVAL;
    const exponent = 0.8 * (3 * index / MID_SCORE - 1);

    const cumulativeDistribution = [];
    let sum = 0;
    for (let i = 0; i < 7; i++) {
        const r = (exponent > 0 ? Math.pow(i - 1, exponent) : 1);
        if (i < 2) {
            sum += MID_DISTRIBUTION[i];
        } else {
            const start = (i - 2) * LEVEL_INTERVAL;
            const x = (index - start) / (MID_SCORE - start);
            sum += MID_DISTRIBUTION[i] * r * 2 * (x < 0 ? 0 : x / (1 + x));
        }
        cumulativeDistribution.push(sum);
    }
    
    let rng = Math.random() * sum;
    for (let i = 0; i < 7; i++) {
        if (rng > cumulativeDistribution[i]) continue;
        let selectFrom = i == 0 ? nMinos.slice(0, 5).flat() : nMinos[i + 4];
        return selectFrom[Math.floor(Math.random() * selectFrom.length)];
    }
}