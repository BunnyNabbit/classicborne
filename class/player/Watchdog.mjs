// @ts-check
/** @import {BasePlayer} from "./BasePlayer.mjs" */

/** I keep track of client activity. My {@link Watchdog.rateOperation} method is used to increment my {@link Watchdog.currentRate}. If {@link Watchdog.currentRate} goes beyond my {@link Watchdog.limit}, I will disconnect my {@link Watchdog.player}. I set {@link Watchdog#currentRate} to zero on a one second interval. */
export class Watchdog {
	/**Initializes a new instance of the Watchdog class.
	 *
	 * @param {BasePlayer} player - The player this watchdog is monitoring.
	 */
	constructor(player) {
		this.interval = setInterval(() => {
			this.currentRate = 0
		}, 1000)
		/** The current rate of operations within the last second. */
		this.currentRate = 0
		/** The maximum allowed rate of operations before disconnecting the player. */
		this.limit = 382
		/** @type {BasePlayer} */
		this.player = player
	}
	/**Increments the current rate of operations by the specified amount. If the current rate exceeds the limit, the player is disconnected.
	 *
	 * @param {number} [amount=1] - The amount to increment the current rate by. Default is `1`
	 * @returns {boolean} Returns true if the player was disconnected due to exceeding the limit, otherwise false.
	 */
	rateOperation(amount = 1) {
		this.currentRate += amount
		if (this.currentRate > this.limit) {
			this.player.client.disconnect("Sanctioned: Watchdog triggered")
			return true
		}
		return false
	}
	/** Performs cleanup by clearing the interval used to reset {@link Watchdog.currentRate}. */
	destroy() {
		clearInterval(this.interval)
	}
}

export default Watchdog
