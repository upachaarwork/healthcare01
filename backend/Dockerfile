# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install deps first (layer caching — only re-runs if package.json changes)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client inside the container
RUN npx prisma generate

EXPOSE 5000

# Dev mode with hot reload
CMD ["npm", "run", "dev"]