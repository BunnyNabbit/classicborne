/** @import { BasePlayer } from "./BasePlayer.mjs" */

/** @todo Yet to be documented. */
export class Watchdog {
	/**@todo Yet to be documented.
	 * @param {BasePlayer} player
	 */
	constructor(player) {
		this.interval = setInterval(() => {
			this.currentRate = 0
		}, 1000)
		/** @todo Yet to be documented. */
		this.currentRate = 0
		/** @todo Yet to be documented. */
		this.limit = 382
		this.player = player
	}
	/** @todo Yet to be documented. */
	rateOperation(amount = 1) {
		this.currentRate += amount
		if (this.currentRate > this.limit) {
			this.player.client.disconnect("Sanctioned: Watchdog triggered")
			return true
		}
		return false
	}
	/** @todo Yet to be documented. */
	destroy() {
		clearInterval(this.interval)
	}
}

export default Watchdog
