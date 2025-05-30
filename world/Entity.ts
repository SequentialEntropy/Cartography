import { MathHelper } from "./MathHelper.js"
import { MovementType } from "./MovementType.js"
import { Vec3d } from "../world/Vec3d.js"
import { World } from "../world/World.js"

export class Entity {
    type = "entity" // TODO: change from string to net.minecraft.entity.EntityType
    world: World
    prevX = 0
	prevY = 0
	prevZ = 0
    pos: Vec3d
    velocity = Vec3d.ZERO
    yaw = 0
    pitch = 0
    prevYaw = 0
    prevPitch = 0
    onGround = false
    lastRenderX = 0
	lastRenderY = 0
	lastRenderZ = 0
    firstUpdate = true
    constructor(type: string, world: World) {
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
    setYaw(yaw: number) {
        if (!Number.isFinite(yaw)) {
            throw new Error("Invalid entity rotation: " + yaw + ", discarding.")
        } else {
            this.yaw = yaw
        }
    }
    setPitch(pitch: number) {
        if (!Number.isFinite(pitch)) {
            throw new Error("Invalid entity rotation: " + pitch + ", discarding.")
        } else {
            this.pitch = MathHelper.clamp(pitch % 360.0, -90.0, 90.0)
        }
    }

    getLastRenderPos() {
		return Vec3d.fromXYZ(this.lastRenderX, this.lastRenderY, this.lastRenderZ)
	}

    setPositionXYZ(x: number, y: number, z: number) {
        this.pos = Vec3d.fromXYZ(x, y, z)
    }

    setPositionVec3d(pos: Vec3d) {
        this.pos = pos
		// this.setPositionXYZ(pos.getX(), pos.getY(), pos.getZ());
	}

    onLanding() {
		// this.fallDistance = 0.0;
	}

    isOnGround() {
		return this.onGround
	}

    // TODO
    resetPosition() {
        this.updatePrevPosition()
		this.updatePrevAngles()
    }

    updatePrevPosition() {
		this.setPrevPosition(this.pos);
	}

    updatePrevAngles() {
		this.setPrevAngles(this.getYaw(), this.getPitch());
	}

    setPrevPosition(pos: Vec3d) {
		this.prevX = this.lastRenderX = pos.x;
		this.prevY = this.lastRenderY = pos.y;
		this.prevZ = this.lastRenderZ = pos.z;
	}

    setPrevAngles(prevYaw: number, prevPitch: number) {
		this.prevYaw = prevYaw;
		this.prevPitch = prevPitch;
	}

    // TODO
    applyGravity() {}

    // TODO
    hasPassengers() { return true }

    // TODO
    isTouchingWater() { return false }

    setVelocityVec3d(velocity: Vec3d) {
		this.velocity = velocity;
	}

    // TODO
    move(type: MovementType, movement: Vec3d) {
        this.setPositionXYZ(this.getX() + movement.x, this.getY() + movement.y, this.getZ() + movement.z);
	}

    // TODO
    tickBlockCollision() {}

    // TODO
    tick() {}
}