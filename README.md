# Inventory Tracking System - Bazaar Technologies Case Study

## Overview
A scalable backend service for tracking inventory and stock movements, evolving from a single kiryana store to a multi-store enterprise system with audit capabilities. Built for Bazaar Technologies' Engineering internship challenge.

## Key Features
- **Stage 1**: Single-store implementation with SQLite
- **Stage 2**: Multi-store support with PostgreSQL + Basic Auth
- **Stage 3**: Enterprise-ready with Redis caching, RabbitMQ, and audit logs

## Tech Stack
| Component       | Stage 1       | Stage 2           | Stage 3                     |
|-----------------|---------------|-------------------|-----------------------------|
| **Database**    | SQLite        | PostgreSQL        | PostgreSQL + Redis          |
| **API**         | Express.js    | Express.js        | Express.js + Rate Limiting  |
| **Architecture**| Monolithic    | Multi-store       | Event-Driven (RabbitMQ)     |
| **Security**    | None          | Basic Auth        | Rate Limits + Auth          |
| **Scalability** | Single-store  | 500+ stores       | 1000+ stores with caching   |

## Design Decisions

### Database Design
- **Stage 1**: 
  ```sql
  CREATE TABLE products (id, name, quantity);
  CREATE TABLE stock_movements (id, product_id, change, action, timestamp);
  ```
- **Stage 2**: Added multi-store support:
  ```sql
  CREATE TABLE stores (id, name);
  CREATE TABLE store_inventory (store_id, product_id, quantity);
  ```
- **Stage 3**: Introduced audit logs:
  ```sql
  CREATE TABLE audit_logs (store_id, product_id, change, action, reason, timestamp);
  ```

### API Evolution
| Endpoint        | Stage 1 | Stage 2               | Stage 3                     |
|-----------------|---------|-----------------------|-----------------------------|
| Add Product     | ✅      | ✅                    | ✅ (Async via RabbitMQ)     |
| Stock Movement  | ✅      | ✅ (Per-store)        | ✅ (With audit logging)     |
| Get Inventory   | ✅      | ✅ (Filter by store)  | ✅ (Redis-cached)           |



## Evolution Rationale
1. **Stage 1 → Stage 2**:
   - Migrated to PostgreSQL for concurrent connections
   - Introduced store-level isolation
   - Added basic security with rate limiting

2. **Stage 2 → Stage 3**:
   - Implemented event-driven architecture for high throughput
   - Added Redis caching for frequent inventory queries
   - Introduced audit trails for compliance

## Future Improvements
- Implement JWT authentication
- Add predictive stock alerts using ML
- Multi-region database replication
- IoT integration for automated stock tracking

## Assumptions
1. Single product catalog across all stores
2. Stock movements are atomic operations
3. Audit logs are write-once/immutable
4. 99.9% inventory accuracy requirement

## License
MIT