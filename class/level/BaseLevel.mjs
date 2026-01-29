import { Drone } from "./drone/Drone.mjs"
import { Ego } from "./drone/Ego.mjs"
import { TypedEmitter } from "tiny-typed-emitter"
import { componentToHex } from "../../utils.mjs"
import { EmptyTemplate } from "./BaseTemplate.mjs"
import { BaseLevelCommandInterpreter } from "./BaseLevelCommandInterpreter.mjs"
/** @import {BasePlayer} from "../player/BasePlayer.mjs" */
/**@import {
 *   Vector2,
 *   Vector3
 * } from "../../types/arrayLikes.mjs"
 */
/** @import {Client} from "classicborne-server-protocol/class/Client.mjs" */
// /** @import { LevelCommand } from "./levelCommands.mjs" */
/** @import {BaseTemplate} from "./BaseTemplate.mjs" */
/** @import {BaseUniverse} from "../server/BaseUniverse.mjs" */
/** @import {ChangeRecord} from "./changeRecord/ChangeRecord.mjs" */
/** @import {NullChangeRecord} from "./changeRecord/NullChangeRecord.mjs" */

/**@todo Yet to be documented.
 *
 * @template {Record<string, any>} E
 * @extends {TypedEmitter<{ playerAdded: (player: BasePlayer) => void; playerRemoved: (player: BasePlayer) => void; loaded: () => void; unloaded: () => void; levelLoaded: () => void } & E>}
 */
export class BaseLevel extends TypedEmitter {
	/**Initializes a new instance of the BaseLevel class.
	 *
	 * @param {Vector3} bounds
	 * @param {Buffer} blocks
	 */
	constructor(bounds, blocks) {
		super()
		/**The players currently in the level.
		 *
		 * @type {BasePlayer[]}
		 */
		this.players = []
		/**The bounds of the level.
		 *
		 * @type {Vector3}
		 */
		this.bounds = bounds
		/**The buffer representing the level's blocks.
		 *
		 * @type {Buffer}
		 */
		this.blocks = blocks
		/**Usernames of who is allowed to build in the level. {@link BaseLevel.userHasPermission} checks against this list. If empty, everyone is allowed.
		 *
		 * @type {string[]}
		 */
		this.allowList = []
		/**The set of drones currently in the level.
		 *
		 * @type {Set<Drone>}
		 */
		this.drones = new Set()
		/**Drones which are linked to clients in the level.
		 *
		 * @type {Map<Client, Drone>}
		 */
		this.clientDrones = new Map()
		this.commandInterpreter = new /** @type {typeof BaseLevel} */ (this.constructor).commandInterpreterClass(this)
		/** @type {boolean} */
		this.loading
		/** @type {boolean} */
		this.blocking
		/** @type {ChangeRecord | NullChangeRecord} */
		this.changeRecord
	}
	/**Sends all {@link Drone | drones} in the level to the specified {@link BasePlayer | player}.
	 *
	 * @param {BasePlayer} player - The player to send the drones to.
	 */
	sendDrones(player) {
		this.drones.forEach((drone) => {
			player.droneTransmitter.addDrone(drone)
		})
	}
	/**Removes a {@link BasePlayer | player} from the level.
	 *
	 * @param {BasePlayer} player - The player to be removed.
	 */
	removePlayer(player) {
		player.space = null
		const index = this.players.indexOf(player)
		if (index !== -1) this.players.splice(index, 1)
		const drone = this.clientDrones.get(player.client)
		this.clientDrones.delete(player.client)
		this.removeDrone(drone)
		player.droneTransmitter.clearDrones()
		this.emit("playerRemoved", player)
	}
	/**Removes a {@link Drone | drone} from the level.
	 *
	 * @param {Drone} drone - The drone to be removed.
	 */
	removeDrone(drone) {
		drone.destroy()
		this.drones.delete(drone)
	}
	/**Adds a {@link Drone | drone} to the level.
	 *
	 * @param {Drone} drone - The drone to be added.
	 */
	addDrone(drone) {
		this.players.forEach((player) => {
			player.droneTransmitter.addDrone(drone)
		})
		this.drones.add(drone)
	}
	/**Adds a {@link BasePlayer | player} to the level.
	 *
	 * @param {BasePlayer} player - The player to be added.
	 */
	addPlayer(player, position = [0, 0, 0], orientation = [0, 0]) {
		this.emit("playerAdded", player)
		player.space = this
		this.loadPlayer(player, position, orientation)
		this.sendDrones(player)
		const drone = new Drone(new Ego({ name: player.getDisplayName() }))
		this.clientDrones.set(player.client, drone)
		this.addDrone(drone)
		this.players.push(player)
		player.teleporting = false
	}
	/**Sends the level data to the specified {@link BasePlayer | player}. This is typically called on {@link BaseLevel.addPlayer}.
	 *
	 * @param {BasePlayer} player
	 * @param {Vector3} [position=[0,0,0]] Default is `[0,0,0]`
	 * @param {Vector2} [orientation=[0,0]] Default is `[0,0]`
	 */
	loadPlayer(player, position = [0, 0, 0], orientation = [0, 0]) {
		player.client.loadLevel(
			this.blocks,
			...this.bounds,
			false,
			() => {
				player.client.setClickDistance(10000)
				player.emit("levelLoaded")
			},
			() => {
				if (this.blockset) BaseLevel.sendBlockset(player.client, this.blockset)
				if (this.environment) player.client.extensions.get("LevelEnvironment").setEnvironmentProperties(this.environment)
				if (this.texturePackUrl) player.client.extensions.get("LevelEnvironment").texturePackUrl(this.texturePackUrl)
				player.client.extensions.get("BlockPermissions").setBlockPermission(7, 1, 1)
				player.client.extensions.get("BlockPermissions").setBlockPermission(8, 1, 1)
				player.client.extensions.get("BlockPermissions").setBlockPermission(9, 1, 1)
				player.client.extensions.get("BlockPermissions").setBlockPermission(10, 1, 1)
				player.client.extensions.get("BlockPermissions").setBlockPermission(11, 1, 1)
				player.client.extensions.get("ExtendedPlayerList").configureSpawn(-1, player.authInfo.username, position[0], position[1], position[2], orientation[0], orientation[1], player.authInfo.username)
			}
		)
	}
	/** Reloads all players in the level, typically used to refresh the level's state. */
	reload() {
		this.players.forEach((player) => {
			const reloadedPosition = Array.from(player.position)
			const heightOffset = 22 / 32 // Player spawn height is different from reported height. Offset by # fixed-point units.
			reloadedPosition[1] -= heightOffset
			this.loadPlayer(player, reloadedPosition, player.orientation)
			player.droneTransmitter.resendDrones()
		})
	}
	/**Sets a block at the specified position in the level.
	 *
	 * @param {Vector3} position - The position to set the block at.
	 * @param {number} block - The block type to set.
	 * @param {BasePlayer[]} [excludePlayers=[]] Default is `[]`
	 * @param {boolean} [saveToRecord=true] Default is `true`
	 */
	setBlock(position, block, excludePlayers = [], saveToRecord = true) {
		this.blocks.writeUInt8(block, position[0] + this.bounds[0] * (position[2] + this.bounds[2] * position[1]))
		this.players.forEach((player) => {
			if (!excludePlayers.includes(player)) player.client.setBlock(block, ...position)
		})
		if (saveToRecord) {
			this.changeRecord.addBlockChange(position, block)
			if (!this.changeRecord.draining && this.changeRecord.currentActionCount > 1024) this.changeRecord.flushChanges()
		}
	}
	/**Sets a block at the specified position in the level without notifying players.
	 *
	 * @param {Vector3} position - The position to set the block at.
	 * @param {number} block - The block type to set.
	 */
	rawSetBlock(position, block) {
		this.blocks.writeUInt8(block, position[0] + this.bounds[0] * (position[2] + this.bounds[2] * position[1]))
	}
	/**Gets the block type at the specified position in the level.
	 *
	 * @param {Vector3} position - The position to get the block from.
	 * @returns {number} The block type at the specified position.
	 */
	getBlock(position) {
		return this.blocks.readUInt8(position[0] + this.bounds[0] * (position[2] + this.bounds[2] * position[1]))
	}
	/**Checks if a position is within the level bounds.
	 *
	 * @param {Vector3} position - The position to check.
	 * @returns {boolean} Whether the position is within the level bounds.
	 */
	withinLevelBounds(position) {
		if (position.some((num) => isNaN(num))) return false
		if (position[0] < 0 || position[1] < 0 || position[2] < 0) return false
		if (position[0] >= this.bounds[0] || position[1] >= this.bounds[1] || position[2] >= this.bounds[2]) return false
		return true
	}
	/**Checks if a user has permission to edit the level.
	 *
	 * @param {string} username - The username to check.
	 * @returns {boolean} Whether the user has permission.
	 */
	userHasPermission(username) {
		if (this.allowList.length == 0) return true
		if (this.allowList.includes(username)) return true
		return false
	}
	/**@todo Yet to be documented.
	 *
	 * @param {string} command
	 * @returns {LevelCommand} The command class, or `null` if not found.
	 */
	static getCommandClassFromName(command) {
		command = command.split(" ")
		const commandName = command[0].toLowerCase()
		let commandClass = this.commands.find((otherCommand) => otherCommand.name.toLowerCase() == commandName)
		if (!commandClass) commandClass = this.commands.find((otherCommand) => otherCommand.aliases.includes(commandName))
		return commandClass
	}
	/**Destroys the level, releasing any resources used for it.
	 *
	 * @param {boolean} [saveChanges=true] If true, I will flush any pending block changes to my {@link ChangeRecord} before disposing it. Default is `true`
	 */
	async dispose(saveChanges = true) {
		if (!this.changeRecord.draining && this.changeRecord.dirty && saveChanges) {
			await this.changeRecord.flushChanges()
		}
		await this.changeRecord.dispose()
		this.emit("unloaded")
		this.removeAllListeners()
		this.commandInterpreter.dispose()
	}
	/**Sends a block set to a client.
	 *
	 * @param {Client} client - The client to send the block set to.
	 * @param {number[][]} blockset - The block set to send.
	 */
	static sendBlockset(client, blockset) {
		for (let i = 0; i < blockset.length; i++) {
			let walkSound = 5
			let texture = 79
			if (blockset[i][3] == 3) {
				walkSound = 6
				texture = 51
			}
			const block = {
				id: i + 1,
				name: `${blockset[i]
					.slice(0, 3)
					.map((component) => componentToHex(component))
					.join("")}#`,
				fogDensity: 127,
				fogR: blockset[i][0],
				fogG: blockset[i][1],
				fogB: blockset[i][2],
				draw: blockset[i][3],
				walkSound,
				topTexture: texture,
				leftTexture: texture,
				rightTexture: texture,
				frontTexture: texture,
				backTexture: texture,
				bottomTexture: texture,
				transmitLight: 1,
			}
			client.extensions.get("BlockDefinitions").defineBlock(block)
			client.extensions.get("BlockDefinitionsExtended").defineBlock(block)
		}
	}
	/**Loads a level into a {@link BaseUniverse} instance, creating it if it doesn't exist.
	 *
	 * @param {BaseUniverse} universe - The universe to load the level into.
	 * @param {string} spaceName - The identifier of the level. This will be used for {@link BaseUniverse.levels}.
	 * @param {Object} defaults - The default properties for the level.
	 * @returns {Promise<BaseLevel>} A promise that resolves to the loaded level.
	 */
	static async loadIntoUniverse(universe, spaceName, defaults) {
		const cached = universe.levels.get(spaceName)
		if (cached) return cached
		const bounds = defaults.bounds ?? this.bounds
		const template = defaults.template ?? this.template
		const templateBlocks = Buffer.from(await template.generate(bounds))
		const promise = new Promise(async (resolve) => {
			const levelClass = defaults.levelClass ?? this
			const level = new levelClass(bounds, templateBlocks, ...(defaults.arguments ?? []))
			level.template = template
			level.name = spaceName
			level.blockset = defaults.blockset ?? this.blockset
			level.environment = defaults.environment ?? this.environment
			level.texturePackUrl = defaults.texturePackUrl ?? universe.serverConfiguration.texturePackUrl
			level.allowList = defaults.allowList ?? []
			level.universe = universe
			let changeRecordClass
			if (defaults.useNullChangeRecord) {
				changeRecordClass = await import("./changeRecord/NullChangeRecord.mjs").then((module) => module.NullChangeRecord)
			} else {
				changeRecordClass = await import("./changeRecord/ChangeRecord.mjs").then((module) => module.ChangeRecord)
			}
			level.changeRecord = new changeRecordClass(`./blockRecords/${spaceName}/`, async () => {
				await level.changeRecord.restoreBlockChangesToLevel(level)
				level.emit("loaded")
				resolve(level)
			})
		})
		universe.levels.set(spaceName, promise)
		return promise
	}
	/**Teleports the player into the level. If level currently doesn't exist in universe, it'll be created.
	 *
	 * Levels extending Level are expected to override this method using this pattern:
	 *
	 * ```js
	 *  static async teleportPlayer(player, spaceName) {
	 *  	if (super.teleportPlayer(player) === false) return // Removes player from any levels they are in. If it returns false, the player is still being teleported somewhere.
	 *  	Level.loadIntoUniverse(player.universe, spaceName, { // Create the level using its desired defaults.
	 * 		levelClass: HubLevel,
	 *  	}).then(async (level) => { // Add player after it loads.
	 *  		level.addPlayer(player, [60, 8, 4], [162, 254])
	 *  	})
	 *  }
	 * ```
	 *
	 * @param {BasePlayer} player - The player to teleport.
	 * @param {string | null} [spaceName] - The identifier of the level to teleport to. Default is `null`
	 * @param {{}?} [defaults={}] Default is `{}`
	 */
	static async teleportPlayer(player, spaceName, defaults = {}) {
		if (player) {
			if (player.teleporting == true) return false
			player.teleporting = true
			if (player.space) player.space.removePlayer(player)
		}

		if (this === BaseLevel) {
			BaseLevel.loadIntoUniverse(player.universe, spaceName, defaults).then(async (level) => {
				level.addPlayer(player, [60, 8, 4], [162, 254])
			})
		}
	}
	/** @type {Vector3} */
	static bounds = [64, 64, 64]
	/**Defines the environmental properties of the level, such as sky and cloud settings.
	 *
	 * @todo Expose types from classicborne-server-protocol for better documentation.
	 */
	static environment = {
		sidesId: 7,
		edgeId: 250,
		edgeHeight: 0,
		cloudsHeight: 256,
	}
	/**Defines the block set used in the level.
	 *
	 * @type {number[][]}
	 */
	static blockset = []
	/** The template used to generate the level's blocks. */
	static template = new EmptyTemplate()
	/**Deprecated. Use {@link BaseLevel.bounds} instead.
	 *
	 * @deprecated
	 */
	static standardBounds = this.bounds
	/** @todo Yet to be documented. */
	static commands = []
	/** The default {@link BaseLevelCommandInterpreter} class for the level. */
	static commandInterpreterClass = BaseLevelCommandInterpreter
}

export default BaseLevel
