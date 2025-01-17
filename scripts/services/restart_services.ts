import { green, red, yellow } from '@std/fmt/colors'
import { join } from '@std/path'

import { services } from './types.ts'

async function restartDockerCompose(
	directory: string,
	serviceName?: string,
	noDeps = false,
) {
	const args = [
		'compose',
		'-f',
		join(directory, 'docker-compose.yaml'),
		'restart',
	]

	if (serviceName) {
		args.push(serviceName)
		if (noDeps) {
			args.push('--no-deps')
		}
	}

	console.log(
		`Restarting${serviceName ? ` ${serviceName} in` : ''} ${directory}...`,
	)

	const process = new Deno.Command('docker', {
		args,
		stdout: 'piped',
		stderr: 'piped',
	})

	const { code, stdout, stderr } = await process.output()

	if (code === 0) {
		console.log(
			`${green('Successfully restarted')}${serviceName ? ` ${serviceName} in` : ''} ${directory}`,
		)
		if (stdout.length > 0) console.log(new TextDecoder().decode(stdout))
	} else {
		console.error(
			`${red('Error restarting')}${serviceName ? ` ${serviceName} in` : ''} ${directory}`,
		)
		if (stderr.length > 0) console.error(new TextDecoder().decode(stderr))
	}

	// Wait for containers to be in a running state
	await waitForContainers(directory, serviceName)
}

async function waitForContainers(directory: string, serviceName?: string) {
	while (true) {
		const args = [
			'compose',
			'-f',
			join(directory, 'docker-compose.yaml'),
			'ps',
			'--format',
			'{{.Name}},{{.State}}',
		]

		if (serviceName) {
			args.push(serviceName)
		}

		const process = new Deno.Command('docker', {
			args,
			stdout: 'piped',
		})

		const { code, stdout } = await process.output()

		if (code === 0) {
			const output = new TextDecoder().decode(stdout)
			const containerStates = output
				.trim()
				.split('\n')
				.map(line => {
					const [name, state] = line.split(',')
					return { name, state }
				})

			if (containerStates.every(container => container.state === 'running')) {
				console.log(`${green('All containers are running for')} ${directory}`)
				break
			}
			console.log(
				`${yellow('Waiting for containers to start in')} ${directory}`,
			)
			for (const container of containerStates) {
				console.log(`  ${container.name}: ${container.state}`)
			}
		} else {
			console.error(
				`${red('Error checking container status for')} ${directory}`,
			)
		}

		await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds before checking again
	}
}

async function checkServicesHealth() {
	console.log('Checking health of all services...')

	const process = new Deno.Command('docker', {
		args: ['ps', '--format', '{{.Names}},{{.Status}}'],
		stdout: 'piped',
	})

	const { code, stdout } = await process.output()

	if (code === 0) {
		const output = new TextDecoder().decode(stdout)
		const lines = output.trim().split('\n')

		for (const line of lines) {
			const [name, status] = line.split(',')

			if (status.includes('healthy')) {
				console.log(`${green('✓')} ${name} is healthy`)
			} else if (status.includes('unhealthy')) {
				console.log(`${red('✗')} ${name} is unhealthy`)
			} else {
				console.log(`${yellow('?')} ${name} health unknown (${status})`)
			}
		}
	} else {
		console.error(red('Failed to check services health'))
	}
}

export async function restartAllServices() {
	for (const directory of Object.values(services)) {
		await restartDockerCompose(directory)
	}

	await checkServicesHealth()
}

export async function restartSpecificService(
	servicePath: string,
	serviceName: string,
	noDeps = false,
) {
	await restartDockerCompose(servicePath, serviceName, noDeps)
	await checkServicesHealth()
}

/**
 * Usage:
 * - To restart all services:
 *   `deno run --allow-run --allow-read --allow-env restart_services.ts`
 *
 * - To restart specific service:
 *   `deno run --allow-run --allow-read --allow-env restart_services.ts powersync functions`
 *
 * - To restart specific service without dependencies:
 *   `deno run --allow-run --allow-read --allow-env restart_services.ts powersync functions --no-deps`
 */
if (import.meta.main) {
	const args = Deno.args
	const noDeps = args.includes('--no-deps')

	// Remove --no-deps from args if present
	const serviceArgs = args.filter(arg => arg !== '--no-deps')

	if (serviceArgs.length === 0) {
		await restartAllServices()
	} else if (serviceArgs.length === 2) {
		const [serviceName, containerName] = serviceArgs
		const servicePath = services[serviceName as keyof typeof services]

		if (!servicePath) {
			console.error(red(`Invalid service: ${serviceName}`))
			console.error(`Available services: ${Object.keys(services).join(', ')}`)
			Deno.exit(1)
		}

		await restartSpecificService(servicePath, containerName, noDeps)
	} else {
		console.error(red('Invalid arguments'))
		console.error('Usage:')
		console.error(
			'  restart_services.ts                          # Restart all services',
		)
		console.error(
			'  restart_services.ts powersync functions       # Restart specific service',
		)
		console.error(
			'  restart_services.ts powersync functions --no-deps  # Restart without dependencies',
		)
		Deno.exit(1)
	}
}
