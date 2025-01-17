import { green, red, yellow } from '@std/fmt/colors'
import { join } from '@std/path'
import { services } from './types.ts'

class ServiceManager {
	private static readonly HEALTH_CHECK_INTERVAL = 5000 // 5 seconds
	private static readonly HEALTH_CHECK_TIMEOUT = 60000 // 1 minute

	async startServices(selectedServices?: (keyof typeof services)[]) {
		const servicesToStart =
			selectedServices || (Object.keys(services) as (keyof typeof services)[])

		// Start PostgreSQL first if it's in the list
		if (servicesToStart.includes('postgres')) {
			await this.startService('postgres')
			await this.waitForHealthyService('postgres')

			// Setup PowerSync if postgres is being started
			await this.setupPowersync()
		}

		// Start remaining services
		for (const service of servicesToStart) {
			if (service !== 'postgres') {
				await this.startService(service)
			}
		}

		await this.checkAllServicesHealth()
	}

	private async startService(serviceName: keyof typeof services) {
		const directory = services[serviceName]

		// Check if service is already running
		const isRunning = await this.isServiceRunning(serviceName)
		if (isRunning) {
			console.log(
				`${yellow('Notice:')} ${serviceName} service is already running`,
			)
			return
		}

		console.log(`Starting ${serviceName} service...`)

		const process = new Deno.Command('docker', {
			args: [
				'compose',
				'-f',
				join(directory, 'docker-compose.yaml'),
				'up',
				'-d',
			],
			stdout: 'piped',
			stderr: 'piped',
		})

		const { code, stdout, stderr } = await process.output()

		if (code === 0) {
			console.log(`${green('Successfully started')} ${serviceName}`)
			if (stdout.length > 0) console.log(new TextDecoder().decode(stdout))
		} else {
			console.error(`${red('Error starting')} ${serviceName}`)
			if (stderr.length > 0) console.error(new TextDecoder().decode(stderr))
			throw new Error(`Failed to start ${serviceName}`)
		}
	}

	private async waitForHealthyService(serviceName: string) {
		console.log(`Waiting for ${serviceName} to be healthy...`)
		const startTime = Date.now()

		while (true) {
			const isHealthy = await this.checkServiceHealth(serviceName)

			if (isHealthy) {
				console.log(`${green('✓')} ${serviceName} is healthy`)
				return true
			}

			if (Date.now() - startTime > ServiceManager.HEALTH_CHECK_TIMEOUT) {
				throw new Error(`Timeout waiting for ${serviceName} to become healthy`)
			}

			console.log(
				`${yellow('?')} Waiting for ${serviceName} to become healthy...`,
			)
			await new Promise(resolve =>
				setTimeout(resolve, ServiceManager.HEALTH_CHECK_INTERVAL),
			)
		}
	}

	private async checkServiceHealth(serviceName: string): Promise<boolean> {
		const process = new Deno.Command('docker', {
			args: [
				'ps',
				'--format',
				'{{.Names}},{{.Status}}',
				'--filter',
				`name=${serviceName}`,
			],
			stdout: 'piped',
		})

		const { code, stdout } = await process.output()
		if (code !== 0) return false

		const output = new TextDecoder().decode(stdout)
		return output.includes('healthy')
	}

	private async isServiceRunning(serviceName: string): Promise<boolean> {
		const process = new Deno.Command('docker', {
			args: ['ps', '--filter', `name=${serviceName}`, '--format', '{{.State}}'],
			stdout: 'piped',
		})

		const { code, stdout } = await process.output()
		const output = new TextDecoder().decode(stdout).trim()

		return code === 0 && output === 'running'
	}

	private async setupPowersync() {
		console.log('Setting up PowerSync...')

		const process = new Deno.Command('docker', {
			args: [
				'compose',
				'-f',
				join(services.postgres, 'docker-compose.yaml'),
				'exec',
				'db',
				'psql',
				'-U',
				'postgres',
				'-f',
				'/docker-entrypoint-initdb.d/setup_powersync.sql',
			],
			stdout: 'piped',
			stderr: 'piped',
		})

		const { code, stdout, stderr } = await process.output()

		if (code === 0) {
			console.log(`${green('PowerSync setup completed successfully')}`)
			if (stdout.length > 0) console.log(new TextDecoder().decode(stdout))
		} else {
			console.error(`${red('Error during PowerSync setup:')}`)
			if (stderr.length > 0) console.error(new TextDecoder().decode(stderr))
			throw new Error('PowerSync setup failed')
		}
	}

	private async checkAllServicesHealth() {
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
		}
	}
}

// Main execution
if (import.meta.main) {
	const manager = new ServiceManager()
	const args = Deno.args as (keyof typeof services)[]

	// Validate service names
	const invalidServices = args.filter(service => !(service in services))
	if (invalidServices.length > 0) {
		console.error(
			`${red('Error:')} Invalid service(s) specified: ${invalidServices.join(', ')}`,
		)
		Deno.exit(1)
	}

	try {
		await manager.startServices(args.length > 0 ? args : undefined)
	} catch (error) {
		if (error instanceof Error) {
			console.error(red('Error:'), error.message)
		} else {
			console.error(red('Error:'), error)
		}
		Deno.exit(1)
	}
}
