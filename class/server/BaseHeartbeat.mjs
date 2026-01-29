// @ts-check
import qs from "qs"
import axios from "axios"
import crypto from "crypto"
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
		this.salt = crypto.randomBytes(192).toString("base64url")
		this.urlBase = urlBase
		this.pinged = false
		this.alive = true
		this.start()
	}
	/** The rate at which to post a heartbeat, in milliseconds. */
	static heartbeatRate = 45000
	/**The rate at which to retry posting a heartbeat in case of failure, in milliseconds.
	 * 
	 * This is at a lower rate in order to keep my spot at the server list if the server for the server list is having issues. But actually, it tends to be the [CDN](https://en.wikipedia.org/w/index.php?title=Cloudflare&oldid=1329440927#Outages_and_issues) of the [server](https://en.wikipedia.org/wiki/Amazon_Web_Services) for the [server list](https://www.classicube.net/server/list/) that has [issues](https://downdetector.com/status/cloudflare/).
	 */
	static retryRate = 1000
	/** @todo Yet to be documented. */
	async start() {
		while (this.alive) {
			try {
				await this.postHeartbeat({
					name: this.universe.serverConfiguration.serverName ?? "A classicborne server.",
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
	/**@todo Yet to be documented.
	 *
	 * @param {Record<string, string>} form
	 */
	async postHeartbeat(form) {
		await axios.post(this.urlBase, qs.stringify(form)).then((response) => {
			if (this.pinged == false) console.log(response.data)
			this.pinged = true
		})
	}
}

export default BaseHeartbeat
