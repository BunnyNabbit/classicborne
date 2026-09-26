// @ts-check
console.warn(`Hey, this could be some [[really dangerous]] stuff. Or maybe it's completely safe, can't be too sure. But NativeSqliteAdapter is being imported. And that's rather problematic! or at least for now. Node's SQLite is yet to be stabilized... *it isn't exactly 'npm' friendly!* Either live on the bleeding edge and be aware of what's coming, or trust what has already worked. *classicborne* can use either the *sqlite3* or *better-sqlite3* dependency, depending on your preference in lover.
* If I hear any more complaints as a result of using NativeSqliteAdapter, then maybe I suggest to try telling a level's ChangeRecord to not use a KeyframeRecord?
There's something about dragons. I forgot what the exact saying is. Whatever it is, I'll call it a \"spinning saw blade.\". Eventually, that'll turn dull and become another cog in the machine. See https://github.com/BunnyNabbit/classicborne/issues/8`)
import { DatabaseSync } from "node:sqlite"
import { BaseSqliteAdapter } from "./BaseSqliteAdapter.mjs"
/** @import {KeyframeRecord} from "../KeyframeRecord.mjs" */
/** @import {Statement} from "./BaseSqliteAdapter.mjs" */
// const { Database, OPEN_READWRITE, OPEN_CREATE } = sqlite3.verbose()

/** @todo Yet to be documented. */
export class NativeSqliteAdapter extends BaseSqliteAdapter {
	/**@param {KeyframeRecord} keyframeRecord
	 * @param {string} openPath - The path used for identifying the store. Likely, it's somewhere that exists on a local filesystem.
	 */
	constructor(keyframeRecord, openPath) {
		super(keyframeRecord, openPath)
		/** @type {DatabaseSync} */
		this.db
		this.ready = this.initializeDatabase(openPath)
	}
	/**@param {Statement} statement - The SQL statement to execute.
	 * @param {any[]} [parameters] - The parameters to pass into the parameterized statement.
	 * @returns {Promise<any | any[]>}
	 */
	execute(statement, parameters = []) {
		return new Promise((resolve, reject) => {
			const preparedStatement = this.db.prepare(statement.structuredQueryLanguageStatement)
			try {
				switch (statement.handlingOptions.executionType) {
					case "all": {
						resolve(preparedStatement.all(...parameters))
						break
					}
					case "execute": {
						resolve(preparedStatement.run(...parameters))
						break
					}
					case "single": {
						resolve(preparedStatement.get(...parameters))
						break
					}
				}
			} catch (error) {
				reject(error)
			}
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
				resolve()
			} catch (error) {
				reject(error)
			}
		})
	}
	/**@param {string} path
	 * @returns {Promise<DatabaseSync>}
	 */
	async initializeDatabase(path) {
		return new Promise((resolve, reject) => {
			try {
				this.db = new DatabaseSync(path)
				resolve(this.db)
			} catch (error) {
				reject(error)
			}
		})
	}
}
