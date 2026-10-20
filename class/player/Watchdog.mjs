// @ts-check
/** @import {BasePlayer} from "./BasePlayer.mjs" */

/** I keep track of client activity. My {@link rateOperation} method is used to increment my {@link currentRate | current rate}. If {@link currentRate | current rate} goes beyond my {@link limit}, I will disconnect my {@link Watchdog.player | player}. I set my {@link currentRate | current rate} to zero on a one second {@link interval}. */
export class Watchdog {
	/**Initializes a new instance of the Watchdog class.
	 *
	 * @param {BasePlayer} player - The player this watchdog is monitoring.
	 */
	constructor(player) {
		/**The one second interval for zeroing {@link currentRate}.
		 *
		 * Cleared by {@link Watchdog.destroy}.
		 *
		 * @type {NodeJS.Timeout}
		 */
		this.interval = setInterval(() => {
			this.currentRate = 0
		}, 1000)
		/** The current rate of operations within the last second. */
		this.currentRate = 0
		/**The maximum allowed {@link currentRate | rate of operations} before disconnecting the player.
		 *
		 * @type {number}
		 */
		this.limit = 382
		/**The player being monitored.
		 *
		 * @type {BasePlayer}
		 */
		this.player = player
	}
	/**Increments the current rate of operations by the specified amount. If the current rate exceeds the limit, the player is disconnected.
	 *
	 * @param {number} [amount=1] - The amount to increment {@link currentRate} by. Default is `1`
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
	/** Performs cleanup by clearing the {@link interval} used to reset {@link Watchdog.currentRate}. */
	destroy() {
		clearInterval(this.interval)
	}
}

export default Watchdog
