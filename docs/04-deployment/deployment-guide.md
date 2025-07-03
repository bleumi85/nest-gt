# Deployment Guide

## Introduction

This guide provides detailed instructions for deploying the application in different environments. It covers local development setup, staging deployment, and production deployment configurations.

## Deployment Architecture

```mermaid
flowchart TD
    subgraph "Client Side"
        Client["Client Application"]
    end
    
    subgraph "API Layer"
        LoadBalancer["Load Balancer"]
        API1["API Instance 1"]
        API2["API Instance 2"]
        API3["API Instance 3"]
    end
    
    subgraph "Database Layer"
        PrimaryDB[("Primary Database")]
        ReadReplica[("Read Replica")]
    end
    
    Client --> LoadBalancer
    LoadBalancer --> API1
    LoadBalancer --> API2
    LoadBalancer --> API3
    
    API1 --> PrimaryDB
    API2 --> PrimaryDB
    API3 --> PrimaryDB
    
    API1 -.-> ReadReplica
    API2 -.-> ReadReplica
    API3 -.-> ReadReplica
```

## Environment Configuration

### Environment Variables

The application uses environment variables for configuration. These should be set appropriately for each environment:

| Variable | Description | Example |
|----------|-------------|--------|
| `NODE_ENV` | Environment name | `development`, `staging`, `production` |
| `PORT` | Port for the application | `3000` |
| `DATABASE_URL` | Database connection string | `postgresql://user:password@localhost:5432/dbname` |
| `JWT_ACCESS_SECRET` | Secret for JWT access signing | `your-secret-key` |
| `JWT_ACCESS_EXPIRATION` | Access token expiration | `15m` |
| `JWT_REFRESH_SECRET` | Secret for JWT refresh signing | `another-secret-key` |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiration | `7d` |
| `EMAIL_HOST` | SMTP host for email | `smtp.example.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USER` | SMTP username | `user@example.com` |
| `EMAIL_PASSWORD` | SMTP password | `password` |
| `CORS_ORIGIN` | CORS allowed origins | `https://example.com` |

### Configuration Management

For secure configuration management in production:

- Use a secrets management service (AWS Secrets Manager, HashiCorp Vault, etc.)
- Never commit secrets to the repository
- Use different values for different environments
- Implement secrets rotation

## Local Development Setup

### Docker Compose Setup

The repository includes a `docker-compose.yml` file for local development:

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
    depends_on:
      - db

  db:
    image: postgres:13
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=app
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Starting Local Environment

```bash
# Build and start containers
docker-compose up -d

# Run database migrations
docker-compose exec api npm run prisma:migrate:dev

# Seed the database
docker-compose exec api npm run prisma:seed
```

## Staging Deployment

### Kubernetes Deployment

For staging environments, we use Kubernetes with the following components:

```mermaid
flowchart TD
    subgraph "Kubernetes Cluster"
        Ingress["Ingress Controller"] --> Service["API Service"]
        Service --> Pod1["API Pod 1"]
        Service --> Pod2["API Pod 2"]
        
        ConfigMap["ConfigMap"] -.-> Pod1
        ConfigMap -.-> Pod2
        
        Secrets["Secrets"] -.-> Pod1
        Secrets -.-> Pod2
        
        Pod1 --> DBService["Database Service"]
        Pod2 --> DBService
        DBService --> PostgreSQL["PostgreSQL StatefulSet"]
    end
```

### Deployment Configuration

```yaml
# api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: nestjs-template:staging
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: api-config
        - secretRef:
            name: api-secrets
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 200m
            memory: 256Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Database Migration Process

```bash
# Apply migrations before deployment
npx prisma migrate deploy

# Deploy application
kubectl apply -f kubernetes/staging
```

## Production Deployment

### High-Availability Configuration

For production environments, we implement a high-availability configuration:

```mermaid
flowchart TD
    subgraph "Zone A"
        LB1["Load Balancer A"] --> API1["API Cluster A"]
        API1 --> DB1[("Database Primary")]
    end
    
    subgraph "Zone B"
        LB2["Load Balancer B"] --> API2["API Cluster B"]
        API2 --> DB2[("Database Replica")]
    end
    
    DB1 <--> DB2
    
    DNS["DNS with Failover"] --> LB1
    DNS --> LB2
```

### Production Checklist

Before deploying to production, ensure:

1. All tests pass (unit, integration, E2E)
2. Security scanning has been performed
3. Performance testing has been completed
4. Database migrations are tested
5. Rollback procedures are documented
6. Monitoring and alerting are configured
7. Backup procedures are in place

### Blue-Green Deployment Strategy

We use a blue-green deployment strategy for zero-downtime updates:

```mermaid
sequenceDiagram
    participant Traffic as "User Traffic"
    participant BlueEnv as "Blue Environment"
    participant GreenEnv as "Green Environment"
    participant DB as "Database"
    
    Note over BlueEnv: Current Production
    Note over GreenEnv: New Version
    
    Traffic->>BlueEnv: 100% traffic
    BlueEnv->>DB: Read/Write
    
    Note over GreenEnv: Deploy new version
    
    Traffic->>BlueEnv: 90% traffic
    Traffic->>GreenEnv: 10% traffic
    BlueEnv->>DB: Read/Write
    GreenEnv->>DB: Read/Write
    
    Note over GreenEnv: Validate new version
    
    Traffic->>BlueEnv: 0% traffic
    Traffic->>GreenEnv: 100% traffic
    GreenEnv->>DB: Read/Write
    
    Note over BlueEnv: Becomes standby or updated to next version
```

### Scaling Considerations

#### Horizontal Scaling

- API instances can be horizontally scaled based on load
- Consider using autoscaling based on CPU/memory metrics
- Ensure session handling works with multiple instances

#### Database Scaling

- Use connection pooling for efficient database connections
- Implement read replicas for read-heavy workloads
- Consider sharding for very large datasets

## Monitoring and Observability

### Key Metrics to Monitor

| Metric Category | Key Metrics | Alert Threshold |
|-----------------|-------------|----------------|
| Application | Request rate, error rate, latency | Error rate > 1%, P95 latency > 500ms |
| Database | Query performance, connection count, disk usage | Slow queries > 1s, disk usage > 80% |
| System | CPU, memory, disk, network | CPU > 80%, memory > 80%, disk > 85% |

### Logging Strategy

- Use structured logging (JSON format)
- Include request IDs for tracing
- Include contextual information (user, resource, action)
- Centralize logs with a log aggregation solution

## Backup and Disaster Recovery

### Backup Strategy

- Daily full database backups
- Transaction log backups every 15 minutes
- Regular backup testing and validation
- Geo-redundant backup storage

### Disaster Recovery Plan

1. **Database failure:** Promote read replica to primary
2. **Application failure:** Route traffic to standby environment
3. **Zone outage:** Activate multi-region failover
4. **Complete outage:** Restore from backups to new infrastructure

## Maintenance Procedures

### Regular Maintenance

- Database index optimization (weekly)
- Log rotation and archiving (daily)
- Security patches (as released)
- Dependency updates (monthly)

### Scheduled Downtime

For maintenance requiring downtime:

1. Announce maintenance window
2. Implement maintenance page
3. Perform maintenance
4. Run validation tests
5. Restore service
6. Confirm successful restoration

This deployment guide provides comprehensive information for deploying and maintaining the application across different environments. Follow these guidelines to ensure reliable, secure, and efficient operations.
