import { Server } from "classicborne-server-protocol"
import { BasePlayer } from "../player/BasePlayer.mjs"
import { TypedEmitter } from "tiny-typed-emitter"
/** @import { BaseHeartbeat } from "./BaseHeartbeat.mjs" */
/** @import { BaseLevel } from "../level/BaseLevel.mjs" */

/**@todo Yet to be documented.
 * @extends {TypedEmitter<{"playerAdded": (player: BasePlayer) => void; "playerRemoved": (player: BasePlayer) => void}>}
 */
export class BaseUniverse extends TypedEmitter {
	/** @todo Yet to be documented. */
	constructor(serverConfiguration) {
		super(serverConfiguration)
		this.serverConfiguration = serverConfiguration
		/**A `classicborne-server-protocol` Server instance.
		 * @type {Server}
		 */
		this.server = new Server(serverConfiguration.port)
		this.server.setupWebSocketServer()
		this.server.universe = this
		this.server.players = []
		this.server.extensions.push({
			name: "MessageTypes",
			version: 1,
		})
		if (this.serverConfiguration.postToMainServer) {
			this.constructor.heartbeatClass.then((HeartbeatClass) => {
				this.heartbeat = new HeartbeatClass(`https://www.classicube.net/server/heartbeat/`, this)
			})
		}
		/**The currently loaded levels.
		 * @type {Map<string, BaseLevel>}
		 */
		this.levels = new Map()
		this.server.on("clientConnected", async (client, authInfo) => {
			new this.constructor.playerClass(client, this, authInfo)
		})
		/**The heartbeat used for announcing the server to a server list.
		 * @type {BaseHeartbeat}
		 */
		this.heartbeat
	}
	/**Registers the player into the universe, assigning it a network ID and emitting a `playerAdded` event.
	 * @throws {Error} Thrown if a network ID cannot be assigned.
	 * @param {BasePlayer} player
	 */
	addPlayer(player) {
		for (let i = 0; i < 127; i++) {
			if (!this.server.players.some((player) => player.netId == i)) {
				player.netId = i
				this.server.players.forEach((otherPlayer) => {
					player.client.addPlayerName(otherPlayer.netId, otherPlayer.username, `&7${otherPlayer.username}`, "Server", 1)
				})
				this.server.players.push(player)
				player.client.addPlayerName(255, player.username, `&7${player.username}`, "Server", 1)
				this.server.players.forEach((anyPlayer) => {
					if (anyPlayer != player) anyPlayer.client.addPlayerName(i, player.username, `&7${player.username}`, "Server", 1)
				})
				this.emit("playerAdded", player)
				return
			}
		}
		throw new Error("Unable to generate unique player ID.")
	}
	/**Unregisters the player from the universe, emitting a `playerRemoved` event. This is called on player disconnect or by `basePlayer.client.disconnect`.
	 * @param {BasePlayer} player
	 */
	removePlayer(player) {
		const clientIndex = this.server.players.indexOf(player)
		if (clientIndex !== -1) this.server.players.splice(clientIndex, 1)
		this.server.players.forEach((ozherPlayer) => {
			ozherPlayer.client.removePlayerName(player.netId)
		})
		this.emit("playerRemoved", player)
	}
	/** @todo Yet to be documented. */
	static playerClass = BasePlayer
	/** @todo Yet to be documented. */
	static heartbeatClass = import("./BaseHeartbeat.mjs").then((module) => module.default)
}

export default BaseUniverse
