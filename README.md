Bullion X is a microservice-based stock portfolio simulator that lets users register and log in, track and trade virtual holdings, view a live-updating ticker of trending stocks, read market news, and manage a personalized watchlist—all within a modern Angular SPA front end backed by Spring Boot services and PostgreSQL databases.

Microservice Architecture
Each Spring Boot service (e.g. auth-service, upcoming portfolio-service) runs independently in its own Docker container, communicates over REST, and persists to its own PostgreSQL instance.

Stateless JWT Security
Users register and authenticate via the auth-service, which issues HMAC-SHA256–signed JWTs. The Angular client stores tokens in localStorage, attaches them on each request, and guards routes with an AuthGuard.

Angular 17 Front End
A standalone-component SPA built with reactive forms and RxJS drives the UI. We’ve crafted reusable “auth-card” components for login/registration (with animated candlestick charts) and a rich dashboard for portfolio metrics, holdings, news, and watchlist.

