import { BlockPos } from "./BlockPos.js"
import { Entity } from "./Entity.js"
import { ExperimentalMinecartController } from "./ExperimentalMinecartController.js"
import { MovementType } from "./MovementType.js"
import { RailShape } from "./RailShape.js"
import { Vec3d } from "./Vec3d.js"
import { Direction, World } from "./World.js"

export class AbstractMinecartEntity extends Entity {
    onRail = false
    yawFlipped = false
    controller
    canvasLine: [number, number][] = []
    clearCanvasLine = true

    constructor(pos: Vec3d, vel: Vec3d, yaw: number, world: World) {
        super("minecart", world)
        this.pos = pos
        this.yaw = yaw
        this.velocity = vel // block per gametick (1/20), not block per second
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

    setOnRail(onRail: boolean) { this.onRail = onRail }
    isOnRail() { return this.onRail }

    applyGravity() {
        super.applyGravity()
    }

    moveOnRail(world: World) {
		this.controller.moveOnRail(world)
	}

    static getAdjacentRailPositionsByShape(shape: RailShape) {
        switch (shape) {
            case RailShape.NORTH_SOUTH: return [Direction.NORTH, Direction.SOUTH]
            case RailShape.EAST_WEST:   return [Direction.WEST,  Direction.EAST]
            case RailShape.NORTH_EAST:  return [Direction.NORTH, Direction.EAST]
            case RailShape.SOUTH_EAST:  return [Direction.SOUTH, Direction.EAST]
            case RailShape.NORTH_WEST:  return [Direction.NORTH, Direction.WEST]
            case RailShape.SOUTH_WEST:  return [Direction.SOUTH, Direction.WEST]
            default: return [Direction.NORTH, Direction.SOUTH]
        }
    }

    isYawFlipped() { return this.yawFlipped }
    setYawFlipped(yawFlipped: boolean) { this.yawFlipped = yawFlipped }
    isAlive() { return true }

    applySlowdown(velocity: Vec3d) {
		let d = this.controller.getSpeedRetention();
		let vec3d = velocity.multiplyXYZ(d, 0.0, d);
		if (this.isTouchingWater()) {
			vec3d = vec3d.multiplyConst(0.95);
		}

		return vec3d;
	}

    getMaxSpeed(world: World) {
		return this.controller.getMaxSpeed(world);
	}

    // TODO
    moveOffRail(world: World) {
		// let d = this.getMaxSpeed(world);
		// let vec3d = this.getVelocity();
		// this.setVelocity(MathHelper.clamp(vec3d.x, -d, d), vec3d.y, MathHelper.clamp(vec3d.z, -d, d));
		// if (this.isOnGround()) {
		// 	this.setVelocity(this.getVelocity().multiply(0.5));
		// }

		// this.move(MovementType.SELF, this.getVelocity());
		// if (!this.isOnGround()) {
		// 	this.setVelocity(this.getVelocity().multiply(0.95));
		// }
	}

    moveAlongTrack(pos: BlockPos, shape: RailShape, remainingMovement: number) {
		return this.controller.moveAlongTrack(pos, shape, remainingMovement);
	}

    move(type: MovementType, movement: Vec3d) {
		if (this.areMinecartImprovementsEnabled(this.getWorld())) {
			let vec3d = this.getPos().addVec3d(movement);
			super.move(type, movement);
			let bl = this.controller.handleCollision();
			if (bl) {
				super.move(type, vec3d.subtractVec3d(this.getPos()));
			}

			if (type === MovementType.PISTON) {
				this.onRail = false;
			}
		} else {
			super.move(type, movement);
			this.tickBlockCollision();
		}
	}

    areMinecartImprovementsEnabled(world: World) {
        return true
    }
}