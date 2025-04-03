# Personal_Project
Sure! Below is a detailed **README** file for your Inventory Management System (IMS). You can adjust any specifics based on your project setup.

---

# Inventory Management System (IMS)

## Overview

The **Inventory Management System (IMS)** is a backend solution built with Node.js, designed to help businesses manage their product inventories across multiple stores. This system supports basic operations such as adding products, updating stock levels, tracking sales, and managing stock movements. It provides a RESTful API that can be easily integrated into web or mobile applications.

### Features

- **Multi-store Support**: Manage inventories for multiple stores.
- **Stock Movement Tracking**: Track stock-in, sales, and removals.
- **Database**: Supports both SQLite (for simplicity) and PostgreSQL (for scalability).
- **Authentication**: Secure API access with basic authentication.
- **Rate Limiting**: Prevents abuse by limiting API request frequency.

## Table of Contents

- [System Design](#system-design)
  - [Stage 1 (SQLite)](#stage-1-sqlite)
  - [Stage 2 (PostgreSQL)](#stage-2-postgresql)
  - [Stage 3 (PostgreSQL + Advanced Features)](#stage-3-postgresql--advanced-features)
- [API Endpoints](#api-endpoints)
- [Installation & Setup](#installation--setup)
  - [Stage 1 Setup](#stage-1-setup)
  - [Stage 2 Setup](#stage-2-setup)
  - [Stage 3 Setup](#stage-3-setup)
- [Usage](#usage)
  - [Stage 1 Usage](#stage-1-usage)
  - [Stage 2 Usage](#stage-2-usage)
  - [Stage 3 Usage](#stage-3-usage)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)

## System Design

### Stage 1 (SQLite)

- **Database**: SQLite is used in this stage for simplicity. It allows for quick setup and local storage without requiring a separate server.
- **Basic Operations**: Includes functionality to add products, update stock, track sales, and manage stock movements.
- **Stock Movement**: Logs stock changes for every addition, sale, or manual removal.

### Stage 2 (PostgreSQL)

- **Database**: PostgreSQL is used in this stage to support more complex, scalable systems.
- **Multi-store Support**: Each store has its own inventory, allowing businesses to track stock levels at multiple locations.
- **Authentication**: Basic authentication is implemented to secure API endpoints.
- **Rate Limiting**: API calls are limited to ensure the system remains stable and prevents overload.

### Stage 3 (PostgreSQL + Advanced Features)

- **Redis Caching**: Improves performance by caching frequently accessed data.
- **RabbitMQ**: Used for message queuing, allowing asynchronous processing of stock updates.
- **Improved Scalability**: Optimized for handling more traffic, with better database management and resource utilization.

## API Endpoints

### Stage 1 (SQLite) API Endpoints

- **POST /products**: Add a new product to the inventory.
- **POST /stock-in**: Add stock to a specific product.
- **POST /sell**: Sell a product, reducing stock.
- **POST /remove**: Manually remove stock from inventory.
- **GET /inventory**: Retrieve the current inventory of all products.
- **GET /stock-movement**: View logs of stock movements.

### Stage 2 (PostgreSQL) API Endpoints

- **POST /stores**: Add a new store.
- **POST /products**: Add a new product.
- **POST /stock-in**: Add stock for a specific product in a store.
- **POST /sell**: Sell a product from a specific store, updating stock levels.
- **GET /inventory/:store_id**: View inventory of a specific store.
- **GET /stock-movements/:store_id**: Retrieve stock movement logs for a store.

### Stage 3 (PostgreSQL + Advanced Features) API Endpoints

- **POST /products**: Add a new product.
- **POST /stock-in**: Add stock to a store with caching.
- **POST /sell**: Sell a product, updating stock asynchronously using RabbitMQ.
- **GET /inventory/:store_id**: Retrieve store inventory, with Redis caching.
- **GET /stock-movements/:store_id**: View stock movement logs for a store.
- **POST /async-stock-update**: Asynchronous stock update via RabbitMQ.

## Installation & Setup

### Stage 1 Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repository/inventory-management-system.git
   cd inventory-management-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   node stage1.js
   ```

4. **Access the API**: The server will be accessible at `http://localhost:5000`.

### Stage 2 Setup

1. **Install PostgreSQL**: Ensure PostgreSQL is installed on your machine.

2. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repository/inventory-management-system.git
   cd inventory-management-system
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Configure PostgreSQL**: Update the `Postgres_Config.js` file with your PostgreSQL credentials.

5. **Start the server**:
   ```bash
   node stage2.js
   ```

6. **Access the API**: The server will run on `http://localhost:5000`.

### Stage 3 Setup

1. **Install Redis**: Ensure Redis is installed on your machine.

2. **Install RabbitMQ**: Ensure RabbitMQ is installed and running.

3. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repository/inventory-management-system.git
   cd inventory-management-system
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Configure Redis and RabbitMQ**: Update the configuration files to match your Redis and RabbitMQ setups.

6. **Start the server**:
   ```bash
   node stage3.js
   ```

7. **Access the API**: The server will run on `http://localhost:5000`.

## Usage

### Stage 1 Usage

- **Add a product**:
  ```bash
  POST /products
  Content-Type: application/json
  {
    "name": "Product 1",
    "quantity": 100
  }
  ```

- **Increase stock**:
  ```bash
  POST /stock-in
  Content-Type: application/json
  {
    "product_id": 1,
    "quantity": 50
  }
  ```

- **Sell a product**:
  ```bash
  POST /sell
  Content-Type: application/json
  {
    "product_id": 1,
    "quantity": 20
  }
  ```

- **Get inventory**:
  ```bash
  GET /inventory
  ```

- **Get stock movements**:
  ```bash
  GET /stock-movement
  ```

### Stage 2 Usage

- **Add a store**:
  ```bash
  POST /stores
  Content-Type: application/json
  {
    "name": "Store 1"
  }
  ```

- **Add a product**:
  ```bash
  POST /products
  Content-Type: application/json
  {
    "name": "Product 2"
  }
  ```

- **Stock-in a product**:
  ```bash
  POST /stock-in
  Content-Type: application/json
  {
    "store_id": 1,
    "product_id": 1,
    "quantity": 100
  }
  ```

- **Sell a product**:
  ```bash
  POST /sell
  Content-Type: application/json
  {
    "store_id": 1,
    "product_id": 1,
    "quantity": 10
  }
  ```

- **Get inventory for a store**:
  ```bash
  GET /inventory/1
  ```

- **Get stock movements for a store**:
  ```bash
  GET /stock-movements/1?start_date=2025-01-01&end_date=2025-01-31
  ```

### Stage 3 Usage

- **Async stock update**:
  ```bash
  POST /async-stock-update
  Content-Type: application/json
  {
    "store_id": 1,
    "product_id": 1,
    "quantity": 30
  }
  ```

## Future Enhancements

- **User Roles and Permissions**: Different access levels for administrators, managers, and users.
- **Data Analytics**: Real-time analytics for stock, sales, and trends.
- **Mobile Application**: Create a mobile app to interact with the API for managing inventory.

## Contributing

Feel free to fork this repository and submit pull requests. Contributions are welcome, whether it's bug fixes, enhancements, or suggestions. Please follow the existing coding style and write tests for any new features added.

---

Let me know if you need any further modifications!