// @ts-check
import sqlite3 from "sqlite3"
import zlib from "node:zlib"
import { promisify } from "node:util"
const deflate = promisify(zlib.deflate)
/** @import {Vector3} from "../../../types/arrayLikes.mjs" */
const { Database, OPEN_READWRITE, OPEN_CREATE } = sqlite3.verbose()
/** I am a keyframe record for a {@link BaseLevel}. I manage level keyframes in my SQLite database, allowing for efficient retrieval and management of keyframe data. */
export class KeyframeRecord {
	/**Creates a new KeyframeRecord instance.
	 *
	 * @param {string} path - The path to the SQLite database file.
	 */
	constructor(path) {
		this.path = path
		this.db = null
		this.ready = new Promise((resolve, reject) => {
			const db = new Database(path, OPEN_READWRITE | OPEN_CREATE, (err) => {
				if (err) {
					reject(err)
				} else {
					db.run("CREATE TABLE IF NOT EXISTS keyframes (id INTEGER PRIMARY KEY AUTOINCREMENT, offset INTEGER, totalActionCount INTEGER, bufferActionCount INTEGER, template TEXT, voxelData BLOB, levelData TEXT)", (err) => {
						if (err) {
							reject(err)
						} else {
							// Create index for totalActionCount
							db.run("CREATE INDEX IF NOT EXISTS idx_keyframes_totalActionCount ON keyframes(totalActionCount)", (err) => {
								if (err) {
									reject(err)
								} else {
									this.db = db
									resolve(db)
								}
							})
						}
					})
				}
			})
		})
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
			this.db.run("INSERT INTO keyframes (offset, totalActionCount, bufferActionCount, template, voxelData, levelData) VALUES (?, ?, ?, ?, ?, ?)", [offset, totalActionCount, bufferActionCount, template + KeyframeRecord.getBoundsKey(bounds), compressedVoxelData, levelData], function (err) {
				if (err) {
					reject(err)
				} else {
					resolve(this.lastID)
				}
			})
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
			this.db.get("SELECT * FROM keyframes WHERE totalActionCount <= ? AND template = ? ORDER BY totalActionCount DESC LIMIT 1", [beforeActionCount, template + KeyframeRecord.getBoundsKey(bounds)], (err, row) => {
				if (err) {
					reject(err)
				} else {
					resolve(row)
				}
			})
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
			this.db.run("DELETE FROM keyframes WHERE totalActionCount > ?", [afterActionCount], function (err) {
				if (err) {
					reject(err)
				} else {
					resolve(this.changes)
				}
			})
		})
	}
	/**Vacuum the database to optimize it.
	 *
	 * @returns {Promise<void>}
	 */
	async vacuum() {
		await this.ready
		return new Promise((resolve, reject) => {
			this.db.run("VACUUM", (err) => {
				if (err) {
					reject(err)
				} else {
					resolve()
				}
			})
		})
	}
	/**Close the database connection.
	 *
	 * @returns {Promise<void>}
	 */
	async close() {
		await this.ready
		return new Promise((resolve, reject) => {
			this.db.close((err) => {
				if (err) {
					reject(err)
				} else {
					resolve()
				}
			})
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
}

export default KeyframeRecord
