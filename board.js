const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 40;
const VISIBLE_BOARD_HEIGHT = 24;
const TILE_SIZE = 30;
const SMALL_TILE_SIZE = 15;

class PieceLocation {
    constructor(polymino, offset, rotation) {
        this.polymino = polymino;
        this.offset = offset;
        this.rotation = rotation;
    }

    minos() {
        let m = this.polymino.minos.map(e => e.rotate(this.rotation));
        let TTT = m.map(e => e.add(this.offset));
        return TTT;
    }

    clone() {
        return new PieceLocation(this.polymino.clone(), new Vec2(this.offset), this.rotation);
    }
}

function spawnLoc(polymino) {
    return new PieceLocation(polymino, new Vec2(Math.floor(BOARD_WIDTH / 2) - 1, VISIBLE_BOARD_HEIGHT - 1 - Math.min(...polymino.minos.map(x => x.y))), 0);
}

class Board {
    constructor(currentPieceLocation, dta = [...Array(BOARD_HEIGHT)].map(_ => Array(BOARD_WIDTH).fill(0))) {
        this.dta = dta;
        this.currentPieceLocation = currentPieceLocation;
    }

    // gets idxs of all lines that *weren't* cleared
    lineClearMask() {
        let mask = [];
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            if (!this.dta[y].every(c => c != 0)) {
                mask.push(y);
            }
        }
        return mask;
    }

    clearLines() {
        let mask = this.lineClearMask();
        let newDta = [];
        let linesCleared = 0;
        for (const m of mask) {
            newDta.push(this.dta[m]);
        }
        for (let m = mask.length; m < BOARD_HEIGHT; m++) {
            linesCleared++;
            newDta.push(Array(BOARD_WIDTH).fill(0));
        }
        this.dta = newDta;
        return linesCleared;
    }

    pushGarbage(idx) {
        let garbageRow = Array(BOARD_WIDTH).fill(0);
        for (let x = 0; x < BOARD_WIDTH; x++)
            garbageRow[x] = -(idx != x);
        this.dta.unshift(garbageRow);
        this.dta.pop();
    }

    placeMinos() {
        for (const mino of this.currentPieceLocation.minos()) {
            this.dta[mino.y][mino.x] = this.currentPieceLocation.polymino.id;
        }
        return this.clearLines();
    }

    obstructed(minos) {
        for (const mino of minos) {
            if (mino.x < 0 || mino.x > BOARD_WIDTH - 1 || mino.y < 0) return true;
            let row = this.dta[mino.y];
            if (!row) throw new Error(`what the flippity fuck is this???? (mino.y = ${mino.y}, row = ${JSON.stringify(row)})\n\n` + JSON.stringify(this.dta));
            else if (row[mino.x] != 0) return true;
        }

        return false;
    }

    dist(stepFunc = x => x.y--) {
        const testPiece = this.currentPieceLocation.clone();
        let count = 0;
        while (!this.obstructed(testPiece.minos())) {
            count++;
            stepFunc(testPiece.offset);
        }
        return Math.max(0, count - 1);
    }

    moveX(x) {
        let stepFunc = e => e.x += (x > 0 ? 1 : -1);
        let d = this.dist(stepFunc);
        for (let i = 0; i < Math.min(d, Math.abs(x)); i++)
            stepFunc(this.currentPieceLocation.offset);
        return d;
    }

    moveY(y) {
        let stepFunc = e => e.y += (y > 0 ? 1 : -1);
        let d = this.dist(stepFunc);
        for (let i = 0; i < Math.min(d, Math.abs(y)); i++)
            stepFunc(this.currentPieceLocation.offset);
        return d;
    }

    rotate(o, hint) {
        if (this.currentPieceLocation.polymino.allSymmetrical) return true;

        let from = this.currentPieceLocation.rotation;
        let to = (from + o + 4) % 4;

        let wallTest = this.currentPieceLocation.clone();
        wallTest.rotation = to;
        let xMin = Infinity, xMax = -Infinity, yMin = Infinity;
        for (const mino of wallTest.minos()) {
            if (mino.x < xMin) xMin = mino.x;
            if (mino.x > xMax) xMax = mino.x;
            if (mino.y < yMin) yMin = mino.y;
        }
        if (xMin < 0) wallTest.offset.x -= xMin;
        if (xMax > BOARD_WIDTH - 1) wallTest.offset.x -= xMax - (BOARD_WIDTH - 1);
        if (yMin < 0) wallTest.offset.y -= yMin;

        for (const yKick of [0, -1, 1, 2]) { 
            for (const xKick of [0, (hint > 0 ? 1 : -1), (hint > 0 ? -1 : 1)]) {
                let testPiece = wallTest.clone();
                testPiece.offset.x += xKick;
                testPiece.offset.y += yKick;
                testPiece.rotation = to;
                if (!this.obstructed(testPiece.minos())) {
                    this.currentPieceLocation.offset.x = testPiece.offset.x;
                    this.currentPieceLocation.offset.y = testPiece.offset.y;
                    this.currentPieceLocation.rotation = to;
                    return true;
                }
            }
        }
        return false;
    }

    canLock() {
        for (const mino of this.currentPieceLocation.minos()) {
            let shiftDown = mino.add(new Vec2(0, -1));
            if (shiftDown.y < 0) return true;
            if (this.dta[shiftDown.y][shiftDown.x] != 0) return true;
        }
        return false;
    }

    draw(ctx) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                let boardMino = this.dta[y][x];
                ctx.fillStyle = boardMino == -1 ? "#919191ff" : boardMino == 0 ? "#000" : nMinos[boardMino[0]][boardMino[1]].color;
                ctx.fillRect(150 + TILE_SIZE * x, TILE_SIZE * (VISIBLE_BOARD_HEIGHT - 1 - y), TILE_SIZE, TILE_SIZE);
            }
        }

        if (this.currentPieceLocation) {
            let shadowPiece = this.currentPieceLocation.clone();
            shadowPiece.offset.y -= this.dist();

            ctx.fillStyle = "#444444";
            for (const mino of shadowPiece.minos()) {
                ctx.fillRect(150 + TILE_SIZE * mino.x, TILE_SIZE * (VISIBLE_BOARD_HEIGHT - 1 - mino.y), TILE_SIZE, TILE_SIZE);
            }
            ctx.fillStyle = this.currentPieceLocation.polymino.color;
            for (const mino of this.currentPieceLocation.minos()) {
                ctx.fillRect(150 + TILE_SIZE * mino.x, TILE_SIZE * (VISIBLE_BOARD_HEIGHT - 1 - mino.y), TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

if (!localStorage.KEYS) {
    localStorage.setItem("KEYS", JSON.stringify(DEFAULT_KEYS));
} else {
    const newKeys = JSON.parse(localStorage.KEYS);
    for (const key in DEFAULT_KEYS) {
        if (!newKeys[key]) {
            newKeys[key] = DEFAULT_KEYS[key];
        }
    }
    const allKeys = Object.values(newKeys).flat();
    if ((new Set(allKeys)).size < allKeys.length) {
        alert("config clash detected! please modify localStorage.KEYS in dev console");
    }
    localStorage.setItem("KEYS", JSON.stringify(newKeys));
}

if (!localStorage.HANDLING) {
    localStorage.setItem("HANDLING", JSON.stringify(DEFAULT_HANDLING));
}

const getKey = (type, key) => JSON.parse(localStorage.KEYS)[type]?.some(x => x.toLowerCase() == key.toLowerCase());
const getHandling = v => JSON.parse(localStorage.HANDLING)[v];