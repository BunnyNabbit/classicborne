// @ts-check
import sqlite3 from "sqlite3"
import { BaseSqliteAdapter } from "./BaseSqliteAdapter.mjs"
/** @import {KeyframeRecord} from "../KeyframeRecord.mjs" */
/** @import {Statement} from "./BaseSqliteAdapter.mjs" */
const { Database, OPEN_READWRITE, OPEN_CREATE } = sqlite3.verbose()

/**I'm an {@link BaseSqliteAdapter | adapter} for {@link KeyframeRecord}. My required dependency is [_sqlite3_](https://npmx.dev/package/sqlite3).
 *
 * My module is the second to be imported by {@link KeyframeRecord.findSuitableSqliteAdapter}. I am returned by it if [_sqlite3_](https://npmx.dev/package/sqlite3) is installed.
 */
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
	/**@param {Statement} statement - The SQL statement to execute.
	 * @param {any[]} [parameters] - The parameters to pass into the parameterized statement.
	 * @returns {Promise<any | any[]>}
	 */
	execute(statement, parameters) {
		return new Promise((resolve, reject) => {
			switch (statement.handlingOptions.executionType) {
				case "all": {
					this.db.all(statement.structuredQueryLanguageStatement, parameters, (error, rows) => {
						if (error) reject(error)
						resolve(rows)
					})
					break
				}
				case "execute": {
					this.db.run(statement.structuredQueryLanguageStatement, parameters, (error) => {
						if (error) reject(error)
						resolve()
					})
					break
				}
				case "single": {
					this.db.get(statement.structuredQueryLanguageStatement, parameters, (error, row) => {
						if (error) reject(error)
						resolve(row)
					})
					break
				}
			}
		})
	}
	/** @returns {Promise<void>} */
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
