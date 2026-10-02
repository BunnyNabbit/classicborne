/** @import {HandlingOptions} from "../../../../types/BaseSqliteAdapter.mts" */
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
