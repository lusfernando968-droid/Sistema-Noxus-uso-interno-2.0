FROM node:20-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Instala dependências
RUN npm install --production

# Copia código fonte
COPY . .

# Build TypeScript
RUN npm run build

# Expõe porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Inicia aplicação
CMD ["node", "dist/server.js"]
