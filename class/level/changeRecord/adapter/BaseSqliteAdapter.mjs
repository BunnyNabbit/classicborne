// @ts-check
import { promisify } from "node:util"
import zlib from "node:zlib"
import { KeyframeRecord } from "../KeyframeRecord.mjs"
const deflate = promisify(zlib.deflate)
/** @import {PathLike} from "fs" */
/** @import {Vector3} from "../../../../types/arrayLikes.mjs" */

/** I am the base for the adapters that use _SQLite_ as their database. I expect my subclasses to implement the {@link BaseSqliteAdapter.execute}, {@link BaseSqliteAdapter.close} and {@link BaseSqliteAdapter.initializeDatabase} methods. */
export class BaseSqliteAdapter {
	/**@param {KeyframeRecord} keyframeRecord
	 * @param {string | PathLike} openPath - The path used for identifying the store. Likely, it's somewhere that exists on a local filesystem.
	 */
	constructor(keyframeRecord, openPath) {
		this.keyframeRecord = keyframeRecord
	}
	/**Adds a keyframe to the database.
	 *
	 * @param {number} offset - The offset in the VHS file.
	 * @param {number} totalActionCount - The action count at this keyframe.
	 * @param {number} bufferActionCount - Yet to be documented.
	 * @param {string} template - The template associated with this keyframe.
	 * @param {Buffer} voxelData - The level voxel data at this keyframe.
	 * @param {Vector3} bounds - The bounds of the level.
	 * @param {string} [levelData="{}"] - Optional level data in JSON format. Default is `"{}"`
	 * @returns {Promise<number>} The ID of the newly created keyframe.
	 */
	async addKeyframe(offset, totalActionCount, bufferActionCount, template, voxelData, bounds, levelData = "{}") {
		// await this.keyframeRecord.ready
		const compressedVoxelData = await deflate(voxelData)
		return await this.execute(
			`--sql 
			Insert into keyframes (
				offset, totalActionCount, bufferActionCount, template, voxelData, levelData
			)
			Values (?, ?, ?, ?, ?, ?)
			`,
			[offset, totalActionCount, bufferActionCount, template + KeyframeRecord.getBoundsKey(bounds), compressedVoxelData, levelData]
		).then((value) => {
			return value.lastID
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
		// await this.keyframeRecord.ready
		// this.db.get("SELECT * FROM keyframes WHERE totalActionCount <= ? AND template = ? ORDER BY totalActionCount DESC LIMIT 1", [beforeActionCount, template + KeyframeRecord.getBoundsKey(bounds)], (err, row) => {
		// 	if (err) {
		// 		reject(err)
		// 	} else {
		// 		resolve(row)
		// 	}
		// })
		return await this.execute(
			`--sql
			Select * from keyframes
				Where
					totalActionCount <= ? and template = ?
				Order by
					totalActionCount Desc
				Limit 1
			`,
			[beforeActionCount, template + KeyframeRecord.getBoundsKey(bounds)]
		).then((row) => {
			return row
		})
	}
	/**Purge keyframes after a specific action count.
	 *
	 * @param {number} afterActionCount - The action count to purge keyframes after.
	 * @returns {Promise<number>} The number of rows deleted.
	 */
	async purgeKeyframes(afterActionCount) {
		// await this.keyframeRecord.ready
		return await this.execute(
			`--sql
			Delete from keyframes
				Where totalActionCount > ?
			`,
			[afterActionCount]
		).then((value) => {
			return value.changes
		})
	}
	/**Vacuum the database to optimize it.
	 *
	 * @returns {Promise<void>}
	 */
	async vacuum() {
		// await this.keyframeRecord.ready
		return await this.execute(`Vacuum`)
	}
	/**Close the database connection.
	 *
	 * @abstract
	 * @returns {Promise<any>}
	 */
	async close() {
		throw new Error("BaseSqliteAdapter#close is abstract and must be implemented.")
	}
	/**Close the database connection.
	 *
	 * @abstract
	 * @param {any} [path]
	 * @returns {Promise<any>}
	 */
	async initializeDatabase(path) {
		throw new Error("initializeDatabase#close is abstract and must be implemented.")
	}
	/**Get a string key for level bounds.
	 *
	 * @param {Vector3} bounds - The bounds to generate a key for.
	 * @returns {string} The string key for the bounds.
	 */
	static getBoundsKey(bounds) {
		return bounds.join(".")
	}
	/**Executes the specified SQL statement.
	 *
	 * @abstract
	 * @param {string} statement - The SQL statement to execute.
	 * @param {any[]} [parameters] - The parameters to pass into the parameterized statement.
	 * @returns {Promise<any>}
	 */
	async execute(statement, parameters) {
		throw new Error("BaseSqliteAdapter#execute is abstract and must be implemented.")
	}
	/** Ensures the database is initialized by creating tables and indexes if they don't exist */
	async ensureInitializedDatabase() {
		await this.execute(
			`--sql
			Create table if not exists keyframes (
				id Integer Primary key autoIncrement,
				offset Integer,
				totalActionCount Integer,
				bufferActionCount integer,
				template Text,
				voxelData Blob,
				levelData Text
			);
			Create index if not exists
				idx_keyframes_totalActionCount -- TODO: reason for name??
			On
				keyframes(totalActionCount)
			`
		)
	}
}
