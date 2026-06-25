# OneFreela

Plataforma de marketplace para serviços freelance. Clientes contratam serviços publicados por freelancers, com fluxo completo de pedido, pagamento, entrega, revisão e disputa.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | Spring Boot 4.0.6 · Java 21 |
| ORM | Spring Data JPA (Hibernate) |
| Banco de dados | MySQL 8.4 |
| Cache / Sessões | Redis 7 (Alpine) |
| Segurança | BCrypt |
| Frontend | HTML/CSS/JavaScript vanilla (sem framework) |
| Servidor estático | Nginx (Alpine) |
| Build | Maven Wrapper (`mvnw`) |
| Containerização | Docker Compose |

---

## Arquitetura

```
┌─────────────────────────────────────────────┐
│  Docker Compose                             │
│                                             │
│  ┌──────────────┐   /api/*   ┌───────────┐  │
│  │  Nginx :5500 │──────────▶│ Backend   │  │
│  │  (frontend)  │            │ :8080     │  │
│  └──────────────┘            └─────┬─────┘  │
│                                    │        │
│                           ┌────────┴──────┐ │
│                           │  MySQL  Redis │ │
│                           │  :3306  :6379 │ │
│                           └───────────────┘ │
└─────────────────────────────────────────────┘
```

- O backend roda **fora** do Docker (processo JVM local).
- O `docker-compose.yaml` sobe apenas a infraestrutura: MySQL, Redis e o servidor Nginx para o frontend.
- O Nginx serve os arquivos estáticos na porta `5500` e faz proxy reverso de `/api/*` para `host.docker.internal:8080`, permitindo que o frontend containerizado alcance o backend local.

---

## Estrutura do Projeto

```
onefreela/
├── src/main/java/br/unicesumar/onefreela/
│   ├── config/          # CorsConfig, SecurityConfig (por perfil)
│   ├── controller/      # Camada REST (um controller por domínio)
│   ├── dto/             # Objetos de entrada e saída da API
│   ├── entity/          # Entidades JPA (modelo de domínio)
│   ├── enums/           # Enumerações de status e tipos
│   ├── exception/       # GlobalExceptionHandler + ValidationException
│   ├── repository/      # Interfaces Spring Data JPA
│   ├── service/
│   │   ├── mapper/      # Conversão entidade ↔ DTO
│   │   └── validator/   # Validações de negócio por domínio
│   └── utils/
├── frontend/            # Páginas HTML + JS + CSS (sem bundler)
├── nginx/               # Configuração do Nginx
├── collection/          # Coleção de requisições (formato Bruno/OpenCollection)
├── docker-compose.yaml
├── pom.xml
├── run.sh               # Sobe backend com perfil dev
└── run_prod.sh          # Sobe backend com perfil prod
```

---

## Modelo de Domínio

### Entidades principais

| Entidade | Descrição |
|---|---|
| `User` | Único tipo de usuário; flags `isFreelancer` e `isAdmin` determinam papel |
| `Work` | Serviço publicado por um freelancer; passa por aprovação do admin |
| `WorkAdditional` | Adicionais opcionais vinculados a um `Work` |
| `Cart` / `CartItem` | Carrinho persistido por usuário; um carrinho por conta |
| `Order` / `OrderItem` | Pedido gerado a partir do carrinho; cada `CartItem` vira um `OrderItem` |
| `OrderItemAdditional` | Adicionais selecionados por item de pedido |
| `Payment` | Registro de pagamento associado ao pedido |
| `Delivery` / `DeliveryFile` | Entrega submetida pelo freelancer com arquivos anexos |
| `Conversation` / `Message` / `MessageAttachment` | Chat por `OrderItem` |
| `Favorite` | Relação usuário ↔ serviço favoritado |
| `Report` / `ReportAttachment` | Denúncias enviadas pelos usuários com anexo |
| `UserBalance` | Saldo financeiro individual |
| `PlatformBalance` | Saldo consolidado da plataforma (disponível + pendente) |
| `FinancialTransaction` | Histórico de movimentações financeiras |

### Relacionamentos-chave

- `User` 1–1 `Cart`
- `Cart` 1–N `CartItem`; `CartItem` N–1 `Work`
- `Order` 1–N `OrderItem`; `Order` N–1 `User`
- `OrderItem` possui máquina de estados via `OrderItemStatus`
- `Delivery` N–1 `OrderItem`; `Delivery` 1–N `DeliveryFile`
- `Conversation` 1–1 `OrderItem`; `Conversation` 1–N `Message`

---

## Autenticação

O sistema **não usa JWT**. A autenticação é baseada em sessões gerenciadas no Redis.

### Fluxo

1. Cliente envia `POST /users/login` com `{ email, password }`.
2. O backend valida as credenciais com BCrypt.
3. `SessionService` gera um `UUID` e armazena **dois** pares no Redis com TTL de 1 hora:
   - `token → userId`
   - `userId → token` (evita sessões duplicadas — reutiliza token existente)
4. O token é retornado ao cliente e salvo em `localStorage` como `of_token`.
5. Requisições autenticadas enviam o header:
   ```
   Authorization: <uuid-token>
   ```
   **Sem prefixo `Bearer`.**

### Verificação server-side

`AuthService.getAuthenticatedUser(HttpServletRequest)` lê o header `Authorization`, consulta o Redis para obter o `userId`, carrega o `User` do banco e verifica se está bloqueado.

### Controle client-side (`auth.js`)

- `OFAuth.getToken()` — lê `of_token` do `localStorage`.
- `OFAuth.isTokenExpired()` — compara o timestamp de `of_token_expiry` com `Date.now()`.
- Interceptor global de `fetch` força logout em qualquer resposta `401`.
- `setInterval` de 60 s verifica expiração enquanto a página está aberta.

---

## Perfis de Execução

| Perfil | `SecurityConfig` | Uso |
|---|---|---|
| `dev` | CSRF desabilitado, todas as rotas liberadas | Desenvolvimento local |
| `prod` | Configuração restritiva | Produção |

```bash
# desenvolvimento
./run.sh          # equivale a: ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# produção
./run_prod.sh     # equivale a: ./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

---

## API Reference

Base URL: `http://localhost:8080`

### Usuários — `/users`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/users/register` | Cadastro de novo usuário |
| `POST` | `/users/login` | Login por credenciais → retorna token |
| `POST` | `/users/loginToken` | Validação de token existente |
| `PUT` | `/users/updateUser` | Atualização de dados do usuário autenticado |

### Serviços — `/works`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/works/myWorks` | Lista serviços do freelancer autenticado |
| `POST` | `/works/register` | Publica novo serviço (status inicial: `PENDING_REVIEW`) |
| `PUT` | `/works/updateWork/{id}` | Atualiza serviço próprio |
| `DELETE` | `/works/deleteWork/{id}` | Remove serviço próprio |
| `GET` | `/works/search` | Busca pública de serviços ativos |

### Carrinho — `/cart`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/cart/show` | Retorna carrinho do usuário autenticado |
| `POST` | `/cart/addItem` | Adiciona item ao carrinho |
| `DELETE` | `/cart/removeItem/{id}` | Remove item do carrinho |

### Pedidos — `/order`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/order/createOrder` | Cria pedido a partir de itens do carrinho |

Body: `{ cartItemIds: [], additionalsByCartItem: {}, paymentMethod: "PIX|CARTAO|BALANCE" }`

### Pagamentos — `/payment`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/payment/makePaymentPix` | Pagamento via PIX (`orderId`, `cpf`) |
| `POST` | `/payment/makePaymentCard` | Pagamento via cartão (`orderId`, `cardNumber`, `name`, `expirationDate`, `cvv`, `cpf`) |
| `POST` | `/payment/makePaymentBalance/{orderId}` | Pagamento via saldo interno |

### Chat / Fluxo de entrega — `/chat`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/chat/orderItem/{id}` | Busca mensagens da conversa |
| `POST` | `/chat/orderItem/{id}` | Envia mensagem |
| `POST` | `/chat/delivery` | Freelancer faz entrega |
| `POST` | `/chat/acceptDelivery` | Cliente aceita entrega → `COMPLETED` |
| `POST` | `/chat/refuseDelivery` | Cliente recusa entrega → `ADJUSTMENT_REQUEST` |
| `POST` | `/chat/acceptAdjustment` | Freelancer aceita revisão |
| `POST` | `/chat/refuseAdjustment` | Freelancer recusa revisão |
| `POST` | `/chat/openDispute` | Abre disputa → `ON_DISPUTE` |
| `POST` | `/chat/acceptDeliveryAfterFreeze` | Aceita entrega após período de congelamento |

### Entregas — `/delivery`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/delivery/findPending` | Itens pendentes do freelancer |
| `GET` | `/delivery/findOnDispute` | Itens em disputa |
| `GET` | `/delivery/findPendingAdjustments` | Itens com ajuste solicitado |
| `GET` | `/delivery/findCompleted` | Itens concluídos |
| `POST` | `/delivery/makeDelivery` | Submete entrega com arquivo |
| `POST` | `/delivery/acceptDelivery/{id}` | Aceita entrega |
| `POST` | `/delivery/refuseDelivery/{id}` | Recusa entrega |
| `POST` | `/delivery/acceptAdjustment/{id}` | Aceita solicitação de ajuste |
| `POST` | `/delivery/refuseAdjustment/{id}` | Recusa solicitação de ajuste |

### Favoritos — `/favorites`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/favorites` | Lista favoritos do usuário |
| `POST` | `/favorites/{workId}` | Adiciona serviço aos favoritos |
| `DELETE` | `/favorites/{workId}` | Remove serviço dos favoritos |
| `GET` | `/favorites/{workId}/check` | Verifica se serviço está favoritado |

### Denúncias — `/reports`

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/reports/register` | Envia denúncia (multipart com anexo) |
| `GET` | `/reports/myReports` | Lista denúncias do usuário autenticado |

### Saldo — `/balance`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/balance/me` | Saldo do usuário autenticado |
| `POST` | `/balance/withdraw` | Saque do saldo individual |
| `GET` | `/balance/platform` | Saldo da plataforma (admin) |
| `POST` | `/balance/platform/withdraw` | Saque do saldo da plataforma (admin) |

### Admin — `/admin`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/admin/users` | Lista todos os usuários |
| `POST` | `/admin/removeUser/{id}` | Remove usuário |
| `POST` | `/admin/makeUserAdmin/{id}` | Promove usuário a admin |
| `POST` | `/admin/removeUserAdmin/{id}` | Remove privilégio admin |
| `GET` | `/admin/works` | Lista todos os serviços |
| `GET` | `/admin/works/pending` | Lista serviços aguardando aprovação |
| `PUT` | `/admin/works/reviewWork/{id}` | Aprova ou rejeita serviço (`status`, `adminNotes`) |
| `POST` | `/admin/works/pauseWork/{id}` | Pausa serviço ativo |
| `POST` | `/admin/removeWork/{id}` | Remove serviço |
| `GET` | `/admin/reports/all` | Lista todas as denúncias |
| `GET` | `/admin/reports/status` | Denúncias por status |
| `PUT` | `/admin/reports/updateStatus/{id}` | Atualiza status de denúncia |
| `GET` | `/admin/disputes` | Lista todas as disputas |
| `GET` | `/admin/disputes/{id}/messages` | Mensagens de uma disputa |
| `POST` | `/admin/disputes/{id}/resolveForFreelancer` | Resolve disputa a favor do freelancer |
| `POST` | `/admin/disputes/{id}/resolveForClient` | Resolve disputa a favor do cliente |

---

## Enumerações

### `WorkStatus`
```
PENDING_REVIEW → ACTIVE
               → REJECTED
ACTIVE         → INACTIVE
```

### `OrderItemStatus`
```
PENDING_DELIVERY
  └─ (entrega feita) → PENDING_DELIVERY_REVISION
       ├─ (aceito)   → COMPLETED
       ├─ (recusado) → ADJUSTMENT_REQUEST
       │    └─ (nova entrega) → PENDING_DELIVERY_REVISION
       └─ (disputa aberta) → ON_DISPUTE
            └─ (resolvido) → COMPLETED | REFUNDED
FROZEN       → COMPLETED  (após período de congelamento)
```

### `PaymentMethod`
`PIX` · `CARTAO` · `BALANCE`

### `PaymentStatus`
Gerenciado internamente pelo `PaymentService`.

### `ReportStatus` / `ReportNature`
Gerenciados pelo fluxo de admin em `/reports`.

### `TransactionType`
Categoriza entradas em `FinancialTransaction`.

---

## Tratamento de Erros

Todos os erros retornam o seguinte envelope JSON:

```json
{
  "code": "ERROR_CODE_ENUM",
  "errors": [
    {
      "code": "SPECIFIC_CODE",
      "field": "nomeDoCampo",
      "message": "Descrição legível do erro"
    }
  ],
  "method": "POST",
  "path": "/users/login",
  "timestamp": "2026-06-25T10:30:00"
}
```

- Erros de autenticação/autorização (`TOKEN_NOT_FOUND`, `TOKEN_EXPIRED`, `UNAUTHORIZED`, `USER_BLOCKED`) retornam **HTTP 401**.
- Erros de validação de negócio retornam **HTTP 400**.
- O `GlobalExceptionHandler` (`@RestControllerAdvice`) intercepta `ValidationException` e `MethodArgumentNotValidException`.

---

## Como Rodar

### Pré-requisitos

- Java 21+
- Docker e Docker Compose
- Maven (ou usar o wrapper `./mvnw`)

### 1. Subir a infraestrutura

```bash
docker compose up -d
```

Sobe MySQL (`:3306`), Redis (`:6379`) e Nginx/frontend (`:3000`).

### 2. Subir o backend

```bash
./run.sh
# ou diretamente:
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

O backend ficará disponível em `http://localhost:8080`.

### 3. Acessar o frontend

Abrir `http://localhost:3000` no navegador.

---

## Coleção de API

O diretório `collection/` contém requisições no formato **Bruno/OpenCollection** (`.yml`) cobrindo os principais fluxos: login, cadastro, carrinho, pedido, pagamento e admin.

---

## Configuração do Banco

O Docker Compose cria o banco `onefreeladb` automaticamente. O Spring Boot (Hibernate) gerencia o DDL via `spring.jpa.hibernate.ddl-auto` conforme o perfil ativo. As credenciais padrão do container são:

| Variável | Valor |
|---|---|
| `MYSQL_ROOT_PASSWORD` | `12345` |
| `MYSQL_DATABASE` | `onefreeladb` |
| Host (local) | `localhost:3306` |
