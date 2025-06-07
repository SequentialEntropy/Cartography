import { AbstractMinecartEntity } from "./AbstractMinecartEntity";
import { BlockPos } from "./BlockPos";
import { RailShape } from "./RailShape";
import { Vec3d } from "./Vec3d";
import { World } from "./World";

export class MinecartController {
    minecart: AbstractMinecartEntity

    constructor(minecart: AbstractMinecartEntity) {
        this.minecart = minecart
    }

    // TODO: public void resetLerp()
    // TODO: public void setPos(double x, double y, double z, float yaw, float pitch, int interpolationSteps)
    // TODO: public double getLerpTargetX()
    // TODO: public double getLerpTargetY()
    // TODO: public double getLerpTargetZ()
    // TODO: public float getLerpTargetPitch()
    // TODO: public float getLerpTargetYaw()
    // TODO: public void setLerpTargetVelocity(double x, double y, double z)
    tick() {
        throw new Error("Method not implemented.")
    }
    moveOnRail(world: World) {
        throw new Error("Method not implemented.")
    }
    moveAlongTrack(pos: BlockPos, shape: RailShape, remainingMovement: number): number {
        throw new Error("Method not implemented.")
    }
    handleCollision(): boolean {
        throw new Error("Method not implemented.")
    }
    getWorld() { return this.minecart.getWorld() }
    getVelocity() { return this.minecart.getVelocity() }
    setVelocityVec3d(velocity: Vec3d) { this.minecart.setVelocityVec3d(velocity) }
    // TODO: public void setVelocity(double x, double y, double z)
    getPos() { return this.minecart.getPos() }
    // TODO: public double getX()
    // TODO: public double getY()
    // TODO: public double getZ()

    setPos(pos: Vec3d) { this.minecart.setPositionVec3d(pos) }
    // TODO: public void setPos(double x, double y, double z)
    getPitch() { return this.minecart.getPitch() }
    setPitch(pitch: number) { this.minecart.setPitch(pitch) }
    getYaw() { return this.minecart.getYaw() }
    setYaw(yaw: number) { this.minecart.setYaw(yaw) }

    // TODO: public Direction getHorizontalFacing()
    // TODO: public Vec3d limitSpeed(Vec3d velocity)

    getMaxSpeed(world: World): number {
        throw new Error("Method not implemented.")
    }
    getSpeedRetention(): number {
        throw new Error("Method not implemented.")
    }
}