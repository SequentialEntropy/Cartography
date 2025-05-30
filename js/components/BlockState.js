export class BlockState {
    constructor(state) {
        this.state = state;
    }
    get() {
        return this.state;
    }
}
BlockState.AIR = new BlockState(null);
