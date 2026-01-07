import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals"
import { Watchdog } from "../class/player/Watchdog.mjs"

describe("Watchdog", () => {
	let mockPlayer
	let watchdog

	beforeEach(() => {
		jest.useFakeTimers()
		mockPlayer = {
			client: {
				disconnect: jest.fn(),
			},
		}
		watchdog = new Watchdog(mockPlayer)
	})

	afterEach(() => {
		jest.runOnlyPendingTimers()
		jest.useRealTimers()
		watchdog.destroy()
	})

	describe("constructor", () => {
		it("should initialize currentRate to 0", () => {
			expect(watchdog.currentRate).toBe(0)
		})

		it("should initialize limit to 382", () => {
			expect(watchdog.limit).toBe(382)
		})

		it("should store the player reference", () => {
			expect(watchdog.player).toBe(mockPlayer)
		})

		it("should set up an interval to reset currentRate every 1000ms", () => {
			watchdog.currentRate = 100
			jest.advanceTimersByTime(1000)
			expect(watchdog.currentRate).toBe(0)
		})
	})

	describe("rateOperation", () => {
		it("should increment currentRate by default amount of 1", () => {
			watchdog.rateOperation()
			expect(watchdog.currentRate).toBe(1)
		})

		it("should increment currentRate by custom amount", () => {
			watchdog.rateOperation(5)
			expect(watchdog.currentRate).toBe(5)
		})

		it("should return false when currentRate does not exceed limit", () => {
			const result = watchdog.rateOperation(100)
			expect(result).toBe(false)
		})

		it("should disconnect player when currentRate exceeds limit", () => {
			watchdog.rateOperation(383)
			expect(mockPlayer.client.disconnect).toHaveBeenCalledWith("Sanctioned: Watchdog triggered")
		})

		it("should return true when currentRate exceeds limit", () => {
			const result = watchdog.rateOperation(383)
			expect(result).toBe(true)
		})
	})

	describe("destroy", () => {
		it("should clear the interval", () => {
			const clearIntervalSpy = jest.spyOn(global, "clearInterval")
			watchdog.destroy()
			expect(clearIntervalSpy).toHaveBeenCalled()
			clearIntervalSpy.mockRestore()
		})
	})
})
