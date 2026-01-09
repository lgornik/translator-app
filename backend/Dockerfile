FROM node:20-alpine
WORKDIR /app

# Copy root package.json and workspace configs
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

# Install all workspace dependencies
RUN npm install

# Copy source code
COPY backend/ ./backend/
COPY shared/ ./shared/

WORKDIR /app/backend

EXPOSE 4000

CMD ["npm", "run", "dev"]
