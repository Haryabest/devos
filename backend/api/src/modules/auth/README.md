# Auth Module

Ответственность:
- Регистрация (email/password, argon2 hash)
- Login → issue access + refresh JWT
- Refresh с ротацией токенов, отзыв старых
- `/auth/me`, guards (`@CurrentUser`, `JwtAuthGuard`, `RolesGuard`)
- Guest-режим (кратковременные access-токены без user record)

Реализация — фаза Auth (см. корневой TaskList).
