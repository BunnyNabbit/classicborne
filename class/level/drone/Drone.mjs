// @ts-check
import { Ego } from "./Ego.mjs"
import { TypedEmitter } from "tiny-typed-emitter"
/** @import { Vector3, Vector2 } from "../../../types/arrayLikes.mjs" */

/**Represents a drone entity for replicating character and positions of player and non-player entities.
 * @extends {TypedEmitter<{"position": (position: Vector3, orientation: Vector2) => void; "destroy": () => void}>}
 */
export class Drone extends TypedEmitter {
	/**Creates a new drone instance.
	 * @param {Ego} ego - The drone's appearance.
	 */
	constructor(ego = new Ego()) {
		super()
		this.position = [0, 0, 0]
		this.orientation = [0, 0]
		this.ego = ego
		/** @todo Yet to be documented. */
		this.destroyed = false
	}
	/**Sets position and orientation of the drone.
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
