import { DroneTransmitter } from "../class/level/drone/DroneTransmitter.mjs"
import { Drone } from "../class/level/drone/Drone.mjs"
import { Ego } from "../class/level/drone/Ego.mjs"
import { jest, describe, expect, beforeEach } from "@jest/globals"

describe("DroneTransmitter", () => {
	let mockClient
	let droneTransmitter
	let drone

	beforeEach(() => {
		mockClient = {
			absolutePositionUpdate: jest.fn(),
			despawnPlayer: jest.fn(),
			extensions: new Map([
				["ExtendedPlayerList", { configureSpawn: jest.fn() }],
				["EntityProperty", { setEntityProperty: jest.fn() }],
			]),
		}

		droneTransmitter = new DroneTransmitter(mockClient)

		drone = new Drone(new Ego("Drone", "Skin"))
	})

	test("constructor initializes properties", () => {
		expect(droneTransmitter.client).toBe(mockClient)
		expect(droneTransmitter.drones).toBeInstanceOf(Set)
		expect(droneTransmitter.netIds).toBeInstanceOf(Map)
		expect(droneTransmitter.listeners).toBeInstanceOf(Map)
	})

	test("addDrone assigns net ID and stores drone", () => {
		const netId = droneTransmitter.addDrone(drone)
		expect(netId).toBe(0)
		expect(droneTransmitter.drones.has(drone)).toBe(true)
		expect(droneTransmitter.netIds.get(drone)).toBe(0)
	})

	test("addDrone increments net ID for multiple drones", () => {
		const drone1 = new Drone(new Ego("Drone 1", "Skin"))
		const drone2 = new Drone(new Ego("Drone 2", "Skin"))

		const id1 = droneTransmitter.addDrone(drone1)
		const id2 = droneTransmitter.addDrone(drone2)

		expect(id1).toBe(0)
		expect(id2).toBe(1)
	})

	test("getDroneByNetId returns correct drone", () => {
		droneTransmitter.addDrone(drone)
		const found = droneTransmitter.getDroneByNetId(0)
		expect(found).toBe(drone)
	})

	test("getDroneByNetId returns null for non-existent ID", () => {
		const found = droneTransmitter.getDroneByNetId(0)
		expect(found).toBeNull()
	})

	test("removeDrone deletes drone and cleans up", () => {
		droneTransmitter.addDrone(drone)
		droneTransmitter.removeDrone(drone)

		expect(droneTransmitter.drones.has(drone)).toBe(false)
		expect(droneTransmitter.netIds.has(drone)).toBe(false)
		expect(droneTransmitter.listeners.has(drone)).toBe(false)
		expect(mockClient.despawnPlayer).toHaveBeenCalledWith(0)
	})

	test("updateDrone sends position update", () => {
		droneTransmitter.addDrone(drone)
		droneTransmitter.updateDrone(drone)

		expect(mockClient.absolutePositionUpdate).toHaveBeenCalledWith(0, ...[0, 0, 0], ...[0, 0])
	})

	test("configureDrone sends configuration to client", () => {
		droneTransmitter.addDrone(drone)

		expect(mockClient.extensions.get("ExtendedPlayerList").configureSpawn).toHaveBeenCalled()
		expect(mockClient.extensions.get("EntityProperty").setEntityProperty).toHaveBeenCalledTimes(3)
	})

	test("resendDrones configures all drones", () => {
		const drone1 = new Drone(new Ego("Drone 1", "Skin"))

		droneTransmitter.addDrone(drone1)
		droneTransmitter.addDrone(drone)

		const configureDroneSpy = jest.spyOn(droneTransmitter, "configureDrone")
		droneTransmitter.resendDrones()

		expect(configureDroneSpy).toHaveBeenCalledTimes(2)
		configureDroneSpy.mockRestore()
	})

	test("clearDrones removes all drones", () => {
		droneTransmitter.addDrone(drone)
		droneTransmitter.clearDrones()

		expect(droneTransmitter.drones.size).toBe(0)
	})

	test("addDrone throws when no net IDs available", () => {
		for (let i = 0; i < 127; i++) {
			const drone = new Drone(new Ego(`Drone ${i}`, "Skin"))
			droneTransmitter.addDrone(drone)
		}

		expect(() => droneTransmitter.addDrone(drone)).toThrow("Unable to generate drone ID")
	})
})
