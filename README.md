# FoodApp - Multi-Frontend E-Commerce Platform

## Project Overview

FoodApp is a comprehensive food e-commerce platform with a split frontend-backend architecture. It provides three separate frontend applications for different user roles (User, Admin, Delivery) and a unified backend API.

## Folder Structure

```
foodapp/
├── user/           # User Frontend (Customer-facing app)
├── admin/          # Admin Frontend (Restaurant/Admin management)
├── delivery/       # Delivery Partner Frontend
├── backend/        # Backend API (Node.js/Express)
├── package.json    # Root package with dev:all script
└── README.md       # This file
```

## Port Map

| Service          | URL                              |
|------------------|----------------------------------|
| User Frontend    | http://localhost:3000            |
| Admin Frontend   | http://localhost:3001            |
| Delivery Frontend| http://localhost:3002            |
| Backend API      | http://localhost:2005           |

## Execution Instructions

To start the entire system, run the following command from the root folder:

```bash
npm run dev:all
```

This will simultaneously start all four services:
- User Frontend (port 3000)
- Admin Frontend (port 3001)
- Delivery Frontend (port 3002)
- Backend API (port 2005)

## Individual Service Commands

You can also run services individually:

```bash
npm run dev:user      # Start User Frontend
npm run dev:admin     # Start Admin Frontend
npm run dev:delivery  # Start Delivery Frontend
npm run dev:backend   # Start Backend API
```

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express + PostgreSQL
- **Authentication**: JWT