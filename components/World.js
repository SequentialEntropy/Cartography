import { AbstractMinecartEntity } from "./AbstractMinecartEntity.js"
import { RailShape } from "./RailShape.js"
import { Vec3d } from "./Vec3d.js"
import { Vec3i } from "./Vec3i.js"

export const Direction = Object.freeze({
    DOWN: new Vec3i(0, -1, 0),
    UP: new Vec3i(0, 1, 0),
    NORTH: new Vec3i(0, 0, -1),
    SOUTH: new Vec3i(0, 0, 1),
    EAST: new Vec3i(1, 0, 0),
    WEST: new Vec3i(-1, 0, 0),
})

export class World {
    entities = []
    grid = {}

    constructor() {
        this.entities = [
            new AbstractMinecartEntity(new Vec3d(0.5, 0, 0.5), 45, this),
            new AbstractMinecartEntity(new Vec3d(0.5 + .5, 0, 2.49 + .5), 0, this),
        ]
    
        this.grid = {
            "1,1": RailShape.SOUTH_EAST,
            "1,2": RailShape.NORTH_EAST,
            "2,1": RailShape.SOUTH_WEST,
            "2,2": RailShape.NORTH_WEST,
        }
    }

    getBlockState(blockPos) {
        return this.grid[`${blockPos.x},${blockPos.z}`]
    }
    
    tick() {
        for (const entity of this.entities) {
            entity.tick()
        }
    }
}