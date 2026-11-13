# Etapa 1: build
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Coolify inyecta API_URL (desde .env.example / Environment Variables) en el build de prod.
ARG API_URL=https://back.purificadoratancol.com/api/v1/
RUN sed -i "s|apiUrl:[[:space:]]*'[^']*'|apiUrl: '${API_URL}'|" src/environments/environment.ts

# Versión de la imagen para assets/version.json (recarga silenciosa de pestañas abiertas).
# Coolify u otro CI pasa el commit como build-arg; sin ARG Docker lo descarta, y sin ENV
# no llega a process.env de scripts/write-version.mjs. Hacen falta los dos.
ARG SOURCE_COMMIT=
ARG COMMIT_SHA=
ARG CI_COMMIT_SHA=
ARG GITHUB_SHA=
ARG GIT_COMMIT=
ENV SOURCE_COMMIT=$SOURCE_COMMIT \
    COMMIT_SHA=$COMMIT_SHA \
    CI_COMMIT_SHA=$CI_COMMIT_SHA \
    GITHUB_SHA=$GITHUB_SHA \
    GIT_COMMIT=$GIT_COMMIT

# build:release corre write-version.mjs con este ENV y luego ng build. No usar `ng build`
# directo: prebuild solo corre con `npm run build` y se copiaría el {"version":"dev"} del repo.
RUN npm run build:release

# El version.json servido es el del dist. Si quedó vacío, inválido o en "dev", la imagen no se publica.
RUN node scripts/check-dist-version.mjs dist/tancol-frontend/browser/assets/version.json

# Etapa 2: servir con nginx
FROM nginx:alpine

COPY --from=build /app/dist/tancol-frontend/browser /usr/share/nginx/html

# Angular routing fix + cache de version.json / index.html / bundles
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
