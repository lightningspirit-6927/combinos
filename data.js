const DEFAULT_HANDLING = {
    das: 100,
    arr: 0,
    sdr: 0 // soft drop rate, in ms
};

const DEFAULT_KEYS = {
    moveLeft: ["ArrowLeft"],
    moveRight: ["ArrowRight"],
    softDrop: ["ArrowDown"],
    hardDrop: ["Space"],
    rotateCW: ["KeyX", "ArrowUp"],
    rotateCCW: ["ControlLeft", "ControlRight", "KeyZ"],
    rotate180: ["KeyA"],
    hold: ["ShiftLeft", "ShiftRight", "KeyC"],
    retry: ["KeyR"],
}
const myKeys = {
    moveLeft: ["ArrowLeft"],
    moveRight: ["ArrowRight"],
    rotateCW: ["ArrowUp"],
    rotateCCW: ["KeyZ"],
    rotate180: ["KeyX"],
    softDrop: ["ArrowDown"],
    hardDrop: ["Space"],
    hold: ["KeyC"],
    retry: ["KeyQ"],
};
const myHandling = {
    das: 60,
    arr: 0,
    sdr: 4 // soft drop rate in ms
}
localStorage.setItem("KEYS", JSON.stringify(myKeys));
localStorage.setItem("HANDLING", JSON.stringify(myHandling));
