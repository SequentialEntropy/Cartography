import { BlockState } from "./BlockState.js";
import { RailShape } from "./RailShape.js";

export class AbstractRailBlock {
    static isRail(blockState: BlockState) {
        // return blockState.get() instanceof AbstractRailBlock
        switch (blockState.get()) {
            case RailShape.NORTH_SOUTH:
            case RailShape.EAST_WEST:
            case RailShape.NORTH_EAST:
            case RailShape.SOUTH_EAST:
            case RailShape.NORTH_WEST:
            case RailShape.SOUTH_WEST:
                return true
            default:
                return false
        }
    }
}