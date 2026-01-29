// @ts-check
/** @import {Vector3} from "../../../types/arrayLikes.mjs" */
/** @import {Drone} from "./Drone.mjs" */

/** I represent a {@link Drone | drone's} appearance. */
export class Ego {
	/**Creates a new ego instance.
	 *
	 * @param {Object} ego - The ego properties.
	 */
	constructor(ego = {}) {
		this.name = ego.name || ""
		this.scale = ego.scale || [1, 1, 1]
		this.skin = ego.skin || this.name
	}
	/**Sets the skin of the entity. Limited to 64 characters.
	 *
	 * What skin a string resolves to is dependent on the client. ClassiCube expects usernames to be ClassiCube accounts and fetches skins from its own servers. ClassiCube also supports loading custom skins by specifying a URL as the skin. For other clients, the skin string may resolve differently.
	 *
	 * @param {string} skin - The skin identifier (e.g., username or URL).
	 * @returns {this}
	 */
	setSkin(skin) {
		this.skin = skin
		return this
	}
	/**Sets the scale of the entity model.
	 *
	 * @param {Vector3} scale
	 * @returns {this}
	 */
	setScale(scale) {
		this.scale = scale
		return this
	}
	/**Sets the name of the entity. Limited to 64 characters.
	 *
	 * Some clients may use the name to determine the skin.
	 *
	 * @param {string} name
	 * @returns {this}
	 */
	setName(name) {
		this.name = name
		return this
	}
	/**Serializes the ego's properties into an object. This can be passed into an {@link Ego} constructor.
	 *
	 * @returns {Object} An object containing the ego's name, skin and scale.
	 */
	serialize() {
		return {
			name: this.name,
			skin: this.skin,
			scale: this.scale,
		}
	}
}

export default Ego
