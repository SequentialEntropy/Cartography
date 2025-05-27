import { Vec3d } from "./Vec3d.js"

export class Entity {
    type = "entity"
    world = null
    pos = null
    velocity = Vec3d.ZERO
    yaw = 0
    pitch = 0
    firstUpdate = true
    constructor(type, world) {
        this.type = type
        this.world = world
        this.pos = Vec3d.ZERO
    }

    getX() { return this.pos.x }
    getY() { return this.pos.y }
    getZ() { return this.pos.z }
    getWorld() { return this.world }
    getVelocity() { return this.velocity }
    getPos() { return this.pos }
    getYaw() { return this.yaw }
    getPitch() { return this.pitch }
    setYaw(yaw) {
        if (!Number.isFinite(yaw)) {
            throw new Error("Invalid entity rotation: " + yaw + ", discarding.")
        } else {
            this.yaw = yaw
        }
    }
    setPitch(pitch) {
        if (!Number.isFinite(pitch)) {
            throw new Error("Invalid entity rotation: " + pitch + ", discarding.")
        } else {
            this.pitch = clamp(pitch % 360.0, -90.0, 90.0)
        }
    }

    setPositionXYZ(x, y, z) {
        this.pos = new Vec3d(x, y, z)
    }

    setPositionVec3d(pos) {
        this.pos = pos
		// this.setPositionXYZ(pos.getX(), pos.getY(), pos.getZ());
	}

    onLanding() {
		// this.fallDistance = 0.0;
	}

    // TODO
    resetPosition() {

    }

    // TODO
    applyGravity() {}

    // TODO
    hasPassengers() { return true }

    // TODO
    isTouchingWater() { return false }

    setVelocityVec3d(velocity) {
		this.velocity = velocity;
	}

    move(type, movement) {
		if (false) {
		// if (this.noClip) {
			this.setPosition(this.getX() + movement.x, this.getY() + movement.y, this.getZ() + movement.z);
		} else {
			// this.onFire = this.isOnFire();
			// if (type == MovementType.PISTON) {
			// 	movement = this.adjustMovementForPiston(movement);
			// 	if (movement.equals(Vec3d.ZERO)) {
			// 		return;
			// 	}
			// }

			// Profiler profiler = Profilers.get();
			// profiler.push("move");
			// if (this.movementMultiplier.lengthSquared() > 1.0E-7) {
			// 	movement = movement.multiply(this.movementMultiplier);
			// 	this.movementMultiplier = Vec3d.ZERO;
			// 	this.setVelocity(Vec3d.ZERO);
			// }

			movement = this.adjustMovementForSneaking(movement, type);
			// let vec3d = this.adjustMovementForCollisions(movement);
			let vec3d = movement;
			let d = vec3d.lengthSquared();
			if (d > 1.0E-7 || movement.lengthSquared() - d < 1.0E-7) {
				// if (this.fallDistance != 0.0 && d >= 1.0) {
				// 	BlockHitResult blockHitResult = this.getWorld()
				// 		.raycast(
				// 			new RaycastContext(this.getPos(), this.getPos().add(vec3d), RaycastContext.ShapeType.FALLDAMAGE_RESETTING, RaycastContext.FluidHandling.WATER, this)
				// 		);
				// 	if (blockHitResult.getType() != HitResult.Type.MISS) {
				// 		this.onLanding();
				// 	}
				// }

				this.setPositionXYZ(this.getX() + vec3d.x, this.getY() + vec3d.y, this.getZ() + vec3d.z);
			}

			// profiler.pop();
			// profiler.push("rest");
			// boolean bl = !MathHelper.approximatelyEquals(movement.x, vec3d.x);
			// boolean bl2 = !MathHelper.approximatelyEquals(movement.z, vec3d.z);
			// this.horizontalCollision = bl || bl2;
			// if (Math.abs(movement.y) > 0.0 || this.isLocalPlayerOrLogicalSideForUpdatingMovement()) {
			// 	this.verticalCollision = movement.y != vec3d.y;
			// 	this.groundCollision = this.verticalCollision && movement.y < 0.0;
			// 	this.setMovement(this.groundCollision, this.horizontalCollision, vec3d);
			// }

			// if (this.horizontalCollision) {
			// 	this.collidedSoftly = this.hasCollidedSoftly(vec3d);
			// } else {
			// 	this.collidedSoftly = false;
			// }

			// BlockPos blockPos = this.getLanding


			if (false) {
			// if (this.isRemoved()) {
			// 	// profiler.pop();
			} else {
				// if (this.horizontalCollision) {
			// 		Vec3d vec3d2 = this.getVelocity();
			// 		this.setVelocity(bl ? 0.0 : vec3d2.x, vec3d2.y, bl2 ? 0.0 : vec3d2.z);
			// 	}

				// if (this.isLogicalSideForUpdatingMovement()) {
				// 	Block block = blockState.getBlock();
				// 	if (movement.y != vec3d.y) {
				// 		block.onEntityLand(this.getWorld(), this);
				// 	}
				// }

                if (true) {
				// if (!this.getWorld().isClient() || this.isLogicalSideForUpdatingMovement()) {
					// moveEffect = this.getMoveEffect();
					// Entity.MoveEffect moveEffect = this.getMoveEffect();
					// if (moveEffect.hasAny() && !this.hasVehicle()) {
					// 	this.applyMoveEffect(moveEffect, vec3d, blockPos, blockState);
					// }
				}

			// 	float f = this.getVelocityMultiplier();
			// 	this.setVelocity(this.getVelocity().multiply(f, 1.0, f));
			// 	profiler.pop();
			}
		}
	}

    adjustMovementForSneaking(movement, type) {
		return movement;
	}
}

function clamp(x, mi, ma) {
    return Math.max(mi, Math.min(x, ma))
}