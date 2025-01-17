import { green, red } from '@std/fmt/colors'

export async function removeVolumes(volumes: string[]) {
	for (const volume of volumes) {
		console.log(`Removing volume ${volume}...`)
		const process = new Deno.Command('docker', {
			args: ['volume', 'rm', volume],
			stdout: 'piped',
			stderr: 'piped',
		})

		const { code, stderr } = await process.output()

		if (code === 0) {
			console.log(`${green('Successfully removed volume')} ${volume}`)
		} else {
			const errorMessage = new TextDecoder().decode(stderr)
			console.error(`${red('Error removing volume')} ${volume}`)
			if (errorMessage.length > 0) console.error(errorMessage)

			// Stop the process if volume removal fails
			throw new Error(`Failed to remove volume ${volume}: ${errorMessage}`)
		}
	}
}
