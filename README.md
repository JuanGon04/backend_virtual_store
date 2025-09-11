<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Backend Virtual Store

Backend Virtual Store es una API RESTful desarrollada con **NestJS** y **MySQL**, que gestiona usuarios, **roles, productos, órdenes y pagos (PayPal)**.
Implementa **Prisma** como ORM y **Redis** para caché, optimizando el rendimiento en consultas frecuentes.
Está diseñada con una arquitectura modular y escalable, lista para entornos de desarrollo y producción mediante **Docker**.

---

## Características principales

- **Autenticación y autorización** con **JWT** y **cookies** (inicio de sesión seguro y persistente).  
- **Gestión de usuarios y roles** (administrador, cliente).  
- **Catálogo de productos** con CRUD completo.  
- **Gestión de órdenes** (creación, actualización, historial).  
- **Pagos integrados con PayPal**.  
- **Base de datos MySQL** gestionada con **Prisma ORM**.  
- Preparado para **despliegue en contenedores** con `docker-compose`.  

---

## Tecnologías utilizadas

- [NestJS](https://nestjs.com/) – Framework principal  
- [TypeScript](https://www.typescriptlang.org/) – Lenguaje  
- [MySQL](https://www.mysql.com/) – Base de datos relacional  
- [Prisma](https://www.prisma.io/) – ORM para MySQL 
- [Swagger](https://swagger.io/) - Documentación de API
- [Redis](https://redis.io/) - Servidor de Caché
- [JWT](https://jwt.io/) – Tokens para sesiones  
- **Cookies HTTP-only** – Manejo seguro de sesiones  
- [Docker](https://www.docker.com/) – Contenerización  
- [Docker Compose](https://docs.docker.com/compose/) – Orquestación de servicios  
- [PayPal SDK](https://developer.paypal.com/sdk/rest/) – Pasarela de pagos  

---

## Estructura del proyecto

```bash
backend_virtual_store/
├── prisma/              # Definición del esquema y migraciones de Prisma  
│   ├── migrations/
├── src/
│   ├── auth/             # Autenticación (JWT + cookies, estrategias, guards)
│   │      ├── dto/
│   │      ├── interface/   
│   ├── cache-redis/      # Servicio dedicado a la conexión con el servidor de caché
│   ├── common/           # Utilidades, interceptores, pipes, decoradores
│   │      ├── config/
│   │      ├── decorators/
│   │      ├── dto/
│   │      ├── guards/
│   │      ├── interfaces/
│   │      └── utils/ 
│   ├── orders/           # Gestión de órdenes
│   │      ├── dto/
│   │      ├── helpers/ 
│   ├── payments/         # Integración con PayPal
│   │      ├── dto/
│   │      ├── helpers/ 
│   ├── prisma/      # Servicio dedicado a la conexión con el cliente de ORM prisma
│   ├── products/         # CRUD de productos
│   │      ├── dto/
│   │      ├── helpers/ 
│   ├── app.module.ts 
│   └── main.ts           # Punto de entrada de la aplicación
├── docker-compose.yml
├── Dockerfile
├── package.json
└── README.md
```
---
## Instalación y ejecución

### Requisitos previos
- Node v20.17.0
- npm o yarm
- MySQL
- Redis (opcional, para mejorar el rendimiento)
- NestJS v11+

### 1. Clonar el repositorio

```bash
git clone https://github.com/JuanGon04/backend_virtual_store.git
cd backend_virtual_store
```

### 2. Configurar variables de entorno

Crear un archivo .env en la raíz del proyecto con el contenido mostrado en el .template.env

### 3. Ejecutar con Docker
```bash
docker-compose up --build
```
Esto levantará:
- API en localhost: ${PORT}
- MySQL en localhost: ${PORT_DATABASE}
- Redis en localhost:6379

### 4. Ejecutar en desarrollo sin Docker
```bash
npm install
npm run start:dev #Ya esta incluido el npx prisma migrate dev
```
---

## Ejemplo de request/response
### Crear producto (admin)
```http
POST /api/products
Authorization: cookie <JWT>
Content-Type: application/json

{
  "name": "Amortiguador trasero",
  "description": "Amortiguador trasero seguridad, estabilidad y resistencia en todo tipo de caminos.",
  "price": 120.50,
  "brand": 'Toyota',
  "inpunt": 150
}
```

### Response
```json
{
  message: 'Product created successfully',
  status: 201,
}
```