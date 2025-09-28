const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

let keysPressed = [];
window.onblur = window.onfocus = window.onfocusout = window.onvisibilitychange = _ => keysPressed = [];
window.onkeydown = e => {
    if (!keysPressed.find(x => x.code == e.code))
        keysPressed.push({ code: e.code, activeInitial: false, activeAutoRepeat: false, t: performance.now(), lastT: performance.now() });
}
window.onkeyup = e => keysPressed.splice(keysPressed.findIndex(x => x.code == e.code), 1);

function attach(types, action) {
    for (const type of types) {
        let idx = keysPressed.findLastIndex(x => getKey(type, x.code));
        if (idx > -1) {
            let key = keysPressed[idx];
            key.type = type;
            action(key);
            return;
        }
    }
}

function drawGame(board, queue, hold, done = false, stats) {
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(0, 0, 1000, 1000);
    if (done) board.dta = board.dta.map(r => r.map(q => -!!q));
    board.draw(ctx);
    for (let i = 0; i < 5; i++) {
        if (!queue[i]) break;
        ctx.fillStyle = queue[i].color;
        let shiftX = Math.min(...queue[i].minos.map(x => x.x));
        for (const mino of queue[i].minos) {
            ctx.fillRect(550 + SMALL_TILE_SIZE * (mino.x - shiftX), 60 + 100 * i - SMALL_TILE_SIZE * mino.y, SMALL_TILE_SIZE, SMALL_TILE_SIZE);
        }
    }
    if (hold.piece) {
        ctx.fillStyle = hold.piece.color;
        let shiftX = Math.max(...hold.piece.minos.map(x => x.x));
        for (const mino of hold.piece.minos) {
            ctx.fillRect(50 + SMALL_TILE_SIZE * (mino.x - shiftX + 3), 60 - SMALL_TILE_SIZE * mino.y, SMALL_TILE_SIZE, SMALL_TILE_SIZE);
        }
    }
    ctx.fillStyle = "#f2f2f2";
    ctx.font = `20px "Jetbrains Mono"`
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${stats.score}`, 120, 200);
    ctx.fillText(`Combo: ${stats.combo}`, 120, 300);
}

// for debugging purposes
let stats, board, queue, hold;

function playGame(st) {
    let startTime = st || performance.now();
    queue = [];

    stats = {
        piecesPlaced: 0,
        piecesGenerated: 7,
        score: 0,
        combo: 0,
    }

    for (i = stats.piecesPlaced; i < stats.piecesGenerated; i++) {
        queue.push(selectBlock(i));
    }

    hold = { canHold: true, piece: undefined };

    board = new Board(spawnLoc(queue.shift()));

    let lastRender = startTime;
    let lastGravity = startTime;
    let lastLock = startTime;
    let lastSpawn = startTime;
    let done = false;

    function loop(t) {

        // defining new functions every single loop? egregious!
        const lock = function() {
            lastSpawn = t;
            lastLock = t;
            stats.piecesGenerated++;
            stats.piecesPlaced++;
            queue.push(selectBlock(stats.piecesGenerated));

            let linesCleared = board.placeMinos();
            if (linesCleared > 0) {
                stats.score += linesCleared * linesCleared + stats.combo;
                stats.combo += 1;
            } else {
                stats.combo = 0;
            }

            board.currentPieceLocation = queue.length ? spawnLoc(queue.shift()) : undefined;
            hold.canHold = true;

            for (const mino of board.currentPieceLocation.minos()) {
                if (board.dta[mino.y][mino.x] != 0) {
                    done = true;
                    break;
                }
            }
        }

        const bMoveX = function(...args) {
            if (board.moveX(...args) && board.canLock()) lastLock = t;
        }
        const bMoveY = function(...args) {
            if (board.moveY(...args) && board.canLock()) lastLock = t;
        }
        const bRotate = function(...args) {
            if (board.rotate(...args) && board.canLock()) lastLock = t;
        }


        if (t - startTime < 1500) {
            queue.unshift(board.currentPieceLocation.polymino);
            drawGame(board, queue, hold, done, stats);
            queue.shift();
            ctx.fillStyle = "#000";
            ctx.fillRect(150, 0, TILE_SIZE * BOARD_WIDTH, TILE_SIZE * VISIBLE_BOARD_HEIGHT);
            ctx.fillStyle = "#f1ee2eff";
            ctx.font = `48px "Jetbrains Mono"`
            const str = t - startTime < 500 ? "READY" : t - startTime < 1000 ? "" : "GO";
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillText(str, 150 + TILE_SIZE * BOARD_WIDTH / 2, TILE_SIZE * VISIBLE_BOARD_HEIGHT / 2);
            requestAnimationFrame(loop);
            return;
        }
        if (keysPressed.some(x => getKey("retry", x.code))) {
            playGame(performance.now());
            return;
        }
        if (done) {
            requestAnimationFrame(loop);
            return;
        }


        if (t - lastRender >= 1000 / 10) {
            lastRender = t;
            if ((t - lastLock >= 1500 || t - lastSpawn >= 60000) && board.canLock()) lock();
            if (t - lastGravity >= 1000) {
                bMoveY(-1);
                lastGravity = t;
            }
            let hint;
            attach(["moveLeft", "moveRight"], key => {
                let dir = key.type == "moveLeft" ? -1 : 1;
                hint = dir;

                if (!key.activeInitial) {
                    bMoveX(dir)
                    key.activeInitial = true;
                }

                if (!key.activeAutoRepeat && t - key.t > getHandling("das")) {
                    key.activeAutoRepeat = true;
                    key.lastT = t;
                }

                if (t - key.t > getHandling("das") && t - key.lastT > getHandling("arr")) {
                    bMoveX(dir * (getHandling("arr") ? Math.min(10, Math.floor((t - key.lastT) / getHandling("arr"))) : 10))
                    key.lastT = t;
                }
            });

            attach(["softDrop"], key => {
                let sdr = getHandling("sdr")
                bMoveY(-(sdr ? Math.min(BOARD_HEIGHT, Math.floor((t - key.lastT) / sdr)) : BOARD_HEIGHT));
            });

            attach(["hardDrop"], key => {
                if (key.pressed) return;
                key.pressed = true;
                bMoveY(-BOARD_HEIGHT);
                lock();
            });

            attach(["rotateCW", "rotateCCW", "rotate180"], key => {
                if (key.pressed) return;
                key.pressed = true;
                bRotate(key.type == "rotateCW" ? 1 : key.type == "rotateCCW" ? -1 : 2, hint);
            });

            attach(["hold"], key => {
                if (key.pressed || !hold.canHold) return;
                lastSpawn = t;
                lastLock = t;
                key.pressed = true;
                let oldHoldPiece = hold.piece;
                hold = { canHold: false, piece: board.currentPieceLocation.polymino };
                let p = oldHoldPiece || queue.shift();
                if (!p) done = true;
                board.currentPieceLocation = p ? spawnLoc(p) : undefined;
            })

            drawGame(board, queue, hold, done, stats);
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

playGame();