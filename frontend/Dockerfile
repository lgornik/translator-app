# Frontend Dockerfile - multi-stage build

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_GRAPHQL_URL
ENV VITE_GRAPHQL_URL=$VITE_GRAPHQL_URL

RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Kopiuj zbudowaną aplikację
COPY --from=builder /app/dist /usr/share/nginx/html

# Konfiguracja nginx dla SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
