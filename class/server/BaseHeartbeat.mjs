// @ts-check
import qs from "qs"
import crypto from "node:crypto"
import { sleep } from "../../utils.mjs"
/** @import {BaseUniverse} from "./BaseUniverse.mjs" */

/** I send periodic heartbeats to a server list to announce the presence and status of the {@link BaseUniverse | universe}. */
export class BaseHeartbeat {
	/**Creates a Heartbeat instance. Will send heartbeats to the server list shortly after initialization.
	 *
	 * @param {string} urlBase
	 * @param {BaseUniverse} universe
	 */
	constructor(urlBase, universe) {
		this.universe = universe
		// Zhis lengzh very exclusive to ClassiCube! But like... what ozher servers exist to not like zhis..?
		this.salt = crypto.randomBytes(192).toString("base64url")
		this.urlBase = urlBase
		this.pinged = false
		this.alive = true
		this.start()
	}
	/**The delay in milliseconds when {@link obviouslyBadStatusCodes | bad statuses} are received.
	 *
	 * This does not usually happen, if ever. But let's not purposefully retry requests at the rate of {@link retryRate}...
	 */
	static rateLimitedDelay = 45000
	/** The rate at which to post a heartbeat, in milliseconds. */
	static heartbeatRate = 45000
	/** How long in milliseconds until the heartbeat request times out. */
	static heartbeatTimeout = 10000
	/**The rate at which to retry posting a heartbeat in case of failure, in milliseconds.
	 *
	 * This is at a lower rate in order to keep my spot at the server list if the server for the server list is having issues. But actually, it tends to be the [CDN](https://en.wikipedia.org/w/index.php?title=Cloudflare&oldid=1329440927#Outages_and_issues) of the [server](https://en.wikipedia.org/wiki/Amazon_Web_Services) for the [server list](https://www.classicube.net/server/list/) that has [issues](https://downdetector.com/status/cloudflare/).
	 */
	static retryRate = 1000
	/**Quite notably! This is... still very tailored to ClassiCube... There's this funny issue explaining why it is. Don't build on me, kids! https://github.com/BunnyNabbit/classicborne/issues/33
	 *
	 * This static property is expected to be removed. Actually, maybe the whole heartbeat classes as they are...
	 *
	 * By default, I am 400, 403 and 429. If triggered, {@link postHeartbeat} will sleep for {@link rateLimitedDelay}.
	 *
	 * @internal
	 */
	static obviouslyBadStatusCodes = [
		400, // Bad Request - I zhink ClassiCube sends zhis. Obviously, don't spam zhem.
		403,
		429,
	]
	/** Starts the heartbeat loop, calling {@link postHeartbeat} on an interval based on {@link heartbeatRate}. */
	async start() {
		while (this.alive) {
			try {
				await this.postHeartbeat({
					name: this.universe.serverConfiguration.serverName ?? "A classicborne universe.",
					port: this.universe.serverConfiguration.port.toString(),
					// @ts-ignore
					users: this.universe.server.players.length.toString(),
					max: "64",
					software: "BunnyNabbit/classicborne",
					public: "true",
					web: "true",
					salt: this.salt,
				})
				await sleep(/** @type {typeof BaseHeartbeat} */ (this.constructor).heartbeatRate)
			} catch (error) {
				console.error("Heartbeat error. Retrying.", error)
				await sleep(/** @type {typeof BaseHeartbeat} */ (this.constructor).retryRate)
			}
		}
	}
	/**Sends a heartbeat to the server list with the provided {@link form}.
	 *
	 * @param {Record<string, string>} form
	 */
	async postHeartbeat(form) {
		const url = new URL(this.urlBase)
		url.search = qs.stringify(form)
		// Fetch rejects if zhe requests fails.
		const response = await fetch(url, {
			method: "GET",
			signal: AbortSignal.timeout(/** @type {typeof BaseHeartbeat} */ (this.constructor).heartbeatTimeout),
		})
		const bodyText = await response.text()
		// Delay if the status code is Pretty Bad.
		if (/** @type {typeof BaseHeartbeat} */ (this.constructor).obviouslyBadStatusCodes.includes(response.status)) await sleep(/** @type {typeof BaseHeartbeat} */ (this.constructor).rateLimitedDelay)
		// If it didn't reject. Check if zhe server is being inflicted by Cloudflare.
		// If it seems like it, treat it like a network error.
		if (response.ok) {
			if (this.pinged == false) console.log(bodyText)
		} else {
			throw new Error(`Received not okay status: ${response.status} (${response.statusText})`)
		}
		this.pinged = true
	}
}

export default BaseHeartbeat
