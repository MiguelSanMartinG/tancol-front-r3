# Etapa 1: build
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Coolify inyecta API_URL (desde .env.example / Environment Variables) en el build de prod.
ARG API_URL=https://back.purificadoratancol.com/api/v1/
RUN sed -i "s|apiUrl:[[:space:]]*'[^']*'|apiUrl: '${API_URL}'|" src/environments/environment.ts

RUN npm run build

# Etapa 2: servir con nginx
FROM nginx:alpine

COPY --from=build /app/dist/tancol-frontend/browser /usr/share/nginx/html

# Angular routing fix
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
