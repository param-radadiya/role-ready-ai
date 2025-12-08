# --- Stage 1: Build the React App ---
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your app code
COPY . .

# Accept the API Key as a build argument
ARG GEMINI_API_KEY

# Create the .env.local file with the key inside
# (This embeds the key into the app during the build process)
RUN echo "GEMINI_API_KEY=$GEMINI_API_KEY" > .env.local

# Build the app for production (creates the 'dist' folder)
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Copy the custom nginx config we created
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built app from the previous stage to the Nginx folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Tell Google Cloud we are listening on port 8080
EXPOSE 8080

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
