import { green, red } from '@std/fmt/colors'
import { join } from '@std/path'

import { services } from './types.ts'

async function stopDockerCompose(directory: string) {
	console.log(`Stopping ${directory}...`)

	const process = new Deno.Command('docker', {
		args: ['compose', '-f', join(directory, 'docker-compose.yaml'), 'down'],
		stdout: 'piped',
		stderr: 'piped',
	})

	const { code, stdout, stderr } = await process.output()

	if (code === 0) {
		console.log(`${green('Successfully stopped')} ${directory}`)
		if (stdout.length > 0) console.log(new TextDecoder().decode(stdout))
	} else {
		console.error(`${red('Error stopping')} ${directory}`)
		if (stderr.length > 0) console.error(new TextDecoder().decode(stderr))
	}

	// Wait for containers to be fully stopped
	await waitForContainersToStop(directory)
}

async function waitForContainersToStop(directory: string) {
	while (true) {
		const process = new Deno.Command('docker', {
			args: [
				'compose',
				'-f',
				join(directory, 'docker-compose.yaml'),
				'ps',
				'--quiet',
			],
			stdout: 'piped',
		})

		const { code, stdout } = await process.output()

		if (code === 0) {
			const output = new TextDecoder().decode(stdout).trim()
			if (output === '') {
				console.log(`${green('All containers are stopped for')} ${directory}`)
				break
			}
		}

		await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds before checking again
	}
}

export async function stopAllServices() {
	for (const service of Object.values(services)) {
		await stopDockerCompose(service)
	}
}

export async function stopSpecificServices(
	selectedServices: (keyof typeof services)[],
) {
	for (const serviceName of selectedServices) {
		const directory = services[serviceName]

		if (directory) await stopDockerCompose(directory)
		else console.error(`${red('Service not found:')} ${serviceName}`)
	}
}

/**
 * Usage:
 * - To stop all services: `deno run --allow-run --allow-read --allow-env stop_services.ts`
 * - To stop specific services by name (e.g., "email" and "powersync"):
 *   `deno run --allow-run --allow-read --allow-env stop_services.ts email powersync`
 */
if (import.meta.main) {
	const args = Deno.args as (keyof typeof services)[]

	// Validate service names
	const invalidServices = args.filter(service => !(service in services))

	if (invalidServices.length > 0) {
		console.error(
			`${red('Error:')} Invalid service(s) specified: ${invalidServices.join(', ')}`,
		)
		Deno.exit(1)
	}

	if (args.length > 0) await stopSpecificServices(args)
	else await stopAllServices()
}
