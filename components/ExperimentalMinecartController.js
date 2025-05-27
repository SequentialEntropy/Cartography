import { AbstractMinecartEntity } from "./AbstractMinecartEntity.js";
import { AbstractRailBlock } from "./AbstractRailBlock.js";
import { Vec3d } from "./Vec3d.js";

export class ExperimentalMinecartController {
    minecart

    constructor(minecart) {
        this.minecart = minecart
    }

    tick() {
        // this.minecart.yaw = (this.minecart.yaw + 10) % 360

        // if (this.getWorld() instanceof ServerWorld serverWorld) {
        const serverWorld = this.getWorld()
        if (serverWorld) {
            const var5 = this.minecart.getRailOrMinecartPos();
            const blockState = this.getWorld().getBlockState(var5);
            if (this.minecart.isFirstUpdate()) {
            	this.minecart.setOnRail(AbstractRailBlock.isRail(blockState));
            	this.adjustToRail(var5, blockState, true);
            }
            this.minecart.applyGravity();
            this.minecart.moveOnRail(serverWorld);
		} else {
			this.tickClient();
			bl = AbstractRailBlock.isRail(this.getWorld().getBlockState(this.minecart.getRailOrMinecartPos()));
			this.minecart.setOnRail(bl);
		}
    }

    // TODO: private void tickClient()
    // TODO: public void setInitialStep()
    // TODO: public boolean hasCurrentLerpSteps()
    // TODO: public float getLerpedPitch(float tickDelta)
    // TODO: public float getLerpedYaw(float tickDelta)
    // TODO: public Vec3d getLerpedPosition(float tickDelta)
    // TODO: public Vec3d getLerpedVelocity(float tickDelta)
    // TODO: InterpolatedStep getLerpedStep(float tickDelta)

    setAngles(yaw, pitch) {
		const d = Math.abs(yaw - this.getYaw());
		if (d >= 175.0 && d <= 185.0) {
			this.minecart.setYawFlipped(!this.minecart.isYawFlipped());
			yaw -= 180.0;
			pitch *= -1.0;
		}

		pitch = clamp(pitch, -45.0, 45.0);
		this.setPitch(pitch % 360.0);
		this.setYaw(yaw % 360.0);
	}

    adjustToRail(pos, blockState, ignoreWeight) {
        // Check if the provided block state represents a rail.
        if (AbstractRailBlock.isRail(blockState)) {
            // Retrieve the rail's shape property from the block state.
            let railShape = blockState
            // Get the two adjacent rail positions based on the rail shape.
            let railEndpoints = AbstractMinecartEntity.getAdjacentRailPositionsByShape(railShape);

            // Convert the first and second adjacent positions into Vec3d and scale them by 0.5./
            let startOffset = Vec3d.fromVec3i(railEndpoints[0]).multiplyConst(0.5);
            let endOffset = Vec3d.fromVec3i(railEndpoints[1]).multiplyConst(0.5);

            // Get the horizontal components (ignoring Y-axis) of the two vectors.
            let startDir = startOffset.getHorizontal();
            let endDir = endOffset.getHorizontal();

            // Determine which direction is "forward" based on current velocity:
            // If the minecart is moving (length > a tiny threshold) and its velocity's dot product
            // with the first horizontal vector is less than with the second, or if ascending along endDir,
            // then swap the two horizontal vectors.
            if (this.getVelocity().length() > 1.0E-5 && this.getVelocity().dotProduct(startDir) < this.getVelocity().dotProduct(endDir)
                    || this.ascends(endDir, railShape)) {
                // Swap startDir and endDir.
                let temp = startDir;
                startDir = endDir;
                endDir = temp;
            }

            // Calculate the yaw angle using the first horizontal vector.
            // Math.atan2 returns the angle in radians, then it's converted to degrees and adjusted.

            let yaw = 180.0 - (Math.atan2(startDir.z, startDir.x) * 180.0 / Math.PI);
            // Adjust yaw if the minecart's yaw is flipped.
            yaw += this.minecart.isYawFlipped() ? 180.0 : 0.0;


            // Capture the current position of the minecart.
            let currentPos = this.getPos();

            // Check if both X and Z components of startOffset and endOffset differ; this helps decide the adjustment strategy.
            let isDiagonal = startOffset.getX() != endOffset.getX() && startOffset.getZ() != endOffset.getZ();
            let targetPos;

            // If the rail has a curved or "diagonal" configuration:
            if (isDiagonal) {
                // Compute the difference vector between the two rail vectors.
                let railVector = endOffset.subtractVec3d(startOffset);
                // Compute the vector from the center of the rail block to the current minecart position, minus the first rail vector.
                let minecartVector = currentPos.subtractVec3d(pos.toBottomCenterPos()).subtractVec3d(startOffset);
                // Project minecartVector onto railVector to determine how far along the rail direction the minecart has moved.
                let projection = railVector.multiplyConst(railVector.dotProduct(minecartVector) / railVector.dotProduct(railVector));
                // Calculate the corrected position along the rail.
                targetPos = pos.toBottomCenterPos().addVec3d(startOffset).addVec3d(projection);

                // Recalculate the yaw angle based on the new adjusted vector.
                yaw = 180.0 - (Math.atan2(projection.z, projection.x) * 180.0 / Math.PI);
                yaw += this.minecart.isYawFlipped() ? 180.0 : 0.0;
            } else {
                // If the rail is straight (either aligned on the X or Z axis):
                // Determine if the movement difference in x or z is nonzero.
                let xDiff = startOffset.subtractVec3d(endOffset).x != 0.0;
                let zDiff = startOffset.subtractVec3d(endOffset).z != 0.0;
                // Adjust the target position: use center X position if there is movement along Z, or the minecart's x if not.
                // Similar logic applies for the Z coordinate.
                targetPos = new Vec3d(zDiff ? pos.toCenterPos().x : currentPos.x, pos.getY(), xDiff ? pos.toCenterPos().z : currentPos.z);
            }

            // Calculate the positional difference vector between the new target position and the current position.
            let correction = targetPos.subtractVec3d(currentPos);
            // Move the minecart to the new computed position.
            this.setPos(currentPos.addVec3d(correction));

            // Initialize the pitch variable.
            let pitch = 0.0;
            // // Check if the vertical components of startOffset and endOffset differ, which might indicate an ascending or descending rail.
            // boolean isSloped = startOffset.getY() != startOffset.getY();
            // if (isSloped) {
            //     // Calculate the adjusted position for ascending rails.
            //     Vec3d ascendTarget = pos.toBottomCenterPos().add(endDir);
            //     // Calculate the vertical distance from the new bottom center pos to the current position.
            //     double verticalOffset = ascendTarget.distanceTo(this.getPos());
            //     // Adjust the minecart's position upward by the calculated distance plus a small offset.
            //     this.setPos(this.getPos().add(0.0, verticalOffset + 0.1, 0.0));
            //     // Set the pitch to a tilt; if the yaw is flipped, pitch is 45 degrees, otherwise -45 degrees.
            //     pitch = this.minecart.isYawFlipped() ? 45.0F : -45.0F;
            // } else {
            //     // If the rail is flat, apply a small upward adjustment.
            //     this.setPos(this.getPos().add(0.0, 0.1, 0.0));
            // }

            // Finally, set the minecart's yaw and pitch angles.
            this.setAngles(yaw, pitch)
            // // Calculate the distance moved from the original position.
            // double movedDistance = currentPos.distanceTo(this.getPos());
            // if (movedDistance > 0.0) {
            //     // If there is movement, add a new step into the staging interpolation list.
            //     // The step includes the current position, velocity, yaw, pitch, and a weight (which may be zero if ignoring weight).
            //     thisObject.stagingLerpSteps
            //             .add(new ExperimentalMinecartController.Step(this.getPos(), this.getVelocity(), this.getYaw(), this.getPitch(), ignoreWeight ? 0.0F : (float)movedDistance));
            // }
        }
    }

    // TODO: public void moveOnRail(ServerWorld world)
    moveOnRail(world) {}
    // TODO: private Vec3d calcNewHorizontalVelocity(ServerWorld world, Vec3d horizontalVelocity, MoveIteration iteration, BlockPos pos, BlockState railState, RailShape railShape)
    // TODO: private Vec3d applySlopeVelocity(Vec3d horizontalVelocity, RailShape railShape)
    // TODO: private Vec3d applyInitialVelocity(Vec3d horizontalVelocity)
    // TODO: private Vec3d decelerateFromPoweredRail(Vec3d velocity, BlockState railState)
    // TODO: private Vec3d accelerateFromPoweredRail(Vec3d velocity, BlockPos railPos, BlockState railState)
    // TODO: public double moveAlongTrack(BlockPos blockPos, RailShape railShape, double remainingDistance)
    // TODO: private boolean restOnVShapedTrack(RailShape currentRailShape, RailShape newRailShape)
    // TODO: public double getMaxSpeed(ServerWorld world)

    ascends(velocity, railShape) {
        switch (railShape) {
            // case ASCENDING_EAST: return velocity.x < 0.0;
            // case ASCENDING_WEST: return velocity.x > 0.0;
            // case ASCENDING_NORTH: return velocity.z > 0.0;
            // case ASCENDING_SOUTH: return velocity.z < 0.0;
            default: return false;
        };
    }

    // TODO: public double getSpeedRetention()
    // TODO: public boolean handleCollision()
    // TODO: public boolean pickUpEntities(Box box)
    // TODO: public boolean pushAwayFromEntities(Box box)

    /**
     * Inherited from MinecartController
     */
    // TODO: public void resetLerp()
    // TODO: public void setPos(double x, double y, double z, float yaw, float pitch, int interpolationSteps)
    // TODO: public double getLerpTargetX()
    // TODO: public double getLerpTargetY()
    // TODO: public double getLerpTargetZ()
    // TODO: public float getLerpTargetPitch()
    // TODO: public float getLerpTargetYaw()
    // TODO: public void setLerpTargetVelocity(double x, double y, double z)
    getWorld() { return this.minecart.getWorld() }
    getVelocity() { return this.minecart.getVelocity() }
    // TODO: public void setVelocity(Vec3d velocity)
    // TODO: public void setVelocity(double x, double y, double z)
    getPos() { return this.minecart.getPos() }
    // TODO: public double getX()
    // TODO: public double getY()
    // TODO: public double getZ()
    setPos(pos) { this.minecart.setPositionVec3d(pos) }
    // TODO: public void setPos(double x, double y, double z)
    // TODO: public float getPitch()
    setPitch(pitch) { this.minecart.setPitch(pitch) }
    getYaw() { return this.minecart.getYaw() }
    setYaw(yaw) { this.minecart.setYaw(yaw) }
    // TODO: public Direction getHorizontalFacing()
    // TODO: public Vec3d limitSpeed(Vec3d velocity)
}

function clamp(x, mi, ma) {
    return Math.max(mi, Math.min(x, ma))
}