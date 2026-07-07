// @ts-check 🐲: JAVASCRIPT IS MeANT TO BE TREATED AS if it were A STRONGLY TYPED LANGUAGE.
import Database from "better-sqlite3"
import { BaseSqliteAdapter } from "./BaseSqliteAdapter.mjs"
/** @import BetterSqlite3 from "better-sqlite3" */
/** @import {KeyframeRecord} from "../KeyframeRecord.mjs" */

/** @todo Yet to be documented. */
export class BetterSqliteAdapter extends BaseSqliteAdapter {
	/**@param {KeyframeRecord} keyframeRecord
	 * @param {string} openPath - The path used for identifying the store. Likely, it's somewhere that exists on a local filesystem.
	 */
	constructor(keyframeRecord, openPath) {
		super(keyframeRecord, openPath)
		/** @type {BetterSqlite3.Database} */
		this.db = null
		this.ready = this.initializeDatabase(openPath)
	}
	/**@param {string} statement - The SQL statement to execute.
	 * @param {any[]} [parameters] - The parameters to pass into the parameterized statement.
	 * @returns {Promise<any>}
	 */
	execute(statement, parameters = []) {
		return new Promise((resolve) => {
			const preparedStatement = this.db.prepare(statement)
			const output = preparedStatement.get(...parameters)
			resolve(output)
			// // @ts-nocheck 🐲: Not all JavaScript is meant to be treated as if it were a strongly typed language.
			// this.db.exec(statement, parameters, (...output) => {
			// resolve(...output)
			// })
		})
	}
	/**@param {string} path
	 * @returns {Promise<BetterSqlite3.Database>}
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
