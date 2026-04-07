# 맛집 (Matjip) - 맛집 저장 및 추천 앱

나만의 맛집 리스트를 저장하고, 카테고리별로 관리하며, 근처 맛집을 추천받을 수 있는 앱입니다.

## Tech Stack

- **Mobile**: React Native (Expo)
- **API**: NestJS
- **Database**: PostgreSQL
- **Shared**: TypeScript monorepo (npm workspaces)

## Setup

```bash
# Install dependencies
npm install

# Start database
docker-compose up -d

# Build shared package
npm run shared:build

# Start API server (dev)
npm run api:dev

# Start mobile app
npm run mobile:start
```

## Project Structure

```
matjip/
├── apps/
│   ├── api/          # NestJS backend
│   └── mobile/       # React Native (Expo) app
├── packages/
│   └── shared/       # Shared types and utilities
├── package.json      # Root workspace config
└── tsconfig.base.json
```
