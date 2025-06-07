import { RailShape } from './RailShape.js';
import { MathHelper } from "./MathHelper.js";
import { Vec3d } from "../world/Vec3d.js";
import { Direction, World } from "../world/World.js";
import { MovementType } from './MovementType.js';
import { AbstractMinecartEntity } from './AbstractMinecartEntity.js';
import { AbstractRailBlock } from './AbstractRailBlock.js';
import { BlockPos } from './BlockPos.js';
import { BlockState } from './BlockState.js';
import { Vec3i } from './Vec3i.js';
import { MinecartController } from './MinecartController.js';

const LOOKAHEAD_DISTANCE = 30

// Raycast distance to smoothen derailment correction jerk
const CHECK_FOR_RAIL_AHEAD = 15

export class CustomMinecartController extends MinecartController {
    stagingLerpSteps = []
    // currentLerpSteps = []

    constructor(minecart: AbstractMinecartEntity) {
        super(minecart)
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

    moveOnRail(world: World) {
        const moveIteration = new MoveIteration()
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

            if (adjustedVelocity.length() < 1.0E-5) {
                this.setVelocityVec3d(Vec3d.ZERO);
            } else {
                // Choose facing direction
                let [ahead, behind] = AbstractMinecartEntity.getAdjacentRailPositionsByShape(railShape)
                if (adjustedVelocity.dotProduct(Vec3d.fromVec3i(ahead)) < adjustedVelocity.dotProduct(Vec3d.fromVec3i(behind))) {
                    const temp = ahead
                    ahead = behind
                    behind = temp
                }

                // Get rails ahead
                const points: {pos: Vec3d, distance: number}[] = this.lookAhead(blockPos, ahead, LOOKAHEAD_DISTANCE)
                this.minecart.canvasLines.push({
                    points: points.map(point => point.pos),
                    color: "#ff0000",
                })

                const newVelocity = this.derailmentAdjustedVelocity(adjustedVelocity, blockPos, points)

                // Apply new velocity
                this.setVelocityVec3d(newVelocity)
                this.minecart.move(MovementType.SELF, newVelocity);
            }
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
    lookAhead(blockPos: BlockPos, dir: Vec3i, distance: number) {
        const positions: {pos: Vec3d, distance: number}[] = []
        let headed = dir
        let currentPos = Vec3d.ofBottomCenter(blockPos).addXYZ(0, 0.1, 0)

        for (let i = 0; i < distance; i++) {
            let currentState = this.getWorld().getBlockState(BlockPos.ofFloored(currentPos))

            // Check block below predicted in case there is a descending rail
            if (!AbstractRailBlock.isRail(currentState)) {
                const posBelow = currentPos.subtractXYZ(0, 1, 0)
                const stateBelow = this.getWorld().getBlockState(BlockPos.ofFloored(posBelow))
                if (!AbstractRailBlock.isRail(stateBelow)) {
                    break
                }
                currentPos = posBelow
                currentState = stateBelow
            }

            const currentShape = currentState.get() as RailShape

            headed = this.next(new Vec3i(headed.getX(), 0, headed.getZ()), currentShape)
            currentPos = currentPos.addVec3d(Vec3d.fromVec3i(headed))
            positions.push({pos: currentPos, distance: i + 1})
        }
        return positions
    }
    next(headed: Vec3i, nextShape: RailShape) {
        if (headed.equals(Direction.NORTH)) {
            switch (nextShape) {
                case RailShape.NORTH_SOUTH:
                case RailShape.NORTH_EAST:
                case RailShape.NORTH_WEST:
                    return Direction.NORTH
                case RailShape.SOUTH_EAST:
                    return Direction.EAST
                case RailShape.SOUTH_WEST:
                    return Direction.WEST
                default:
                    throw new Error("INVALID HEADED DIRECTION")
            }
        } else if (headed.equals(Direction.SOUTH)) {
            switch (nextShape) {
                case RailShape.NORTH_SOUTH:
                case RailShape.SOUTH_EAST:
                case RailShape.SOUTH_WEST:
                    return Direction.SOUTH
                case RailShape.NORTH_EAST:
                    return Direction.EAST
                case RailShape.NORTH_WEST:
                    return Direction.WEST
                default:
                    throw new Error("INVALID HEADED DIRECTION")
            }
        } else if (headed.equals(Direction.EAST)) {
            switch (nextShape) {
                case RailShape.EAST_WEST:
                case RailShape.NORTH_EAST:
                case RailShape.SOUTH_EAST:
                    return Direction.EAST
                case RailShape.NORTH_WEST:
                    return Direction.NORTH
                case RailShape.SOUTH_WEST:
                    return Direction.SOUTH
                default:
                    throw new Error("INVALID HEADED DIRECTION")
            }
        } else if (headed.equals(Direction.WEST)) {
            switch (nextShape) {
                case RailShape.EAST_WEST:
                case RailShape.NORTH_WEST:
                case RailShape.SOUTH_WEST:
                    return Direction.WEST
                case RailShape.NORTH_EAST:
                    return Direction.NORTH
                case RailShape.SOUTH_EAST:
                    return Direction.SOUTH
                default:
                    throw new Error("INVALID HEADED DIRECTION")
            }
        }
        throw new Error("INVALID HEADED DIRECTION")
    }
    /**
     * 
     * @param points Lookahead points to consider
     */
    averageDirection(currentPos: Vec3d, points: {pos: Vec3d, distance: number}[]) {
        let totalX = 0
        let totalY = 0
        let totalZ = 0
        let totalWeight = 0

        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            const weight = 1
            // const weight = 1 / (0.25 * p.distance + 1);
            // const weight = (1 / p.distance) + 1
            // const weight = Math.exp(-0.5 * Math.pow(Math.abs(i - points.length) / points.length, 2)); // Gaussian-like
            totalX += (p.pos.x - currentPos.x) * weight;
            totalY += (p.pos.y - currentPos.y) * weight;
            totalZ += (p.pos.z - currentPos.z) * weight;
            totalWeight += weight;
        }

        return Vec3d.fromXYZ(
            totalX / totalWeight,
            totalY / totalWeight,
            totalZ / totalWeight
        ).normalize()
    }
    derailmentAdjustedVelocity(adjustedVelocity: Vec3d, blockPos: BlockPos, points: {pos: Vec3d, distance: number}[]) {
        function toKey(vec: Vec3i) {
            const block = BlockPos.ofFloored(vec)
            return `${block.getX()},${block.getZ()}`
        }
        
        // Store rails ahead in set
        const pointsSet = new Set(points.map(point => toKey(point.pos)))
        pointsSet.add(toKey(blockPos))

        // Get speed and current position
        const currentPos = this.getPos()
        const currentSpeed = adjustedVelocity.length()
        
        let raycastCache = Array(Math.max(CHECK_FOR_RAIL_AHEAD, 1)).fill(null)

        // Derailment prevention - repeatedly retry to smoothen the curve with fewer samples until the predicted position lands on the predicted path
        for (let i = points.length; i > 0; i--) {
            const averageDirection = this.averageDirection(currentPos, points.slice(0, i))
            const averageVelocity = averageDirection.multiplyConst(currentSpeed)

            const hue = (240 + (60 * (points.length - i))) % 360
            this.minecart.canvasLines.push({
                points: [currentPos, currentPos.addVec3d(averageVelocity)],
                color: `hsl(${hue}, 100%, 50%)`
            })

            const predictedBlock = BlockPos.ofFloored(currentPos.addVec3d(averageVelocity))
            if (!pointsSet.has(toKey(predictedBlock))) {
                continue
            }

            // if (0 === CHECK_FOR_RAIL_AHEAD) return averageVelocity

            if (raycastCache[0] === null) {
                raycastCache[0] = averageVelocity
            }

            // Mark direction as valid if all blocks hit by the raycast is a rail
            for (let distance = 1; distance <= CHECK_FOR_RAIL_AHEAD; distance++) {
                const scaledVelocity = averageDirection.multiplyConst(distance)
                // const raycastBlock = BlockPos.ofFloored(currentPos.addVec3d(scaledVelocity))
                // If ray lands on a rail
                if (!pointsSet.has(toKey(currentPos.addVec3d(scaledVelocity)))) break

                // If it's the most samples for the given raycast distance, register it
                if (distance === CHECK_FOR_RAIL_AHEAD) {
                    return averageVelocity
                }
                if (raycastCache[distance] === null) {
                    raycastCache[distance] = averageVelocity
                }
            }
        }

        for (let velocity of raycastCache.reverse()) {
            if (velocity != null) {
                return velocity
            }
        }

        return adjustedVelocity
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