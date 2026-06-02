# Clean Architecture Structure

This project follows **Clean Architecture** principles with a clear separation of concerns across multiple layers.

## Directory Structure

```
src/main/java/matia/glpicore/
│
├── presentation/                    # REST Layer (Controller & DTOs)
│   ├── controller/                  # REST Controllers
│   │   └── UserController.java
│   ├── request/                     # Input DTOs (Request objects)
│   │   ├── CreateUserRequest.java
│   │   └── UpdateUserRequest.java
│   └── response/                    # Output DTOs (Response objects)
│       └── UserResponse.java
│
├── application/                     # Business Logic Layer
│   ├── service/                     # Service Interfaces & Implementations
│   │   ├── UserService.java         # Interface
│   │   └── impl/
│   │       └── UserServiceImpl.java  # Implementation
│   └── dto/                         # Internal Application DTOs
│       └── UserApplicationDTO.java
│
├── domain/                          # Business Rules & Entities
│   └── entity/                      # Domain Entities (JPA)
│       └── User.java
│
├── infrastructure/                  # External Dependencies
│   └── repository/                  # Data Access Layer
│       └── UserRepository.java
│
├── exception/                       # Custom Exceptions
│   ├── ResourceNotFoundException.java
│   ├── DuplicateResourceException.java
│   └── GlobalExceptionHandler.java
│
├── util/                            # Utility Classes
│   └── mapper/                      # DTO Mappers
│       └── UserMapper.java
│
├── config/                          # Configuration
│   └── ApplicationConfig.java
│
└── GlpiCoreApplication.java         # Main Spring Boot Application
```

## Layer Responsibilities

### 1. **Presentation Layer** (`presentation/`)
- Handles HTTP requests and responses
- Contains REST controllers
- Manages request/response DTOs
- Does NOT contain business logic
- Uses `@RestController` and `@RequestMapping` annotations

### 2. **Application Layer** (`application/`)
- Implements use cases and business logic
- Contains service interfaces and implementations
- Uses application-specific DTOs (internal)
- Orchestrates interactions between layers
- Handles transactional operations (`@Transactional`)

### 3. **Domain Layer** (`domain/`)
- Contains business entities (JPA entities)
- Represents core business logic
- Independent of frameworks (mostly)
- Used by both infrastructure and application layers

### 4. **Infrastructure Layer** (`infrastructure/`)
- Implements data access (repositories)
- Database operations using Spring Data JPA
- External service integrations
- Hides database details from higher layers

### 5. **Exception Handling** (`exception/`)
- Custom exceptions for business logic
- Global exception handler for REST layer
- Consistent error responses

### 6. **Utilities** (`util/`)
- Helper classes and utilities
- Mapper classes for DTO conversions
- Common functions used across layers

### 7. **Configuration** (`config/`)
- Spring configuration classes
- Bean definitions
- Application settings

## Data Flow

```
HTTP Request
    ↓
Presentation Layer (Controller)
    ↓
Application Layer (Service)
    ↓
Domain Layer (Entity)
    ↓
Infrastructure Layer (Repository)
    ↓
Database
    ↓
Infrastructure Layer (Repository)
    ↓
Domain Layer (Entity)
    ↓
Application Layer (Service & Mapper)
    ↓
Presentation Layer (Mapper & Response)
    ↓
HTTP Response
```

## DTO Types

### 1. **Presentation DTOs**
- Location: `presentation/request/` & `presentation/response/`
- Usage: API contracts (input/output)
- Example: `CreateUserRequest`, `UserResponse`

### 2. **Application DTOs**
- Location: `application/dto/`
- Usage: Internal data transfer between layers
- Example: `UserApplicationDTO`

## Key Principles

1. **Dependency Injection**: Use constructor injection for dependencies
2. **Single Responsibility**: Each class has one reason to change
3. **Separation of Concerns**: Each layer has distinct responsibilities
4. **Interface-based**: Services use interfaces for abstraction
5. **Immutability**: Use `@Data`, `@Builder` from Lombok
6. **Transaction Management**: Use `@Transactional` in service layer
7. **Logging**: Use SLF4J with Lombok's `@Slf4j`

## Adding New Features

When adding a new feature (e.g., Product management):

1. Create domain entity: `domain/entity/Product.java`
2. Create repository: `infrastructure/repository/ProductRepository.java`
3. Create service interface: `application/service/ProductService.java`
4. Create service implementation: `application/service/impl/ProductServiceImpl.java`
5. Create application DTO: `application/dto/ProductApplicationDTO.java`
6. Create request DTOs: `presentation/request/CreateProductRequest.java`
7. Create response DTO: `presentation/response/ProductResponse.java`
8. Create mapper: `util/mapper/ProductMapper.java`
9. Create controller: `presentation/controller/ProductController.java`
10. Create tests: `src/test/java/matia/glpicore/presentation/controller/ProductControllerTest.java`

## Testing Strategy

- Unit tests for services in `application/service/impl/`
- Integration tests for controllers in `presentation/controller/`
- Mock repositories for service tests
- Mock services for controller tests

## Benefits of This Architecture

✅ **Maintainability**: Clear structure makes code easy to understand and modify
✅ **Testability**: Layers are loosely coupled, making unit testing straightforward
✅ **Scalability**: Easy to add new features without affecting existing code
✅ **Reusability**: Services can be reused across different controllers
✅ **Flexibility**: Easy to swap implementations (e.g., database technology)
✅ **Independence**: Layers are independent of each other
