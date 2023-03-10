FROM golang:latest

# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Set environment variables
ENV SECRET_KEY=$SECRET_KEY \
    SALT=$SALT 


# Build the Go API
RUN go build -o main .

# Expose port 8085
EXPOSE 8085

# Run the Go API when the container launches
CMD ["./main"]
