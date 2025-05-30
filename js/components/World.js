import { BlockState } from './BlockState.js';
import { RailShape } from "./RailShape.js";
import { Vec3i } from "./Vec3i.js";
export const Direction = Object.freeze({
    DOWN: new Vec3i(0, -1, 0),
    UP: new Vec3i(0, 1, 0),
    NORTH: new Vec3i(0, 0, -1),
    SOUTH: new Vec3i(0, 0, 1),
    EAST: new Vec3i(1, 0, 0),
    WEST: new Vec3i(-1, 0, 0),
});
export class World {
    constructor() {
        this.entities = [];
        this.grid = {};
        this.MINECART_MAX_SPEED = 34;
    }
    getBlockState(blockPos) {
        switch (this.grid[`${blockPos.x},${blockPos.z}`]) {
            case "NS": return new BlockState(RailShape.NORTH_SOUTH);
            case "EW": return new BlockState(RailShape.EAST_WEST);
            case "NE": return new BlockState(RailShape.NORTH_EAST);
            case "SE": return new BlockState(RailShape.SOUTH_EAST);
            case "NW": return new BlockState(RailShape.NORTH_WEST);
            case "SW": return new BlockState(RailShape.SOUTH_WEST);
            default: return BlockState.AIR;
        }
    }
    import(json) {
        Object.assign(this.grid, json);
    }
    tick() {
        for (const entity of this.entities) {
            entity.tick();
        }
    }
}
