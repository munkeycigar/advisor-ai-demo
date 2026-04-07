FROM node:20-slim

WORKDIR /app

# Ensure HOME is set and writable (Claude CLI stores config there)
ENV HOME=/root

# Install Claude CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Copy package files and install deps
COPY package.json package-lock.json* ./
RUN npm install

# Copy app code
COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
