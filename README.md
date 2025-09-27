# whats this project?

combinos is a game that's like tetris, but it uses all possible polyminos from monominoes (1) to decominoes (10). see https://tetris.wiki/Combinos for more information

ive tried to make the game logic as similar to the original combinos, but feel free to give me feedback if youd like changes!

## important note about controls

i didnt make ui for control changes (because im lazy). if you want to change the controls, use something like below:

```js
const myKeys = {
    moveLeft: ["KeyK"],
    moveRight: ["KeyP"],
    rotateCW: ["KeyO"],
    rotateCCW: ["KeyD"],
    rotate180: ["KeyS"],
    softDrop: ["KeyL"],
    hardDrop: ["Space"],
    hold: ["KeyA"],
    retry: ["KeyR"],
};
const myHandling = {
    das: 60,
    arr: 0,
    sdr: 20 // soft drop rate in ms
}
localStorage.setItem("KEYS", JSON.stringify(myKeys));
localStorage.setItem("HANDLING", JSON.stringify(myHandling));
```

default keys are defined at the bottom of `data.js`. have a look yourself.

## features of this project

1. algorithmic mino generation in `allminos.js`. on my end it takes about 1 second to generate all minos. i havent bothered optimizing it too much but i might revisit it in the future if the performance becomes a big issue
2. as similar to the original combinos as possible, including the kick system, the block selection, scoring, etc. (except maybe the colors and movement handling)
3. gravity drops piece by 1 mino every second. auto lock delay is 2 seconds, but the piece auto locks after 60 seconds. shouldnt be a problem unless ur afk