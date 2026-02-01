// @ts-check
import { Ego } from "./Ego.mjs"
import { TypedEmitter } from "tiny-typed-emitter"
/** @import {DroneTransmitter} from "./DroneTransmitter.mjs" */
/** @import {BasePlayer} from "../../player/BasePlayer.mjs" */
/** @import {BaseLevel} from "../../level/BaseLevel.mjs" */
/**@import {
 *   Vector2,
 *   Vector3
 * } from "../../../types/arrayLikes.mjs"
 */

/**Represents a drone entity for replicating character and positions of players and non-player entities.
 * 
 * I am added to {@link BasePlayer | players'} {@link DroneTransmitter} instances so my position and appearance can be synchronized to other players.
 * 
 * By default, {@link BaseLevel} adds me on {@link BaseLevel.addPlayer} to represent the player's character in the level. I get destroyed when the player leaves the level via {@link BaseLevel.removePlayer}.
 *
 * @extends {TypedEmitter<{ position: (position: Vector3, orientation: Vector2) => void; destroy: () => void }>}
 */
export class Drone extends TypedEmitter {
	/**Creates a new drone instance.
	 *
	 * @param {Ego} ego - The drone's appearance.
	 */
	constructor(ego = new Ego()) {
		super()
		this.position = [0, 0, 0]
		this.orientation = [0, 0]
		this.ego = ego
		/** Whether I am destroyed. {@link Drone#destroy} sets this value. */
		this.destroyed = false
	}
	/**Sets position and orientation of the drone.
	 *
	 * @param {Object} position - The position of the drone.
	 * @param {Object} orientation - The orientation of the drone.
	 */
	setPosition(position, orientation) {
		this.position = [position.x, position.y, position.z]
		this.orientation = [orientation.yaw, orientation.pitch]
		this.emit("position", this.position, this.orientation)
	}
	/** Destroys the drone, removing it from levels. */
	destroy() {
		if (this.destroyed) return
		this.destroyed = true
		this.emit("destroy")
		this.removeAllListeners()
	}
}

export default Drone
