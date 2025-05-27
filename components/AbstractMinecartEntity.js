import { BlockPos } from "./BlockPos.js"
import { Entity } from "./Entity.js"
import { ExperimentalMinecartController } from "./ExperimentalMinecartController.js"
import { RailShape } from "./RailShape.js"
import { Direction } from "./World.js"

export class AbstractMinecartEntity extends Entity {
    onRail = false
    yawFlipped = false

    constructor(vec, yaw, world) {
        super("minecart", world)
        this.pos = vec
        this.yaw = yaw
        this.controller = new ExperimentalMinecartController(this)
    }

    tick() {
        // if (this.getDamageWobbleTicks() > 0) {
		// 	this.setDamageWobbleTicks(this.getDamageWobbleTicks() - 1);
		// }

		// if (this.getDamageWobbleStrength() > 0.0F) {
		// 	this.setDamageWobbleStrength(this.getDamageWobbleStrength() - 1.0F);
		// }

		// this.attemptTickInVoid();
		// this.tickPortalTeleportation();
		this.controller.tick();
		// this.updateWaterState();
		// if (this.isInLava()) {
		// 	this.setOnFireFromLava();
		// 	this.fallDistance *= 0.5F;
		// }

		this.firstUpdate = false;
    }

    getRailOrMinecartPos() {
		const i = Math.floor(this.getX())
		const j = Math.floor(this.getY())
		const k = Math.floor(this.getZ())

        // if (areMinecartImprovementsEnabled(this.getWorld())) {
        // d = this.getY() - 0.1 - 1.0E-5;
        // if (this.getWorld().getBlockState(BlockPos.ofFloored(i, d, k)).isIn(BlockTags.RAILS)) {
        //     j = MathHelper.floor(d);
        // }
        // } else if (this.getWorld().getBlockState(new BlockPos(i, j - 1, k)).isIn(BlockTags.RAILS)) {
		// 	j--;
		// }

		return new BlockPos(i, j, k);
	}

    isFirstUpdate() {
        return this.firstUpdate
    }

    setOnRail(onRail) {
		this.onRail = onRail
	}

    applyGravity() {
        super.applyGravity()
    }

    moveOnRail(world) {
		this.controller.moveOnRail(world)
	}

    static getAdjacentRailPositionsByShape(shape) {
        switch (shape) {
            case RailShape.NORTH_SOUTH: return [Direction.NORTH, Direction.SOUTH]
            case RailShape.EAST_WEST:   return [Direction.WEST,  Direction.EAST]
            case RailShape.NORTH_EAST:  return [Direction.NORTH, Direction.EAST]
            case RailShape.SOUTH_EAST:  return [Direction.SOUTH, Direction.EAST]
            case RailShape.NORTH_WEST:  return [Direction.NORTH, Direction.WEST]
            case RailShape.SOUTH_WEST:  return [Direction.SOUTH, Direction.WEST]
        }
    }

    isYawFlipped() { return this.yawFlipped }
    setYawFlipped(yawFlipped) { this.yawFlipped = yawFlipped }
}