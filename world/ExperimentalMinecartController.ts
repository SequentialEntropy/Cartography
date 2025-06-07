import { RailShape } from './RailShape.js';
import { MathHelper } from "./MathHelper.js";
import { Vec3d } from "../world/Vec3d.js";
import { World } from "../world/World.js";
import { MovementType } from './MovementType.js';
import { AbstractMinecartEntity } from './AbstractMinecartEntity.js';
import { AbstractRailBlock } from './AbstractRailBlock.js';
import { BlockPos } from './BlockPos.js';
import { BlockState } from './BlockState.js';

export class ExperimentalMinecartController {
    minecart: AbstractMinecartEntity
    stagingLerpSteps = []
    // currentLerpSteps = []

    constructor(minecart: AbstractMinecartEntity) {
        this.minecart = minecart
    }

    tick() {
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
			// this.tickClient();
			// bl = AbstractRailBlock.isRail(this.getWorld().getBlockState(this.minecart.getRailOrMinecartPos()));
			// this.minecart.setOnRail(bl);
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

    setAngles(yaw: number, pitch: number) {
		const d = Math.abs(yaw - this.getYaw());
		if (d >= 175.0 && d <= 185.0) {
			this.minecart.setYawFlipped(!this.minecart.isYawFlipped());
			yaw -= 180.0;
			pitch *= -1.0;
		}

		pitch = MathHelper.clamp(pitch, -45.0, 45.0);
		this.setPitch(pitch % 360.0);
		this.setYaw(yaw % 360.0);
	}

    adjustToRail(pos: BlockPos, blockState: BlockState, ignoreWeight: boolean) {
        // Check if the provided block state represents a rail.
        if (AbstractRailBlock.isRail(blockState)) {
            // Retrieve the rail's shape property from the block state.
            let railShape: RailShape = blockState.get() as RailShape
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
                targetPos = Vec3d.fromXYZ(zDiff ? pos.toCenterPos().x : currentPos.x, pos.getY(), xDiff ? pos.toCenterPos().z : currentPos.z);
            }

            // Calculate the positional difference vector between the new target position and the current position.
            let correction = targetPos.subtractVec3d(currentPos);
            // Move the minecart to the new computed position.
            this.setPos(currentPos.addVec3d(correction));

            // Initialize the pitch variable.
            let pitch = 0.0;
            // Check if the vertical components of startOffset and endOffset differ, which might indicate an ascending or descending rail.
            let isSloped = startOffset.getY() != startOffset.getY();
            if (isSloped) {
            //     // Calculate the adjusted position for ascending rails.
            //     Vec3d ascendTarget = pos.toBottomCenterPos().add(endDir);
            //     // Calculate the vertical distance from the new bottom center pos to the current position.
            //     double verticalOffset = ascendTarget.distanceTo(this.getPos());
            //     // Adjust the minecart's position upward by the calculated distance plus a small offset.
            //     this.setPos(this.getPos().add(0.0, verticalOffset + 0.1, 0.0));
            //     // Set the pitch to a tilt; if the yaw is flipped, pitch is 45 degrees, otherwise -45 degrees.
            //     pitch = this.minecart.isYawFlipped() ? 45.0F : -45.0F;
            } else {
                // If the rail is flat, apply a small upward adjustment.
                this.setPos(this.getPos().addXYZ(0.0, 0.1, 0.0));
            }

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
    moveOnRail(world: World) {
        for (const moveIteration = new MoveIteration(); moveIteration.shouldContinue() && this.minecart.isAlive(); moveIteration.initial = false) {
            // Get the current velocity of the minecart
            let currentVelocity = this.getVelocity();
            // Get the position of the rail or the cart itself
            let blockPos = this.minecart.getRailOrMinecartPos();
            // Get the block state at that position
            let blockState = this.getWorld().getBlockState(blockPos);
            // Check whether the current block is a rail
            let isOnRail = AbstractRailBlock.isRail(blockState);

            // Sync the minecart's "on rail" status
            if (this.minecart.isOnRail() != isOnRail) {
                this.minecart.setOnRail(isOnRail);
                // Adjust the cart’s position to match the rail orientation
                this.adjustToRail(blockPos, blockState, false);
            }

            if (isOnRail) {
                // Trigger landing logic (e.g., for fall damage or sounds)
                this.minecart.onLanding();
                // Reset internal position state (likely used for interpolation)
                this.minecart.resetPosition();

                // Special handling for activator rails (which may trigger events)
                // if (blockState.isOf(Blocks.ACTIVATOR_RAIL)) {
                //     this.minecart.onActivatorRail(blockPos.getX(), blockPos.getY(), blockPos.getZ(), (Boolean)blockState.get(PoweredRailBlock.POWERED));
                // }

                // Determine rail shape (e.g., straight, curved, sloped)
                let railShape = blockState.get() as RailShape

                // Calculate new velocity along the rail
                let adjustedVelocity = this.calcNewHorizontalVelocity(world, currentVelocity.getHorizontal(), moveIteration, blockPos, blockState, railShape);

                // Update remaining movement distance for this iteration
                if (moveIteration.initial) {
                    moveIteration.remainingMovement = adjustedVelocity.horizontalLength();
                } else {
                    moveIteration.remainingMovement += (adjustedVelocity.horizontalLength() - currentVelocity.horizontalLength());
                }

                // Apply new velocity
                this.setVelocityVec3d(adjustedVelocity);
                // Move the cart along the track and update the remaining distance
                moveIteration.remainingMovement = this.minecart.moveAlongTrack(blockPos, railShape, moveIteration.remainingMovement);
            } else {
                // If not on a rail, handle off-rail movement
                this.minecart.moveOffRail(world);
                moveIteration.remainingMovement = 0.0;
            }

            // Determine the position delta for orientation and interpolation
            let currentPosition = this.getPos();
            let deltaPosition = currentPosition.subtractVec3d(this.minecart.getLastRenderPos());
            let deltaLength = deltaPosition.length();

            if (deltaLength > 1.0E-5) {
                if (!(deltaPosition.horizontalLengthSquared() > 1.0E-5)) {
                    // TODO
                    // if (!this.minecart.isOnRail()) {
                    //     let adjustedPitch = this.minecart.isOnGround() ? 0.0 : MathHelper.lerpAngleDegrees(0.2, this.getPitch(), 0.0);
                    //     this.setPitch(adjustedPitch);
                    // }
                } else {
                    // Set yaw and pitch based on direction of movement
                    let yaw = 180.0 - (Math.atan2(deltaPosition.z, deltaPosition.x) * 180.0 / Math.PI);
                    let pitch = this.minecart.isOnGround() && !this.minecart.isOnRail()
                            ? 0.0
                            : 90.0 - (Math.atan2(deltaPosition.horizontalLength(), deltaPosition.y) * 180.0 / Math.PI);

                    if (this.minecart.isYawFlipped()) {
                        yaw += 180.0;
                        pitch *= -1.0;
                    }

                    this.setAngles(yaw, pitch);
                }

//                this.broadcast("stagingLerpSteps (HIGH deltaLength)");
                // Add to interpolation steps for rendering (likely client-side)
                // this.stagingLerpSteps.push(new Step(
                //         currentPosition,
                //         this.getVelocity(),
                //         this.getYaw(),
                //         this.getPitch(),
                //         Math.min(deltaLength, this.getMaxSpeed(world))
                // ));
            } else if (currentVelocity.horizontalLengthSquared() > 0.0) {
//                this.broadcast("stagingLerpSteps (LOW  deltaLength)");
                // If not moving significantly but still has horizontal speed
                // this.stagingLerpSteps.push(new Step(
                //         currentPosition,
                //         this.getVelocity(),
                //         this.getYaw(),
                //         this.getPitch(),
                //         1.0));
            }

            // If moved or in the first iteration, handle collision checks
            // if (deltaLength > 1.0E-5 || moveIteration.initial) {
            //     this.minecart.tickBlockCollision(); // Called twice for redundancy or separate pass types
            //     this.minecart.tickBlockCollision();
            // }
        }
        
    }

    calcNewHorizontalVelocity(world: World, horizontalVelocity: Vec3d, iteration: MoveIteration, pos: BlockPos, railState: BlockState, railShape: RailShape) {
        // --- Apply slope adjustment once ---
        // Adjust velocity if the rail is on a slope (e.g., ascending/descending)
        let updatedVelocity = horizontalVelocity;
        // if (!iteration.slopeVelocityApplied) {
        //     slopeAdjustedVelocity = this.applySlopeVelocity(horizontalVelocity, railShape);
        //     if (slopeAdjustedVelocity.horizontalLengthSquared() != horizontalVelocity.horizontalLengthSquared()) {
        //         iteration.slopeVelocityApplied = true; // If velocity changed, mark that slope has been handled
        //         updatedVelocity = slopeAdjustedVelocity;
        //     }
        // }

        // --- Apply player input on the first iteration only ---
        if (iteration.initial) {
            let initialVelocity = this.applyInitialVelocity(updatedVelocity);
            if (initialVelocity.horizontalLengthSquared() != updatedVelocity.horizontalLengthSquared()) {
                iteration.decelerated = true; // If velocity changed, mark as decelerated
                updatedVelocity = initialVelocity;
            }
        }

        // --- Apply passive deceleration from unpowered rail if not already done ---
        // if (!iteration.decelerated) {
        //     deceleratedVelocity = this.decelerateFromPoweredRail(updatedVelocity, railState);
        //     if (deceleratedVelocity.horizontalLengthSquared() != updatedVelocity.horizontalLengthSquared()) {
        //         iteration.decelerated = true; // If velocity changed, mark as decelerated
        //         updatedVelocity = deceleratedVelocity;
        //     }
        // }

        // --- Apply general slowdown (friction) on first iteration ---
        if (iteration.initial) {
            updatedVelocity = this.minecart.applySlowdown(updatedVelocity);

            if (updatedVelocity.lengthSquared() > 0.0) {
                // Clamp velocity to the cart's maximum allowed speed
                let clampedSpeed = Math.min(updatedVelocity.length(), this.minecart.getMaxSpeed(world));
                updatedVelocity = updatedVelocity.normalize().multiplyConst(clampedSpeed);
            }
        }

        // --- Apply powered rail acceleration if not already done ---
        // if (!iteration.accelerated) {
        //     acceleratedVelocity = this.accelerateFromPoweredRail(updatedVelocity, pos, railState);
        //     if (acceleratedVelocity.horizontalLengthSquared() != updatedVelocity.horizontalLengthSquared()) {
        //         iteration.accelerated = true; // Mark as accelerated
        //         updatedVelocity = acceleratedVelocity;
        //     }
        // }

        // Final velocity after all adjustments
        return updatedVelocity
    }
    // TODO: private Vec3d applySlopeVelocity(Vec3d horizontalVelocity, RailShape railShape)

    applyInitialVelocity(horizontalVelocity: Vec3d) {
        // TODO: player input
        return horizontalVelocity
    }

    // TODO: private Vec3d decelerateFromPoweredRail(Vec3d velocity, BlockState railState)
    // TODO: private Vec3d accelerateFromPoweredRail(Vec3d velocity, BlockPos railPos, BlockState railState)

    // TODO
    moveAlongTrack(blockPos: BlockPos, railShape: RailShape, remainingDistance: number) {
        // If there's almost no movement left, stop the cart
        if (remainingDistance < 1.0E-5) {
            return 0.0;
        } else {
            let currentPosition = this.getPos();

            // Get the two directional vectors associated with the rail shape
            let railDirections = AbstractMinecartEntity.getAdjacentRailPositionsByShape(railShape);
            let railDirA = railDirections[0];
            let railDirB = railDirections[1];

            let currentVelocity = this.getVelocity().getHorizontal(); // Current horizontal velocity

            // If the velocity is very small, stop the cart
            if (currentVelocity.length() < 1.0E-5) {
                this.setVelocityVec3d(Vec3d.ZERO);
                return 0.0;
            } else {
                // Check if the track is sloped (change in Y)
                let isSloped = railDirA.getY() != railDirB.getY();

                // Scale to half-length
                let scaledDirA = Vec3d.fromVec3i(railDirA).multiplyConst(0.5).getHorizontal();
                let scaledDirB = Vec3d.fromVec3i(railDirB).multiplyConst(0.5).getHorizontal();

                // Choose the direction that's more aligned with current velocity
                let travelDirection = currentVelocity.dotProduct(scaledDirA) < currentVelocity.dotProduct(scaledDirB)
                        ? scaledDirB : scaledDirA;

                // Compute target position a bit ahead in the chosen direction
                let targetPosition = blockPos.toBottomCenterPos()
                        .addVec3d(travelDirection)                                      // move halfway in direction
                        .addXYZ(0.0, 0.1, 0.0)                               // slight vertical offset
                        .addVec3d(travelDirection.normalize().multiplyConst(1.0E-5)); // tiny nudge for precision

                // // If track is sloped and cart is not ascending, raise the target position
                // if (isSloped && !this.ascends(currentVelocity, railShape)) {
                //     targetPosition = targetPosition.add(0.0, 1.0, 0.0);
                // }

                // Recalculate velocity to point toward the adjusted target position
                let targetDirection = targetPosition.subtractVec3d(this.getPos()).normalize();
                currentVelocity = targetDirection.multiplyConst(currentVelocity.length() / targetDirection.horizontalLength());

                // Predict next position based on remaining movement
                let predictedPosition = currentPosition.addVec3d(currentVelocity.normalize().multiplyConst(
                        remainingDistance * (isSloped ? MathHelper.SQUARE_ROOT_OF_TWO : 1.0)));
                
                // If we're going to overshoot the target, clamp to it and reduce remaining movement
                if (currentPosition.squaredDistanceTo(targetPosition) <= currentPosition.squaredDistanceTo(predictedPosition)) {
                    remainingDistance = targetPosition.subtractVec3d(predictedPosition).horizontalLength();
                    predictedPosition = targetPosition;
                } else {
                    remainingDistance = 0.0;
                }

                // Actually move the minecart to the new position
                this.minecart.move(MovementType.SELF, predictedPosition.subtractVec3d(currentPosition));

                // Check the block at the new position for rail information
                // let blockState = this.getWorld().getBlockState(BlockPos.ofFloored(predictedPosition));

            //     if (isSloped) { // If moving on a sloped track
            //         if (AbstractRailBlock.isRail(blockState)) {
            //             RailShape railShape2 = blockState.get(((AbstractRailBlock)blockState.getBlock()).getShapeProperty());
            //             // Stop if the cart transitions from a V-shaped track to a rest position
            //             if (this.restOnVShapedTrack(railShape, railShape2)) {
            //                 return 0.0;
            //             }
            //         }

            //         // Calculate vertical adjustment needed
            //         double distanceToTarget = targetPosition.getHorizontal().distanceTo(this.getPos().getHorizontal());
            //         double predictedY = targetPosition.y + (this.ascends(currentVelocity, railShape) ? distanceToTarget : -distanceToTarget);

            //         // Adjust vertical position if minecart is below target height
            //         if (this.getPos().y < predictedY) {
            //             this.setPos(this.getPos().x, predictedY, this.getPos().z);
            //         }
            //     }

                // If very little movement occurred, stop the cart
                if (this.getPos().distanceTo(currentPosition) < 1.0E-5 && predictedPosition.distanceTo(currentPosition) > 1.0E-5) {
                    this.setVelocityVec3d(Vec3d.ZERO);
                    return 0.0;
                } else {
                    // Otherwise, update velocity and return remaining movement
                    this.setVelocityVec3d(currentVelocity);
                    return remainingDistance;
                }
            }
        }
    }

    // TODO: private boolean restOnVShapedTrack(RailShape currentRailShape, RailShape newRailShape)

    getMaxSpeed(world: World) {
        return world.MINECART_MAX_SPEED * (this.minecart.isTouchingWater() ? 0.5 : 1.0) / 20.0;
		// return world.getGameRules().getInt(GameRules.MINECART_MAX_SPEED) * (this.minecart.isTouchingWater() ? 0.5 : 1.0) / 20.0;
	}

    ascends(velocity: Vec3d, railShape: RailShape) {
        switch (railShape) {
            // case ASCENDING_EAST: return velocity.x < 0.0;
            // case ASCENDING_WEST: return velocity.x > 0.0;
            // case ASCENDING_NORTH: return velocity.z > 0.0;
            // case ASCENDING_SOUTH: return velocity.z < 0.0;
            default: return false;
        };
    }

    getSpeedRetention() {
        // return this.minecart.hasPassengers() ? 0.997 : 0.975;
        return this.minecart.hasPassengers() ? 0.999999 : 0.975;
    }

    // TODO
    handleCollision() { return false }

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
}

class MoveIteration {
    remainingMovement = 0.0;
    initial = true;
    slopeVelocityApplied = false;
    decelerated = false;
    accelerated = false;

    shouldContinue() {
        return this.initial || this.remainingMovement > 1.0E-5;
    }
}