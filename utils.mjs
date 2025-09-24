export function componentToHex(component) {
	const hex = component.toString(16).toUpperCase()
	return hex.length == 1 ? "0" + hex : hex
}
/**
 * @param {number} time 
 * @returns {Promise<void>}
 */
export function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time))
}
