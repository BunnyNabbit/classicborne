// @ts-check
/** @import {Level} from "../BaseLevel.mjs" */
/** @import {ChangeRecord} from "./ChangeRecord.mjs" */

/** I'm a dummy change record for a {@link BaseLevel}. Unlike {@link ChangeRecord}, I do not keep track of changes. Instead, my methods are very minimal and don't do much in terms of operation. */
export class NullChangeRecord {
	/**/
	constructor(path, loadedCallback = (/** @type {any} */ nullChangeRecord) => {}) {
		this.currentBuffer = null
		this.path = path
		this.draining = false
		this.dirty = false
		this.vhsFileHandle = null
		this.bounds = [64, 64, 64]
		this.actionCount = 0
		this.currentActionCount = 0
		setTimeout(() => {
			loadedCallback(this)
		}, 0)
	}
	/**No operation.
	 *
	 * @param {any} position
	 * @param {any} block
	 */
	addBlockChange(position, block) {
		this.appendAction(false, position.concat(block))
	}
	/**No operation.
	 *
	 * @param {any} isCommand
	 * @param {any} actionBytes
	 * @param {any} commandString
	 */
	appendAction(isCommand, actionBytes, commandString) {}
	/**Returns `0`.
	 *
	 * @returns {Promise<0>}
	 */
	async restoreBlockChangesToLevel() {
		return 0
	}
	/**Returns `0`.
	 *
	 * @returns {Promise<0>}
	 */
	async flushChanges() {
		return 0
	}
	/**Returns `0`.
	 *
	 * @returns {Promise<0>}
	 */
	async commit() {
		return 0
	}
	/** No operation. */
	async dispose() {}
	static lagKeyframeTime = 250 // milliseconds
}

export default NullChangeRecord
