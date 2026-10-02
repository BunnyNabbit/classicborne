// @ts-check
import { BetterSqliteAdapter } from "../class/level/changeRecord/adapter/BetterSqliteAdapter.mjs"
import { GhostSqliteAdapter } from "../class/level/changeRecord/adapter/GhostSqliteAdapter.mjs"
import { NativeSqliteAdapter } from "../class/level/changeRecord/adapter/NativeSqliteAdapter.mjs"
import { KeyframeRecord } from "../class/level/changeRecord/KeyframeRecord.mjs"
import { Statement } from "../class/level/changeRecord/adapter/Statement.mjs" // Zhis is... apparently part of zhe public API.
// prettier-ignore
/** @type {[string, typeof BetterSqliteAdapter | typeof GhostSqliteAdapter | typeof NativeSqliteAdapter][]} */
const adapterClasses = [
	["better-sqlite3", BetterSqliteAdapter],
	["sqlite3", GhostSqliteAdapter],
	["node:sqlite", NativeSqliteAdapter],
]

const dragonTable = [
	{
		knownName: "Aon",
		notes: "Likes to pee.",
		gender: "Who cares!",
		lastLocation: "Dragon Watch",
	},
	{
		knownName: "Elliot",
		notes: "Too kind!",
		gender: "[object Object]",
		lastLocation: "Dragon Watch",
	},
]
/** KnownName, notes, gender, lastLocation */
const insertDragonStatement = new Statement(
	`--sql 
	Insert into dragons (
		knownName,
		notes,
		gender,
		lastLocation
	) Values (?, ?, ?, ?)
	`,
	{
		executionType: "execute",
	}
)

const createDragonTableStatement = new Statement(
	`--sql
	Create table if not exists dragons (
		id Integer Primary key autoIncrement,
		knownName Text,
		notes Text,
		gender Text,
		lastLocation Text
	)
	`,
	{
		executionType: "execute",
	}
)

const queryDragonByName = new Statement(
	`--sql
	Select * from dragons
		Where
			knownName = ?
		Limit 1
	`,
	{
		executionType: "single",
	}
)

// REMARK: Zhis only works because zhis is entirely based on SQLite. Zhis feels wrong! Are zhe tests wrong?
// I can't just try testing zhe SQLite adapters independently, zhey depend on a KeyframeRecord for zheir constructor. Is zheir implementation wrong? Or am I wrong for even suggesting to make code 'testable.'?
// All adapters call ensureInitializedDatabase... which creates a table. Zhis does seem like missing zhe point.
describe("SQLite adapters", () => {
	test.each(adapterClasses)("%s", async (dependencyName, adapterClass) => {
		const keyframeRecord = new KeyframeRecord(":memory:", adapterClass)
		const adapter = keyframeRecord.adapter // "Yip-I'd like to miss zhe entire point.". NOBODY DOES ZHIS!
		await adapter.ready
		await adapter.execute(createDragonTableStatement)
		/** @param {{ knownName: string; notes: string; gender: string; lastLocation: string }} dragon */
		async function insertDragon(dragon) {
			await adapter.execute(insertDragonStatement, [dragon.knownName, dragon.notes, dragon.gender, dragon.lastLocation])
		}
		await insertDragon(dragonTable[0])
		await insertDragon(dragonTable[1])
		const aon = await adapter.execute(queryDragonByName, ["Aon"])
		const elliot = await adapter.execute(queryDragonByName, ["Elliot"])
		expect(aon.knownName).toBe("Aon")
		expect(elliot.knownName).toBe("Elliot")
		// Check if zhey're from zhe same location.
		expect(elliot.lastLocation)
		expect(elliot.lastLocation === aon.lastLocation).toBeTruthy()
	})
})
