import { green, red } from '@std/fmt/colors'

import { stopAllServices, stopSpecificServices } from './stop_services.ts'
import { servicesVolumes } from './types.ts'
import { removeVolumes } from './volume_utils.ts'
// Function to clean volumes for all services
async function cleanAllVolumes() {
	console.log(green('Starting cleanup for all services...'))

	// Step 1: Stop all services
	await stopAllServices()

	// Step 2: Remove all volumes
	const volumesToRemove = Object.values(servicesVolumes).flatMap(
		service => service.volumes,
	)
	if (volumesToRemove.length > 0) {
		try {
			await removeVolumes(volumesToRemove)
			console.log(green('All service volumes removed successfully.'))
		} catch (error) {
			console.error(error instanceof Error ? error.message : 'Unknown error')
			Deno.exit(1)
		}
	} else {
		console.log(red('No volumes found for the services.'))
	}

	console.log(green('Cleanup for all services completed.'))
}

// Function to clean volumes for specific services
async function cleanSpecificVolume(
	selectedServices: (keyof typeof servicesVolumes)[],
) {
	console.log(
		green(
			`Starting cleanup for selected services: ${selectedServices.join(', ')}`,
		),
	)

	// Step 1: Stop specific services
	await stopSpecificServices(selectedServices)

	// Step 2: Remove volumes for the selected services
	const volumesToRemove = selectedServices.flatMap(
		service => servicesVolumes[service].volumes,
	)
	if (volumesToRemove.length > 0) {
		try {
			await removeVolumes(volumesToRemove)
			console.log(
				green(`Volumes removed for services: ${selectedServices.join(', ')}`),
			)
		} catch (error) {
			console.error(error instanceof Error ? error.message : 'Unknown error')
			Deno.exit(1)
		}
	} else {
		console.log(red('No volumes found for the specified services.'))
	}

	console.log(green('Cleanup for selected services completed.'))
}

/**
 * Usage:
 * - To clean both services: `deno run --allow-run --allow-read --allow-env clean_volumes.ts`
 * - To clean specific services by name (e.g., "powersync" or "postgres"):
 *   `deno run --allow-run --allow-read --allow-env clean_volumes.ts powersync postgres`
 */
if (import.meta.main) {
	const args = Deno.args as (keyof typeof servicesVolumes)[]

	// Validate service names
	const invalidServices = args.filter(service => !(service in servicesVolumes))

	if (invalidServices.length > 0) {
		console.error(
			`${red('Error:')} Invalid service(s) specified: ${invalidServices.join(', ')}`,
		)
		Deno.exit(1)
	}

	if (args.length > 0) await cleanSpecificVolume(args)
	else await cleanAllVolumes()
}
