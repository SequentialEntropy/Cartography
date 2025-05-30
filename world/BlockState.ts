import { RailShape } from "./RailShape";

export class BlockState {
    private state: RailShape | null

    constructor(state: RailShape | null) {
        this.state = state
    }
    get() {
        return this.state
    }

    static AIR = new BlockState(null)
}