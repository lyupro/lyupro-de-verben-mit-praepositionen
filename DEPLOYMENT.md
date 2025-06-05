# 🚀 Руководство по развертыванию Deutsch Trainer в продакшене

Это руководство поможет развернуть приложение Deutsch Trainer в продакшн среде с максимальным уровнем безопасности и производительности.

## 🎯 Статус проекта (Production Ready)

- ✅ **112 passing тестов (100% success rate)**
- ✅ **Полная webpack интеграция** - 16 оптимизированных JavaScript модулей
- ✅ **Безопасность**: JWT, bcrypt, Helmet, rate limiting
- ✅ **База данных**: 270 глаголов + переводы полностью загружены
- ✅ **Production конфигурация**: Winston логирование, GZIP compression
- ✅ **Исправлены все критические ошибки**: timeout, authentication, verb_id

## 📋 Предварительные требования

### Системные требования
- **Node.js**: версия 16.0.0 или выше (рекомендуется 18+)
- **npm**: версия 8.0.0 или выше  
- **MongoDB**: версия 4.4 или выше
- **Операционная система**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **Память**: минимум 2GB RAM (рекомендуется 4GB+)
- **Диск**: минимум 10GB свободного места

### Сетевые требования
- Порт 3000 (или настраиваемый через NODE_PORT)
- Порт 27017 для MongoDB (если локально)
- HTTPS сертификаты (рекомендуется)

## 🛠️ Подготовка к развертыванию

### 1. Установка зависимостей
```bash
# Установка Node.js (через NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверка версий
node --version  # должно быть >= 16.0.0
npm --version   # должно быть >= 8.0.0
```

### 2. Установка MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Запуск MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 3. Настройка пользователя приложения
```bash
# Создание пользователя для приложения
sudo useradd -r -s /bin/false deutschtrainer
sudo mkdir -p /opt/deutschtrainer
sudo chown deutschtrainer:deutschtrainer /opt/deutschtrainer
```

## 📦 Развертывание приложения

### 1. Загрузка кода
```bash
# Клонирование репозитория
cd /opt/deutschtrainer
sudo -u deutschtrainer git clone <repository-url> .

# Или загрузка архива
sudo -u deutschtrainer tar -xzf deutschtrainer.tar.gz
```

### 2. Установка зависимостей
```bash
cd /opt/deutschtrainer
sudo -u deutschtrainer npm ci --only=production
```

### 3. Конфигурация окружения
```bash
# Копирование продакшн конфигурации
sudo -u deutschtrainer cp .env.production .env

# КРИТИЧНО: Редактирование .env файла
sudo -u deutschtrainer nano .env
```

**Обязательные изменения в .env:**
```env
# ИЗМЕНИТЬ: Сгенерировать криптографически стойкий секрет
JWT_SECRET=СГЕНЕРИРОВАННЫЙ_КРИПТОГРАФИЧЕСКИ_СТОЙКИЙ_СЕКРЕТ_МИНИМУМ_64_СИМВОЛА

# ИЗМЕНИТЬ: Настроить продакшн БД
MONGO_URI=mongodb://localhost:27017/deutschtrainer_production

# ИЗМЕНИТЬ: Настроить под ваш домен/IP
NODE_PORT=3000

# ИЗМЕНИТЬ: Сессионный секрет
SESSION_SECRET=ДРУГОЙ_КРИПТОГРАФИЧЕСКИ_СТОЙКИЙ_СЕКРЕТ

# Production настройки
NODE_ENV=production
ENABLE_LETTER_FILTER=true
LOG_LEVEL=info
```

### 4. 🔧 Сборка приложения (Webpack)
```bash
# Production сборка всех JavaScript модулей
sudo -u deutschtrainer npm run webpack:build

# Проверка результатов сборки
ls -la public/javascripts/dist/
```

**Результат сборки (16 оптимизированных модулей):**
- **Основные**: alphabet.bundle.js, search.bundle.js, pagination.bundle.js
- **UI**: themeSwitch.bundle.js, checkSentence.bundle.js, verbCard.bundle.js
- **Утилиты**: namedRoutes.bundle.js
- **Verb-функции**: verbLearning.bundle.js, addTranslationField.bundle.js
- **User-функции**: verbInteractions.bundle.js, userFavorites.bundle.js, userLists.bundle.js, userListDetail.bundle.js
- **Auth-функции**: authHeader.bundle.js, authLogin.bundle.js, authRegister.bundle.js

### 5. Заполнение базы данных
```bash
# Полный импорт данных (270 глаголов + переводы)
sudo -u deutschtrainer npm run import:full

# Проверка статистики БД
sudo -u deutschtrainer npm run db:stats
```

**Ожидаемый результат импорта:**
- 270 немецких глаголов
- 270 переводов на русский язык
- 780 записей времен (present, past_simple, past_perfect)
- 110 примеров предложений с переводами

### 6. Проверка готовности
```bash
# Проверка конфигурации
sudo -u deutschtrainer npm run health-check:prod

# Запуск всех тестов (должно быть 112 passing)
sudo -u deutschtrainer npm test

# Проверка webpack сборки
sudo -u deutschtrainer npm run webpack:build
```

## 🔒 Настройка безопасности

### 1. Настройка файрвола
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 3000/tcp # Node.js app (временно)
sudo ufw enable
```

### 2. Настройка SSL/TLS
```bash
# Установка Certbot для Let's Encrypt
sudo apt-get install certbot

# Получение сертификата
sudo certbot certonly --standalone -d your-domain.com
```

### 3. Настройка Nginx (рекомендуется)
```bash
# Установка Nginx
sudo apt-get install nginx

# Создание конфигурации
sudo nano /etc/nginx/sites-available/deutschtrainer
```

**Конфигурация Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/deutschtrainer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🚀 Запуск в продакшене

### 1. Создание systemd сервиса
```bash
sudo nano /etc/systemd/system/deutschtrainer.service
```

**Конфигурация сервиса:**
```ini
[Unit]
Description=Deutsch Trainer Application
After=network.target mongod.service
Requires=mongod.service

[Service]
Type=simple
User=deutschtrainer
Group=deutschtrainer
WorkingDirectory=/opt/deutschtrainer
ExecStart=/usr/bin/node server.js
Environment=NODE_ENV=production
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

# Security
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/deutschtrainer/logs

[Install]
WantedBy=multi-user.target
```

### 2. Запуск сервиса
```bash
# Перезагрузка systemd
sudo systemctl daemon-reload

# Запуск и включение автозапуска
sudo systemctl start deutschtrainer
sudo systemctl enable deutschtrainer

# Проверка статуса
sudo systemctl status deutschtrainer
```

## 📊 Мониторинг и логирование

### 1. Просмотр логов
```bash
# Логи приложения
sudo journalctl -u deutschtrainer -f

# Логи в файлах
sudo tail -f /opt/deutschtrainer/logs/app.log
sudo tail -f /opt/deutschtrainer/logs/error.log
sudo tail -f /opt/deutschtrainer/logs/security.log
```

### 2. Настройка ротации логов
```bash
sudo nano /etc/logrotate.d/deutschtrainer
```

```
/opt/deutschtrainer/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    su deutschtrainer deutschtrainer
}
```

### 3. Мониторинг производительности
```bash
# Использование ресурсов
sudo systemctl status deutschtrainer
htop

# Состояние MongoDB
mongo --eval "db.serverStatus()"

# Проверка портов
sudo netstat -tlnp | grep :3000
```

## 🔄 Обновление приложения

### 1. Резервное копирование
```bash
# Остановка сервиса
sudo systemctl stop deutschtrainer

# Бэкап базы данных
mongodump --db deutschtrainer_production --out /backup/$(date +%Y%m%d_%H%M%S)

# Бэкап приложения
sudo tar -czf /backup/app_$(date +%Y%m%d_%H%M%S).tar.gz /opt/deutschtrainer
```

### 2. Обновление кода
```bash
cd /opt/deutschtrainer
sudo -u deutschtrainer git pull
sudo -u deutschtrainer npm ci --only=production
sudo -u deutschtrainer npm run webpack:build
sudo -u deutschtrainer npm run health-check:prod
```
### 3. Перезапуск
```bash
sudo systemctl start deutschtrainer
sudo systemctl status deutschtrainer
```

## ⚡ Оптимизация производительности

### 1. PM2 (альтернатива systemd)
```bash
# Установка PM2
sudo npm install -g pm2

# Создание ecosystem файла
sudo -u deutschtrainer nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'deutschtrainer',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

```bash
# Запуск через PM2
sudo -u deutschtrainer pm2 start ecosystem.config.js
sudo -u deutschtrainer pm2 save
sudo pm2 startup
```

### 2. Настройка MongoDB для продакшена
```bash
sudo nano /etc/mongod.conf
```

```yaml
# Оптимизация MongoDB
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 1  # Настроить под доступную память

# Безопасность
security:
  authorization: enabled

# Репликация (для высокой доступности)
replication:
  replSetName: rs0
```

## 🛡️ Контрольный список безопасности

- [ ] JWT_SECRET изменен на криптографически стойкий
- [ ] SESSION_SECRET изменен на уникальный
- [ ] MongoDB защищен паролем
- [ ] Файрвол настроен правильно
- [ ] HTTPS сертификаты установлены
- [ ] Nginx security headers настроены
- [ ] Пользователь приложения не имеет root привилегий
- [ ] Логи настроены и ротируются
- [ ] Резервное копирование настроено
- [ ] Мониторинг работает

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `sudo journalctl -u deutschtrainer -f`
2. Проверьте конфигурацию: `npm run health-check:prod`
3. Проверьте статус сервисов: `sudo systemctl status deutschtrainer mongod nginx`

**Автор**: Maksym Lyubachevsky (m.lyubachevsky@gmail.com) 
