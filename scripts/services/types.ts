// Order of services is important for the Docker services to start in the correct order
export const services = {
	email: '../../services/email',
	postgres: '../../services/postgres',
	powersync: '../../services/powersync',
	supertokens: '../../services/supertokens',
} as const

export const servicesVolumes = {
	postgres: {
		name: 'postgres',
		volumes: ['postgres_pg_data'],
	},
	powersync: {
		name: 'powersync',
		volumes: ['powersync_mongo_storage'],
	},
	// supertokens: {
	// 	name: 'supertokens',
	// 	volumes: [],
	// },
} as const
