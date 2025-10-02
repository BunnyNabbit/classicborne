# classicborne

[![NPM version badge](https://img.shields.io/npm/v/classicborne.svg)](http://npmjs.com/package/classicborne)
[![Open GitHub issues badge](https://img.shields.io/github/issues/bunnynabbit/classicborne)](https://github.com/BunnyNabbit/classicborne/issues)

A general purpose\* Minecraft Classic server with CPE support.

```js
import { BaseUniverse } from "classicborne/class/server/BaseUniverse.mjs"

const myUniverse = new BaseUniverse({
	port: 25565,
	postToMainServer: true,
})

// flush changes on all levels every 60 seconds
setInterval(() => {
	myUniverse.levels.forEach(async (level) => {
		level = await level
		if (level.changeRecord) level.changeRecord.flushChanges()
	})
}, 60000)
```

Extend it by subclassing base classes.

```js
import { BaseLevel } from "classicborne/class/level/BaseLevel.mjs"
import { BasePlayer } from "classicborne/class/player/BasePlayer.mjs"
import { BaseUniverse } from "classicborne/class/server/BaseUniverse.mjs"

class MyLevel extends BaseLevel {
	/** */
	constructor(...args) {
		super(...args)
		this.positionEventListeners = new Map()
		this.on("playerRemoved", async (player) => {
			const positionEventListener = this.positionEventListeners.get(player)
			player.client.removeListener("position", positionEventListener)
		})
		this.on("playerAdded", async (player) => {
			const onPosition = (position) => {
				console.log(position)
			}
			player.client.on("position", onPosition)
			this.positionEventListeners.set(player, onPosition)
		})
	}

	static async teleportPlayer(player) {
		if (super.teleportPlayer(player) === false) return
		MyLevel.loadIntoUniverse(player.universe, "my-level").then(async (level) => {
			level.addPlayer(player, [60, 8, 4], [162, 254])
		})
	}
}

class MyPlayer extends BasePlayer {
	/** */
	async initialize(...args) {
		const authenticated = await super.initialize(...args)
		if (!authenticated) return
		this.universe.addPlayer(this)
		MyLevel.teleportPlayer(this)
	}
}

class MyUniverse extends BaseUniverse {
	static playerClass = MyPlayer
}

new MyUniverse({
	port: 25565,
	postToMainServer: false,
})
```

## Projects using classicborne

- [Voxel Telephone](https://github.com/BunnyNabbit/voxel-telephone)
