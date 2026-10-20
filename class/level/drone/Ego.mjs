// @ts-check
/** @import {Vector3} from "../../../types/arrayLikes.mjs" */
/** @import {Drone} from "./Drone.mjs" */

/**I represent a {@link Drone | drone's} appearance.
 *
 * @example Building an ego with the helper methods
 *
 * ```js
 * new Ego().setName("Zolpiden").setSkin("draggy").setScale([1.2, 1.1, 1.2])
 * ```
 */
export class Ego {
	/**Creates a new ego instance.
	 *
	 * @param {Object} ego - The ego properties.
	 */
	constructor(ego = {}) {
		/**The name of the entity. Limited to 64 characters.
		 *
		 * @type {string}
		 */
		this.name = ego.name || ""
		/**The scale of the entity model.
		 *
		 * @type {Vector3}
		 */
		this.scale = ego.scale || [1, 1, 1]
		/**The skin of the entity. Limited to 64 characters.
		 *
		 * @type {string}
		 */
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
	 * @returns {Object} The ego's data in the form of a plain old _JavaScript_ object.
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
