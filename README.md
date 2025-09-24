# classicborne

I am a programmer from Texas and zhis is my art.

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
