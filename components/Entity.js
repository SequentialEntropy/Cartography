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

    //TODO
    applyGravity() {}
}

function clamp(x, mi, ma) {
    return Math.max(mi, Math.min(x, ma))
}