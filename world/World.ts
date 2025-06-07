import { Vec3i } from './Vec3i.js';
import { BlockState } from './BlockState.js'
import { BlockPos } from "./BlockPos.js"
import { RailShape } from "./RailShape.js"
import { Entity } from './Entity.js';
import { AbstractMinecartEntity } from './AbstractMinecartEntity.js';
import { markDirty } from '../components/Canvas.js';

export const Direction = Object.freeze({
    DOWN: new Vec3i(0, -1, 0),
    UP: new Vec3i(0, 1, 0),
    NORTH: new Vec3i(0, 0, -1),
    SOUTH: new Vec3i(0, 0, 1),
    EAST: new Vec3i(1, 0, 0),
    WEST: new Vec3i(-1, 0, 0),
})

interface GridType {
    [propName: string]: string
}

export class World {
    entities: AbstractMinecartEntity[] = []
    grid: GridType = {}
    MINECART_MAX_SPEED = 34

    constructor() {}

    getBlockState(blockPos: BlockPos) {
        switch(this.grid[`${blockPos.x},${blockPos.z}`]) {
            case "NS": return new BlockState(RailShape.NORTH_SOUTH)
            case "EW": return new BlockState(RailShape.EAST_WEST)
            case "NE": return new BlockState(RailShape.NORTH_EAST)
            case "SE": return new BlockState(RailShape.SOUTH_EAST)
            case "NW": return new BlockState(RailShape.NORTH_WEST)
            case "SW": return new BlockState(RailShape.SOUTH_WEST)
            default: return BlockState.AIR
        }
    }

    import(json: {[propName: string]: string}) {
        Object.assign(this.grid, json);
        markDirty()
    }
    
    tick() {
        for (const entity of this.entities) {
            entity.tick()
        }
    }

    gameLoop() {
        // const now = performance.now()
        // const mspt = now - lastTick
        // lastTick = now

        this.tick()
        markDirty()

        // const tps = 1000 / mspt
        // tpsMeter.textContent = `TPS: ${tps.toFixed(2)}`
    }
}