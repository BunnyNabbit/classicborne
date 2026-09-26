// @ts-check
import Database from "better-sqlite3"
import { BaseSqliteAdapter } from "./BaseSqliteAdapter.mjs"
/** @import {KeyframeRecord} from "../KeyframeRecord.mjs" */
/** @import {Statement} from "./BaseSqliteAdapter.mjs" */

/** @todo Yet to be documented. */
export class BetterSqliteAdapter extends BaseSqliteAdapter {
	/**@param {KeyframeRecord} keyframeRecord
	 * @param {string} openPath - The path used for identifying the store. Likely, it's somewhere that exists on a local filesystem.
	 */
	constructor(keyframeRecord, openPath) {
		super(keyframeRecord, openPath)
		/** @type {any} */
		this.db = null
		this.ready = this.initializeDatabase(openPath)
	}
	/**@param {Statement} statement - The SQL statement to execute.
	 * @param {any[]} [parameters] - The parameters to pass into the parameterized statement.
	 * @returns {Promise<any>}
	 */
	execute(statement, parameters = []) {
		return new Promise((resolve) => {
			const preparedStatement = this.db.prepare(statement.structuredQueryLanguageStatement)
			let result
			switch (statement.handlingOptions.executionType) {
				case "all": {
					result = preparedStatement.all(...parameters)
					break
				}
				case "execute": {
					result = preparedStatement.run(...parameters)
					break
				}
				case "single": {
					result = preparedStatement.get(...parameters)
					break
				}
			}
			resolve(result)
		})
	}
	/**Close the database connection.
	 *
	 * @returns {Promise<void>}
	 */
	async close() {
		await this.ready
		return new Promise((resolve, reject) => {
			try {
				this.db.close()
			} catch (error) {
				reject(error)
			}
		})
	}
	/**@param {string} path
	 * @returns {Promise<any>}
	 */
	async initializeDatabase(path) {
		return new Promise((resolve, reject) => {
			const db = new Database(path)
			this.db = db
			this.ensureInitializedDatabase()
				.then(() => {
					resolve(db)
				})
				.catch((error) => {
					reject(error)
				})
		})
	}
}
