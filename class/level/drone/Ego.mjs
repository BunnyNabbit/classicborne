// @ts-check
/** @import { Vector3 } from "../../../types/arrayLikes.mjs" */

/** Represents a drone's appearance. */
export class Ego {
	/** @todo Yet to be documented. */
	constructor(ego = {}) {
		this.name = ego.name || ""
		this.scale = ego.scale || [1, 1, 1]
		this.skin = ego.skin || this.name
	}
	/**@todo Yet to be documented.
	 * @param {string} skin
	 * @returns
	 */
	setSkin(skin) {
		this.skin = skin
		return this
	}
	/**@todo Yet to be documented.
	 * @param {Vector3} scale
	 * @returns
	 */
	setScale(scale) {
		this.scale = scale
		return this
	}
	/**@todo Yet to be documented.
	 * @param {string} name
	 * @returns
	 */
	setName(name) {
		this.name = name
		return this
	}
	/** @todo Yet to be documented. */
	serialize() {
		return {
			name: this.name,
			skin: this.skin,
			scale: this.scale,
		}
	}
}

export default Ego
