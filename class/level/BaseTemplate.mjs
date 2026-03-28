// @ts-check
import { Buffer } from "node:buffer"
/** @import {Vector3} from "../../types/arrayLikes.mjs" */

/** @todo Yet to be documented. */
export class BaseTemplate {
	/**Create a new template with an icon and default bounds.
	 *
	 * @param {string} iconName - The name of the template.
	 * @param {Vector3} defaultBounds - The default bounds for the template as [x, y, z].
	 */
	constructor(iconName, defaultBounds = [64, 64, 64]) {
		if (!iconName) throw new Error("iconName not provided.")
		/**The name of the template.
		 *
		 * @type {string}
		 */
		this.iconName = iconName
		/**The default bounds for this template.
		 *
		 * @type {Vector3}
		 */
		this.defaultBounds = defaultBounds
	}
	/**Generate a level buffer. Subclasses must override this method.
	 *
	 * @abstract
	 * @returns {Buffer}
	 * @ts-ignore
	 */
	generate(bounds = this.defaultBounds) {
		throw new Error("Template generate method not implemented.")
	}
}

/** I'm a template that generates an empty level buffer of the specified size. */
export class EmptyTemplate extends BaseTemplate {
	/** Create an empty template with the default icon name. */
	constructor() {
		super("empty")
	}
	/**Generate an empty buffer for the given bounds.
	 *
	 * @param {Vector3} [bounds=this.defaultBounds] - The bounds for the empty level. Default is `this.defaultBounds`
	 * @returns {Buffer}
	 */
	generate(bounds = this.defaultBounds) {
		return Buffer.alloc(bounds[0] * bounds[1] * bounds[2])
	}
}

export default BaseTemplate
