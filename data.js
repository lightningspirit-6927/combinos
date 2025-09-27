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