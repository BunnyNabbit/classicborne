// @ts-check
import sqlite3 from "sqlite3"
import { BaseSqliteAdapter } from "./BaseSqliteAdapter.mjs"
/** @import {KeyframeRecord} from "../KeyframeRecord.mjs" */
const { Database, OPEN_READWRITE, OPEN_CREATE } = sqlite3.verbose()

/** @todo Yet to be documented. */
export class GhostSqliteAdapter extends BaseSqliteAdapter {
	/**@param {KeyframeRecord} keyframeRecord
	 * @param {string} openPath - The path used for identifying the store. Likely, it's somewhere that exists on a local filesystem.
	 */
	constructor(keyframeRecord, openPath) {
		super(keyframeRecord, openPath)
		/** @type {sqlite3.Database} */
		this.db = null
		this.ready = this.initializeDatabase(openPath)
	}
	/**@param {string} statement - The SQL statement to execute.
	 * @param {any[]} [parameters] - The parameters to pass into the parameterized statement.
	 * @returns {Promise<any>}
	 */
	execute(statement, parameters) {
		return new Promise((resolve) => {
			this.db.run(statement, parameters, (...output) => {
				resolve(...output)
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
	/**@param {string} path
	 * @returns {Promise<sqlite3.Database>}
	 */
	async initializeDatabase(path) {
		return new Promise((resolve, reject) => {
			const db = new Database(path, OPEN_READWRITE | OPEN_CREATE, (error) => {
				if (error) {
					reject(error)
				} else {
					this.db = db
					super
						.ensureInitializedDatabase()
						.then(() => {
							resolve(db)
						})
						.catch((error) => {
							reject(error)
						})
				}
			})
		})
	}
}
