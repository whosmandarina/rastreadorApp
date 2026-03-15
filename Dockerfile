# Usar la imagen oficial de Node.js (Debian slim)
FROM node:20-slim

# Definir el directorio de trabajo
WORKDIR /app

# Copiamos los archivos de configuración PRIMERO
COPY package*.json ./

# INSTALAMOS las dependencias DENTRO del contenedor
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando para arrancar la aplicación
CMD ["npm", "start"]
