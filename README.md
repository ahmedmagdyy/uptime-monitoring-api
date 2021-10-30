# Uptime Monitoring Api
## _Monitor the availability of wesites based on specified interval._

Api built with nodejs, mongodb, bullMQ and redis.

## Features

- Sign-up with email verification.
- Stateless authentication using JWT.
- Users can create a check to monitor a given URL if it is up or down.
- Users can edit, pause, or delete their checks if needed.
- Users may receive a notification on a webhook URL by sending HTTP POST request whenever a check goes down or up.
- Users should receive email alerts whenever a check goes down or up.
- Users can get detailed uptime reports about their checks availability, average response time, and total uptime/downtime.
- Users can group their checks by tags and get reports by tag.

## Installation

To run the api make sure you have [Docker](https://docs.docker.com/get-docker/) and [Docker-compose](https://docs.docker.com/compose/install/) installed.

Clone the repo.
```
git clone https://github.com/ahmedmagdyy/uptime-monitoring-api.git
cd uptime-monitoring-api
```
Create your own .env file based on .env.example file.

run:
```sh
docker-compose up -d
```

Verify the api is running by navigating to server address in your preferred browser.

```sh
http://localhost:7000
```
you should see OK!.



To view swagger docs.
```sh
http://localhost:7000/api-docs/
```

## License

MIT