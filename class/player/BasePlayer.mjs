// @ts-check
import { DroneTransmitter } from "../level/drone/DroneTransmitter.mjs"
import { EventEmitter } from "node:events"
import { Watchdog } from "./Watchdog.mjs"
/** @import {Client} from "classicborne-server-protocol/class/Client.mjs" */
/** @import {BaseUniverse} from "../server/BaseUniverse.mjs" */
/** @import {BaseLevel} from "../level/BaseLevel.mjs" */
/**@import {
 *   Vector2,
 *   Vector3
 * } from "../../types/arrayLikes.mjs"
 */

/**I represent a client connection.
 *
 * ## Initialization
 *
 * The {@link BaseUniverse | universe} initializes me when a client connects to it. When I am created, I might not be valid. The routine in {@link BasePlayer.initialize} does most of the work, including authentication.
 */
export class BasePlayer extends EventEmitter {
	/**@param {Client} client - The [_classicborne-server-protocol_](https://bunnynabbit.github.io/classicborne-server-protocol/) client instance.
	 * @param {BaseUniverse} universe
	 * @param {any} authInfo
	 */
	constructor(client, universe, authInfo) {
		super()
		/**The [_classicborne-server-protocol_](https://bunnynabbit.github.io/classicborne-server-protocol/) client instance.
		 *
		 * @type {Client}
		 */
		this.client = client
		/**The universe the player connected from.
		 *
		 * @type {BaseUniverse}
		 */
		this.universe = universe
		this.client.player = this
		/**The raw `authInfo` object provided by the _classicborne-server-protocol_ library.
		 *
		 * @todo _classicborne-server-protocol_ should export types for this.
		 */
		this.authInfo = authInfo
		/**The username of the player.
		 *
		 * This is defined before it's verified by {@link BasePlayer.initialize}.
		 *
		 * @type {string}
		 */
		this.username = authInfo.username
		/** @type {BaseLevel | null} */
		this.space = null
		/** @type {Promise<boolean>} */
		this.ready = this.initialize(client, universe, authInfo)
		/**The network identifier assigned to the player.
		 *
		 * The {@link BaseUniverse | universe} assigns this value from {@link BaseUniverse.addPlayer}. The identifier is only used for the server's tab list.
		 *
		 * @type {number}
		 */
		this.netId
		/** @type {boolean} */
		this.teleporting
	}
	/**Asynchronously initializes the object, checking authentication information and setting up listeners. This is called by the constructor.
	 *
	 * In order:
	 *
	 * 1. Authentication is checked with {@link BasePlayer#checkAuthInfo}. If it doesn't return true, the client is kicked and the rest of the flow ends.
	 * 2. {@link BasePlayer#afterAuth} is called.
	 * 3. Event listeners are set using {@link BasePlayer#listenSetBlock} and {@link BasePlayer#listenPosition}.
	 * 4. If the class is not a subclass, the player is teleported to a {@link BaseLevel} with the identifier `classicborne-default`.
	 *
	 * @param {Client} client
	 * @param {BaseUniverse} universe
	 * @param {any} authInfo
	 */
	async initialize(client, universe, authInfo) {
		this.universe = universe
		this.authInfo = authInfo
		const rejectionReason = await this.checkAuthInfo(client, universe, authInfo)
		if (rejectionReason !== true) {
			client.disconnect(typeof rejectionReason === "string" ? rejectionReason : "Authentication failed.")
			return false
		}
		// do rest of property initialization
		/** @type {Vector3} */
		this.position = [0, 0, 0]
		/** @type {Vector2} */
		this.orientation = [0, 0]
		this.watchdog = new Watchdog(this)
		this.droneTransmitter = new DroneTransmitter(this.client)
		this.afterAuth()
		this.client.on("close", () => {
			this.destroyed = true
			if (this.space) this.space.removePlayer(this)
			this.watchdog.destroy()
			universe.removePlayer(this)
		})
		if (this.client.extensions.has("CustomBlocks")) this.client.extensions.get("CustomBlocks").sendSupportLevel(1)
		// setup events
		this.listenSetBlock()
		this.listenPosition()
		if (this.constructor == BasePlayer) {
			universe.addPlayer(this)
			const { BaseLevel } = await import("../level/BaseLevel.mjs")
			BaseLevel.teleportPlayer(this, "classicborne-default")
		}
		return true
	}
	/**I am intended to be overridden. When overridden, return true if the player is authenticated. If a string is returned, it is used as a reason for rejection.
	 *
	 * @abstract
	 * @param {Client} client
	 * @param {BaseUniverse} universe
	 * @param {any} authInfo
	 */
	async checkAuthInfo(client, universe, authInfo) {
		return true
	}
	/**Runs after authentication, but before the player was put into a level and set up its event listeners. I display the server identification banner, displaying `classicborne-server-protocol` and setting operator status`
	 *
	 * ```js
	 * this.client.serverIdentification("classicborne-server-protocol", "", 100)
	 * ```
	 */
	async afterAuth() {
		this.client.serverIdentification("classicborne-server-protocol", "", 100)
	}
	/**Gets the display name, ensuring it does not exceed the character limit for drones or player list entries.
	 *
	 * @param {string} [prefixTitle="&7"] - A title or color code placed before the username. Default is `"&7"`
	 */
	getDisplayName(prefixTitle = "&7") {
		const limit = 64
		return `${prefixTitle}${this.username}`.substring(0, limit)
	}
	/**Listens to the {@link client}'s `setBlock` events, performing {@link BaseLevel.setBlock} after checking permissions against {@link BaseLevel.userHasPermission}.
	 *
	 * I'm invoked by {@link BasePlayer.initialize}.
	 */
	listenSetBlock() {
		this.client.on("setBlock", (operation) => {
			if (this.watchdog.rateOperation()) return
			if (!this.space) return
			/** @type {Vector3} */
			const operationPosition = [operation.x, operation.y, operation.z]
			if (operationPosition.some((value, index) => value > this.space.bounds[index] - 1)) return
			let block = operation.type
			if (!this.space.userHasPermission(this.authInfo.username)) return
			if (operation.mode == 0) block = 0
			this.space.setBlock(operationPosition, block, [this.client])
		})
	}
	/**Listens to the {@link client}'s `position` events, updating {@link position}, {@link heldBlock}, {@link orientation} and the player's drone.
	 *
	 * I'm invoked by {@link BasePlayer.initialize}.
	 */
	listenPosition() {
		// TODO: consider emitting events on Player
		this.client.on("position", (position, orientation, heldBlock) => {
			this.position = [position.x, position.y, position.z]
			this.heldBlock = heldBlock
			this.orientation = [orientation.yaw, orientation.pitch]
			if (this.space) {
				const controlledDrone = this.space.clientDrones.get(this.client)
				if (controlledDrone) controlledDrone.setPosition(position, orientation)
			}
		})
	}
	/**Sends a message.
	 *
	 * The client can only display 64 characters for each message. To get around this, long messages are split up and an {@link continueAdornment | indicator} is prefixed to subsequent messages. This is most æffective for the default `0` {@link messageTypes | message type}, but behavior is still applied for other message types.
	 *
	 * Special behavior is done for right-aligned messages on {@link isClassiCubeMobile | mobile ClassiCube clients}. Because of the controller placements overlapping with the text, {@link rightAlignedMessageTypes message types for the right} have their messages pushed to the left as much as possible to avoid overlapping.
	 *
	 * @param {string} message - The string of the message.
	 * @param {number | number[]} types - A number or array representing {@link messageTypes | message types}.
	 * @param {string} [continueAdornment="> "] - The prefix for any continued messages. Default is `"> "`
	 */
	message(message, types = [0], continueAdornment = "> ") {
		const originalMessage = message
		if (typeof types === "number") types = [types]
		const maxLength = 64 - continueAdornment.length
		/** @type {string[]} */ const messages = []
		let currentColorCode = ""
		if (message.length <= maxLength) {
			// Handle short messages directly
			messages.push(message)
		} else {
			while (message.length > 0) {
				const effectiveMaxLength = maxLength - currentColorCode.length // Adjust for color code length
				if (message.length <= effectiveMaxLength) {
					messages.push((messages.length === 0 ? "" : continueAdornment) + currentColorCode + message)
					break
				}
				let splitIndex = message.lastIndexOf(" ", effectiveMaxLength)
				// Check if the split is within a color code
				const colorCodeIndex = message.lastIndexOf("&", effectiveMaxLength)
				if (colorCodeIndex > splitIndex && colorCodeIndex < effectiveMaxLength + 2 && /^[0-9a-f]$/.test(message[colorCodeIndex + 1])) splitIndex = colorCodeIndex - 1 // Split before the color code, if found within the last couple of chars
				if (splitIndex === -1 || splitIndex === 0) splitIndex = Math.min(effectiveMaxLength, message.length)
				const currentMessage = (messages.length === 0 ? "" : continueAdornment) + currentColorCode + message.substring(0, splitIndex)
				const match = message.substring(0, splitIndex).match(/&[0-9a-f](?!.*&[0-9a-f])/)
				if (match) currentColorCode = match[0]
				messages.push(currentMessage)
				message = message.substring(splitIndex).trim()
			}
		}

		types.forEach((type) => {
			if (type == 0) {
				messages.forEach((message) => {
					this.client.message(message, type)
				})
			} else if (originalMessage != " " && BasePlayer.rightAlignedMessageTypes.includes(type) && this.isClassiCubeMobile() && originalMessage.length < 64) {
				// pad string on right
				const maxPaddingLength = 18
				const paddingLength = Math.min(maxPaddingLength, 64 - originalMessage.length)
				const padding = `${" ".repeat(paddingLength - 1)}~`
				this.client.message(originalMessage + padding, type)
			} else {
				this.client.message(originalMessage, type)
			}
		})
	}
	/**Checks if the client is using a mobile _ClassiCube_ client.
	 *
	 * This specifically checks against _ClassiCube_'s mobile clients, as they have a usability issue regarding placement of text and controls. This issue is considered not a defect by its developer.
	 *
	 * > "Buttons are deliberately drawn over text in order to conserve space"<br>_- _UnknownShadow200_ [#🚽development](https://discord.com/channels/375484033427046404/778711150724513853/1411172473176850615) (ClassiCube Discord server)_
	 *
	 * This check may fail against _ClassiCube_ forks where the program name is changed.
	 *
	 * Checks against {@link BasePlayer.classiCubeMobileSuffixes}.
	 *
	 * @returns {boolean} `true`, if detected as a mobile client. `false` otherwise.
	 */
	isClassiCubeMobile() {
		if (this.client.appName.startsWith("ClassiCube") && BasePlayer.classiCubeMobileSuffixes.some((suffix) => this.client.appName.endsWith(suffix))) return true
	}
	/** I'm array containing client strings associated with _ClassiCube_ for mobile touchscreen devices. {@link BasePlayer.isClassiCubeMobile} uses me. */
	static classiCubeMobileSuffixes = ["android alpha", "iOS alpha", "web mobile"]
	/**Clears the displayed screen prints.
	 *
	 * @param {number[]} printTypes - The print type to clear out.
	 */
	clearPrints(printTypes = BasePlayer.printAreaTypes.bottom) {
		printTypes.forEach((printType) => {
			this.message(" ", printType)
		})
	}
	/** The message types associated with their numeric identifiers. */
	static messageTypes = {
		bottomLowestRow: 11,
		bottomMiddleRow: 12,
		bottomHighestRow: 13,
		topLowestRow: 3,
		topMiddleRow: 2,
		topHighestRow: 1,
		center: 100,
	}
	/** The {@link messageTypes | message types} categorized by the general area they cover. */
	static printAreaTypes = {
		bottom: [BasePlayer.messageTypes.bottomLowestRow, BasePlayer.messageTypes.bottomMiddleRow, BasePlayer.messageTypes.bottomHighestRow],
		top: [BasePlayer.messageTypes.topLowestRow, BasePlayer.messageTypes.topMiddleRow, BasePlayer.messageTypes.topHighestRow],
		center: [BasePlayer.messageTypes.center],
	}
	/** The {@link messageTypes | message types} aligned to the right. */
	static rightAlignedMessageTypes = [BasePlayer.messageTypes.bottomLowestRow, BasePlayer.messageTypes.bottomMiddleRow, BasePlayer.messageTypes.bottomHighestRow, BasePlayer.messageTypes.topLowestRow, BasePlayer.messageTypes.topMiddleRow, BasePlayer.messageTypes.topHighestRow]
	/**Sends the {@link defaultHotbar} to a given {@link player} instance. Overrides their current hotbar.
	 *
	 * @param {BasePlayer} player - The player to send the hotbar.
	 */
	static sendHotbar(player) {
		this.defaultHotbar.forEach((blockId, index) => {
			player.client.extensions.get("SetHotbar").setHotbar(blockId, index)
		})
	}
	/** The default hotbar {@link sendHotbar | to send}. I consist of nine numeric block identifiers. */
	static defaultHotbar = [1, 2, 3, 4, 5, 6, 7, 8, 9]
}
