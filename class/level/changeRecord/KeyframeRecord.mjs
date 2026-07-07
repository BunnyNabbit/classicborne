// @ts-check
import zlib from "node:zlib"
import { promisify } from "node:util"
const deflate = promisify(zlib.deflate)
/** @import {Vector3} from "../../../types/arrayLikes.mjs" */
/** @import {BaseSqliteAdapter} from "./adapter/BaseSqliteAdapter.mjs" */
/** @import {BetterSqliteAdapter} from "./adapter/BetterSqliteAdapter.mjs" */
/** @import {GhostSqliteAdapter} from "./adapter/GhostSqliteAdapter.mjs" */
/**I am a keyframe record for a {@link BaseLevel}. I manage level keyframes in my SQLite database, allowing for efficient retrieval and management of keyframe data.
 *
 * I use adapters
 */
export class KeyframeRecord {
	/**Creates a new KeyframeRecord instance.
	 *
	 * @param {string} path - The path to the SQLite database file.
	 */
	constructor(path, adapter) {
		this.path = path
		/** @type {BaseSqliteAdapter | GhostSqliteAdapter | BetterSqliteAdapter} */
		this.adapter = adapter
	}
	/**Adds a keyframe to the database.
	 *
	 * @param {number} offset - The offset in the VHS file.
	 * @param {number} totalActionCount - The action count at this keyframe.
	 * @param {string} template - The template associated with this keyframe.
	 * @param {Buffer} voxelData - The level voxel data at this keyframe.
	 * @param {Vector3} bounds - The bounds of the level.
	 * @param {string} [levelData="{}"] - Optional level data in JSON format. Default is `"{}"`
	 * @returns {Promise<number>} The ID of the newly created keyframe.
	 */
	async addKeyframe(offset, totalActionCount, bufferActionCount, template, voxelData, bounds, levelData = "{}") {
		await this.ready
		const compressedVoxelData = await deflate(voxelData)
		return new Promise((resolve, reject) => {
			// this.db.run("INSERT INTO keyframes (offset, totalActionCount, bufferActionCount, template, voxelData, levelData) VALUES (?, ?, ?, ?, ?, ?)", [offset, totalActionCount, bufferActionCount, template + KeyframeRecord.getBoundsKey(bounds), compressedVoxelData, levelData], function (err) {
			// 	if (err) {
			// 		reject(err)
			// 	} else {
			// 		resolve(this.lastID)
			// 	}
			// })
		})
	}
	/**Gets the latest keyframe before a given action count for a specific template.
	 *
	 * @param {number} beforeActionCount - The action count to search before.
	 * @param {string} template - The template to filter by.
	 * @param {Vector3} bounds - The bounds of the level.
	 * @returns {Promise<object | null>} The latest keyframe record or null if not found.
	 */
	async getLatestKeyframe(beforeActionCount, template, bounds) {
		await this.ready
		return new Promise((resolve, reject) => {
			// this.db.get("SELECT * FROM keyframes WHERE totalActionCount <= ? AND template = ? ORDER BY totalActionCount DESC LIMIT 1", [beforeActionCount, template + KeyframeRecord.getBoundsKey(bounds)], (err, row) => {
			// 	if (err) {
			// 		reject(err)
			// 	} else {
			// 		resolve(row)
			// 	}
			// })
		})
	}
	/**Purge keyframes after a specific action count.
	 *
	 * @param {number} afterActionCount - The action count to purge keyframes after.
	 * @returns {Promise<number>} The number of rows deleted.
	 */
	async purgeKeyframes(afterActionCount) {
		await this.ready
		return new Promise((resolve, reject) => {
			// this.db.run("DELETE FROM keyframes WHERE totalActionCount > ?", [afterActionCount], function (err) {
			// 	if (err) {
			// 		reject(err)
			// 	} else {
			// 		resolve(this.changes)
			// 	}
			// })
		})
	}
	/**Vacuum the database to optimize it.
	 *
	 * @returns {Promise<void>}
	 */
	async vacuum() {
		await this.ready
		return new Promise((resolve, reject) => {
			// this.db.run("VACUUM", (err) => {
			// 	if (err) {
			// 		reject(err)
			// 	} else {
			// 		resolve()
			// 	}
			// })
		})
	}
	/**Close the database connection.
	 *
	 * @returns {Promise<void>}
	 */
	async close() {
		await this.ready
		return new Promise((resolve, reject) => {
			// this.db.close((err) => {
			// 	if (err) {
			// 		reject(err)
			// 	} else {
			// 		resolve()
			// 	}
			// })
		})
	}
	/**Get a string key for level bounds.
	 *
	 * @param {Vector3} bounds - The bounds to generate a key for.
	 * @returns {string} The string key for the bounds.
	 */
	static getBoundsKey(bounds) {
		return bounds.join(".")
	}
	/**Finds a suitable _SQLite_ adapter. I use dynamic imports to find an adapter that is able to import.
	 *
	 * I attempt to import the following adapter classes in order:
	 *
	 * 1. `BetterSqliteAdapter` - Uses the `better-sqlite3` optional dependency.
	 * 2. `GhostSqliteAdapter` - Uses the `sqlite3` optional dependency.
	 * 3. `NativeSqliteAdapter` - Uses the experimental native _Node.js_ _SQLite_ module. If I use this adapter, `NativeSqliteAdapter` will emit a warning on import.
	 *
	 * If I can't find an adapter, I'll throw an {@link Error}.
	 *
	 * @returns {GhostSqliteAdapter | BetterSqliteAdapter | NativeSqliteAdapter}
	 * @throws {Error} If no adapter could be imported.
	 */
	static async findSuitableSqliteAdapter() {
		/** @type {Error[]} */
		const errors = []
		const importErrorHandler = (/** @type {Error} */ error) => {
			errors.push(error)
		}
		const BetterSqliteAdapter = await import("./adapter/BetterSqliteAdapter.mjs")
			.then((module) => {
				return module.BetterSqliteAdapter
			})
			.catch(importErrorHandler)
		if (BetterSqliteAdapter) return BetterSqliteAdapter
		const GhostSqliteAdapter = await import("./adapter/GhostSqliteAdapter.mjs")
			.then((module) => {
				return module.GhostSqliteAdapter
			})
			.catch(importErrorHandler)
		if (GhostSqliteAdapter) return GhostSqliteAdapter
		const NativeSqliteAdapter = await import("./adapter/NativeSqliteAdapter.mjs")
			.then((module) => {
				return module.NativeSqliteAdapter
			})
			.catch(importErrorHandler)
		if (NativeSqliteAdapter) return NativeSqliteAdapter
		throw new Error("I wasn't able to find a SQLite adapter for KeyframeRecord. All of them failed to import.", ...errors)
	}
}

export default KeyframeRecord
