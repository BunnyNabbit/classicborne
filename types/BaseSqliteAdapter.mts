/** I represent the options for handling a {@link Statement}. */
export interface HandlingOptions {
	/** The intent of how I should execute a statement. */
	executionType:
		| "execute"
		| "all"
		| "single"
}
