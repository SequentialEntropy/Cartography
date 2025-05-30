import { MathHelper } from "./MathHelper.js";
import { Vec3d } from "../world/Vec3d.js";
export class Entity {
    constructor(type, world) {
        this.type = "entity"; // TODO: change from string to net.minecraft.entity.EntityType
        this.prevX = 0;
        this.prevY = 0;
        this.prevZ = 0;
        this.velocity = Vec3d.ZERO;
        this.yaw = 0;
        this.pitch = 0;
        this.prevYaw = 0;
        this.prevPitch = 0;
        this.onGround = false;
        this.lastRenderX = 0;
        this.lastRenderY = 0;
        this.lastRenderZ = 0;
        this.firstUpdate = true;
        this.type = type;
        this.world = world;
        this.pos = Vec3d.ZERO;
    }
    getX() { return this.pos.x; }
    getY() { return this.pos.y; }
    getZ() { return this.pos.z; }
    getWorld() { return this.world; }
    getVelocity() { return this.velocity; }
    getPos() { return this.pos; }
    getYaw() { return this.yaw; }
    getPitch() { return this.pitch; }
    setYaw(yaw) {
        if (!Number.isFinite(yaw)) {
            throw new Error("Invalid entity rotation: " + yaw + ", discarding.");
        }
        else {
            this.yaw = yaw;
        }
    }
    setPitch(pitch) {
        if (!Number.isFinite(pitch)) {
            throw new Error("Invalid entity rotation: " + pitch + ", discarding.");
        }
        else {
            this.pitch = MathHelper.clamp(pitch % 360.0, -90.0, 90.0);
        }
    }
    getLastRenderPos() {
        return Vec3d.fromXYZ(this.lastRenderX, this.lastRenderY, this.lastRenderZ);
    }
    setPositionXYZ(x, y, z) {
        this.pos = Vec3d.fromXYZ(x, y, z);
    }
    setPositionVec3d(pos) {
        this.pos = pos;
        // this.setPositionXYZ(pos.getX(), pos.getY(), pos.getZ());
    }
    onLanding() {
        // this.fallDistance = 0.0;
    }
    isOnGround() {
        return this.onGround;
    }
    // TODO
    resetPosition() {
        this.updatePrevPosition();
        this.updatePrevAngles();
    }
    updatePrevPosition() {
        this.setPrevPosition(this.pos);
    }
    updatePrevAngles() {
        this.setPrevAngles(this.getYaw(), this.getPitch());
    }
    setPrevPosition(pos) {
        this.prevX = this.lastRenderX = pos.x;
        this.prevY = this.lastRenderY = pos.y;
        this.prevZ = this.lastRenderZ = pos.z;
    }
    setPrevAngles(prevYaw, prevPitch) {
        this.prevYaw = prevYaw;
        this.prevPitch = prevPitch;
    }
    // TODO
    applyGravity() { }
    // TODO
    hasPassengers() { return true; }
    // TODO
    isTouchingWater() { return false; }
    setVelocityVec3d(velocity) {
        this.velocity = velocity;
    }
    // TODO
    move(type, movement) {
        this.setPositionXYZ(this.getX() + movement.x, this.getY() + movement.y, this.getZ() + movement.z);
    }
    // TODO
    tickBlockCollision() { }
    // TODO
    tick() { }
}
