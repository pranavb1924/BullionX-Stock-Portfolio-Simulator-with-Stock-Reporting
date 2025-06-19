Bullion X is a microservice-based stock portfolio simulator that lets users register and log in, track and trade virtual holdings, view a live-updating ticker of trending stocks, read market news, and manage a personalized watchlist—all within a modern Angular SPA front end backed by Spring Boot services and PostgreSQL databases.

Microservice Architecture
Each Spring Boot service (e.g. auth-service, upcoming portfolio-service) runs independently in its own Docker container, communicates over REST, and persists to its own PostgreSQL instance.

Stateless JWT Security
Users register and authenticate via the auth-service, which issues HMAC-SHA256–signed JWTs. The Angular client stores tokens in localStorage, attaches them on each request, and guards routes with an AuthGuard.

Angular 17 Front End
A standalone-component SPA built with reactive forms and RxJS drives the UI. We’ve crafted reusable “auth-card” components for login/registration (with animated candlestick charts) and a rich dashboard for portfolio metrics, holdings, news, and watchlist.

Type-Safe DTOs & Models
Shared TypeScript interfaces (UserDto, Stock, NewsItem, PortfolioMetrics) mirror backend DTOs, ensuring consistency and compile-time safety across client and server.

CI/CD & Containerization
Every service and the Angular app are Dockerized. In GitHub Actions workflows we build, test, and push images to our container registry, ready for deployment.

Kubernetes Deployment
Deployed to a managed K8s cluster (EKS/GKE), with each service in its own Deployment & Service, PostgreSQL via StatefulSet (or managed RDS), and an NGINX Ingress routing /api/auth/** to auth-service, /api/portfolio/** to portfolio-service, and the SPA to the frontend.

Externalized Config & Secrets
Production JWT secrets, DB credentials, and API URLs are managed via Kubernetes Secrets and Spring profiles (application-prod.yaml). Angular’s environment.prod.ts swaps in the real API endpoints at build time.

Observability & Autoscaling
We’re integrating Prometheus + Grafana for metrics (latency, JVM/memory), ELK/EFK for centralized logging, and Kubernetes HPA to scale services based on CPU/RAM.
