# Use an official Node.js runtime as a parent image
FROM node:16-alpine

# Set the working directory to the app directory
WORKDIR /app

# Copy the app source code to the container
COPY . .

# Install app dependencies
RUN npm install

# Expose the port the app listens on
EXPOSE 5173

# Start the app
CMD ["npm", "run", "dev", "--", "--host"]
