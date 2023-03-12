# Enterprise web system

This project is a web application that uses a PostgreSQL database and Redis caching to store and retrieve data.

I'm tackling an industry problem where companies need to generate quotes for certain projects however, they cannot afford to hand out exact quotes as it could allow competitors to undercut them. 

The project should allow you to do the following:


- Create an account
- Sign in to said account
- Create Projects
- Add workers to projects
- Give workers pay grades eg "intern" | "junior" | "mid" | "senior"
- Give each grade of worker a set pay scale
- Give each grade of worker a total amount of hours 
- Output a final quote that has a fuzzed value (within a percentage of error) 
- Combine quotes from different projects
- + More!

## Requirements

- Go 1.16 or later
- Docker 20.10 or later
- Docker Compose 1.28 or later

## Installation

1. Clone the repository to your local machine:

2. Install Go on your system. You can download it from the official website: https://golang.org/dl/

3. Install Docker and Docker Compose on your system. You can download them from the official website: https://docs.docker.com/get-docker/

## Usage

1. Open a terminal and navigate to the project directory:


2. Start the Docker containers using Docker Compose: [in the main project directory] ``` docker-compose up```


This will start the PostgreSQL and Redis containers, and the web application will be available at http://localhost:8085/

**Note:** If you want to run the containers in the background, use the `-d` option:


## Configuration

### Environment Variables

The following environment variables can be set to configure the application:

- `POSTGRES_USER`: The username to use for the PostgreSQL database. Default is `postgres`.
- `POSTGRES_PASSWORD`: The password to use for the PostgreSQL database. Default is `password`.
- `POSTGRES_DB`: The name of the PostgreSQL database to use. Default is `postgres`.
- `REDIS_PASSWORD`: The password to use for the Redis server. Default is empty.
- `REDIS_DB`: The number of the Redis database to use. Default is 0.

### Ports

The following ports are used by the application:

- `5432`: PostgreSQL database port
- `6379`: Redis port
- `8085`: Web application port

## License

This project is licensed under the [MIT License](LICENSE).





