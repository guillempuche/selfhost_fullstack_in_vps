# SuperTokens Dashboard Setup Guide

## Quick Start

To access the SuperTokens dashboard at `http://api.localhost:3020/auth/dashboard`, you first need to create an admin user.

1. Create a new admin user using cURL:

```bash
curl --location --request POST 'http://localhost:3567/recipe/dashboard/user' \
--header 'rid: dashboard' \
--header 'api-key: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "YOUR_EMAIL",
    "password": "YOUR_PASSWORD"
}'
```

2. Replace the placeholders:
   - `YOUR_API_KEY`: The API key set in your docker-compose environment (`AUTH_API_KEY`)
   - `YOUR_EMAIL`: Your admin email
   - `YOUR_PASSWORD`: Your chosen password

3. Once created, visit:

```
http://api.localhost:3020/auth/dashboard
```

4. Log in with your email and password

Note: Make sure your SuperTokens service is running before attempting to create the admin user or access the dashboard.
