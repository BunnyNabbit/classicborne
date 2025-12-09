// @ts-check
/** @import { BasePlayer } from "./BasePlayer.mjs" */

/**
 * I keep track of client activity. My {@link Watchdog.rateOperation} method is used to increment my {@link Watchdog.currentRate}. If {@link Watchdog.currentRate} goes beyond my {@link Watchdog.limit}, I will disconnect my {@link Watchdog.player}. I set {@link Watchdog#currentRate} to zero on a one second interval.
 */
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
		/** @type {BasePlayer} */
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
