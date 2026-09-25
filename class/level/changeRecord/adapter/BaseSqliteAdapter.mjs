// @ts-check
import { promisify } from "node:util"
import zlib from "node:zlib"
import { KeyframeRecord } from "../KeyframeRecord.mjs"
const deflate = promisify(zlib.deflate)
/** @import {PathLike} from "fs" */
/** @import {Vector3} from "../../../../types/arrayLikes.mjs" */
/** @import {HandlingOptions} from "../../../../types/KeyframeRecord.mts" */

export class Statement {
	/**@param {string} structuredQueryLanguageStatement - The statement.
	 * @param {HandlingOptions} handlingOptions
	 */
	constructor(structuredQueryLanguageStatement, handlingOptions) {
		/** The string content of the statement. */
		this.structuredQueryLanguageStatement = structuredQueryLanguageStatement
		this.handlingOptions = handlingOptions ?? { executionType: "" }
	}
}

/** I am the base for the adapters that use <span title="I hatched in a barn. I grew up in the farm. And you know what? I don't have any regrets when I exited the farm. With SQL, you're flying. Or at least that's what its proponents would say.">_SQLite_ as their database</span>. I expect my subclasses to implement the {@link BaseSqliteAdapter.execute}, {@link BaseSqliteAdapter.close} and {@link BaseSqliteAdapter.initializeDatabase} methods. */
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
	 * @param {Buffer} compressedVoxelData - The level voxel data at this keyframe.
	 * @param {Vector3} bounds - The bounds of the level.
	 * @param {string} [levelData="{}"] - Optional level data in JSON format. Default is `"{}"`
	 * @returns {Promise<void>}
	 */
	async addKeyframe(offset, totalActionCount, bufferActionCount, template, compressedVoxelData, bounds, levelData = "{}") {
		return await this.execute(
			new Statement(
				`--sql 
				Insert into keyframes (
					offset,
					totalActionCount,
					bufferActionCount,
					template,
					voxelData,
					levelData
				) Values (?, ?, ?, ?, ?, ?)
				`,
				{
					executionType: "execute",
				}
			),
			[offset, totalActionCount, bufferActionCount, template + KeyframeRecord.getBoundsKey(bounds), compressedVoxelData, levelData]
		).then(() => {
			// betterSqliteAdapter uses lastInsertRowid. What else?
			// ~~ghost sqlite execute does it in a weird way.~~ actually, should just use `this`...
			// But, we're not going to bother... It's not important to know.
			return
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
		return await this.execute(
			new Statement(
				`--sql
				Select * from keyframes
					Where
						totalActionCount <= ? and template = ?
					Order by
						totalActionCount Desc
					Limit 1
				`,
				{
					executionType: "single",
				}
			),
			[beforeActionCount, template + KeyframeRecord.getBoundsKey(bounds)]
		).then((row) => {
			return row
		})
	}
	/**Purge keyframes after a specific action count.
	 *
	 * @param {number} afterActionCount - The action count to purge keyframes after.
	 * @returns {Promise<void>}
	 */
	async purgeKeyframes(afterActionCount) {
		return await this.execute(
			new Statement(
				`--sql
				Delete from keyframes
					Where totalActionCount > ?
				`,
				{
					executionType: "execute",
				}
			),
			[afterActionCount]
		).then(() => {
			return
		})
	}
	/**Vacuum the database to optimize it.
	 *
	 * @returns {Promise<void>}
	 */
	async vacuum() {
		return await this.execute(new Statement(`Vacuum`, { executionType: "execute" }))
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
	/**Executes the specified {@link Statement} object.
	 *
	 * @abstract
	 * @param {Statement} statement - The {@link Statement} instance to execute.
	 * @param {any[]} [parameters] - The parameters to pass into the parameterized statement.
	 * @returns {Promise<any>}
	 */
	async execute(statement, parameters) {
		throw new Error("BaseSqliteAdapter#execute is abstract and must be implemented.")
	}
	/** Ensures the database is initialized by creating tables and indexes if they don't exist */
	async ensureInitializedDatabase() {
		// Split into two statements because some adapters won't like it if it were in one.
		await this.execute(
			new Statement(
				`--sql
				Create table if not exists keyframes (
					id Integer Primary key autoIncrement,
					offset Integer,
					totalActionCount Integer,
					bufferActionCount integer,
					template Text,
					voxelData Blob,
					levelData Text
				)
				`,
				{
					executionType: "execute",
				}
			)
		)
		await this.execute(
			new Statement(
				`--sql
				Create index if not exists
					idx_keyframes_totalActionCount -- @TODO: reason for name??
				On
					keyframes(totalActionCount)
				`,
				{
					executionType: "execute",
				}
			)
		)
	}
}
