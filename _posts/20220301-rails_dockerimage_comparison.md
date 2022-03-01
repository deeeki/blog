---
title: Rails開発 Dockerイメージ比較
date: '2022-03-01T00:00:00'
ogImage:
  url: '/assets/blog/20220301/dockerimages.png'
---

よりシンプルで軽くメンテしやすいDockerイメージを求めて。

## 比較

|Distribution|Build Stage|Build Time|Image Size|
|--|--|--|--|
|Debian|single|121.7s|585.87MB|
|Debian|multi|104.5s|526.11MB|
|Alpine|single|28.3s|652.87MB|
|Alpine|multi|30.5s|694.64MB|

single or multi はNode.jsバイナリをコピーするかどうか。

## 所感

* おすすめっぽいのはサイズの軽いDebian (multi stage)
  * Aplineより軽かったのが意外
* Alpineはビルド時間が短く、Dockerfile記述がシンプル

## 環境

* M1 Mac
* Docker Desktop for Mac 4.5.0
* Rails 7.0.x / PostgreSQL 14.x
  * `rails new (bundle) (yarn)` `rails s` `rails db` ができるくらいまで

## Dockerfile

### Debian (single stage)

```dockerfile
ARG DEBIAN_VERSION=bullseye
ARG RUBY_VERSION=3.1.1

FROM ruby:$RUBY_VERSION-slim-$DEBIAN_VERSION as base

ARG DEBIAN_VERSION=bullseye
ARG PG_MAJOR=14
ARG NODE_MAJOR=16
ARG BUNDLER_VERSION=2.3.8

RUN apt-get update -qq \
  && DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
    curl \
    g++ \
    gcc \
    git \
    gnupg2 \
    make \
  && apt-get clean \
  && rm -rf /var/cache/apt/archives/* \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
  && truncate -s 0 /var/log/*log

RUN curl -sL https://deb.nodesource.com/setup_$NODE_MAJOR.x | bash -
RUN curl -sSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
  && echo "deb http://apt.postgresql.org/pub/repos/apt/ ${DEBIAN_VERSION}-pgdg main" $PG_MAJOR > /etc/apt/sources.list.d/pgdg.list

RUN apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get -yq dist-upgrade \
  && DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
    libpq-dev \
    nodejs \
    postgresql-client-$PG_MAJOR \
  && apt-get clean \
  && rm -rf /var/cache/apt/archives/* \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
  && truncate -s 0 /var/log/*log
RUN npm install --global yarn

ENV LANG=C.UTF-8 \
  BUNDLE_JOBS=4 \
  BUNDLE_RETRY=3

RUN gem update --system && gem install bundler -v $BUNDLER_VERSION

WORKDIR /app
```

### Debian (multi stage)

```dockerfile
ARG DEBIAN_VERSION=bullseye
ARG RUBY_VERSION=3.1.1
ARG NODE_VERSION=16.14.0

FROM node:$NODE_VERSION-$DEBIAN_VERSION-slim as node

FROM ruby:$RUBY_VERSION-slim-$DEBIAN_VERSION as base

ARG DEBIAN_VERSION=bullseye
ARG PG_MAJOR=14
ARG BUNDLER_VERSION=2.3.8

RUN apt-get update -qq \
  && DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
    curl \
    g++ \
    gcc \
    git \
    gnupg2 \
    make \
  && apt-get clean \
  && rm -rf /var/cache/apt/archives/* \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
  && truncate -s 0 /var/log/*log

RUN curl -sSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add - \
  && echo "deb http://apt.postgresql.org/pub/repos/apt/ ${DEBIAN_VERSION}-pgdg main" $PG_MAJOR > /etc/apt/sources.list.d/pgdg.list

RUN apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get -yq dist-upgrade \
  && DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
    libpq-dev \
    postgresql-client-$PG_MAJOR \
  && apt-get clean \
  && rm -rf /var/cache/apt/archives/* \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
  && truncate -s 0 /var/log/*log

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /opt/yarn-* /opt/yarn
RUN ln -fs /opt/yarn/bin/yarn /usr/local/bin/yarn

ENV LANG=C.UTF-8 \
  BUNDLE_JOBS=4 \
  BUNDLE_RETRY=3

RUN gem update --system && gem install bundler -v $BUNDLER_VERSION

WORKDIR /app
```

### Alpine (single stage)

```dockerfile
ARG ALPINE_VERSION=3.15
ARG RUBY_VERSION=3.1.1

FROM ruby:$RUBY_VERSION-alpine$ALPINE_VERSION as base

ARG PG_MAJOR=14
ARG BUNDLER_VERSION=2.3.8

# https://github.com/sparklemotion/nokogiri/issues/2430#issuecomment-1016650754
RUN apk add --no-cache \
  bash \
  g++ \
  gcc \
  gcompat \
  git  \
  make \
  musl-dev \
  nodejs \
  postgresql$PG_MAJOR-client \
  postgresql$PG_MAJOR-dev \
  tzdata \
  yarn \
  && rm -rf /var/cache/apk/*

ENV LANG=C.UTF-8 \
  BUNDLE_JOBS=4 \
  BUNDLE_RETRY=3

RUN gem update --system && gem install bundler -v $BUNDLER_VERSION

WORKDIR /app
```

### Alpine (multi stage)

```dockerfile
ARG ALPINE_VERSION=3.15
ARG RUBY_VERSION=3.1.1
ARG NODE_VERSION=16.14.0

FROM node:$NODE_VERSION-alpine$ALPINE_VERSION as node

FROM ruby:$RUBY_VERSION-alpine$ALPINE_VERSION as base

ARG PG_MAJOR=14
ARG BUNDLER_VERSION=2.3.8

# https://github.com/sparklemotion/nokogiri/issues/2430#issuecomment-1016650754
RUN apk add --no-cache \
  bash \
  g++ \
  gcc \
  gcompat \
  git  \
  make \
  musl-dev \
  postgresql$PG_MAJOR-client \
  postgresql$PG_MAJOR-dev \
  tzdata \
  && rm -rf /var/cache/apk/*

COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /opt/yarn-* /opt/yarn
RUN ln -fs /opt/yarn/bin/yarn /usr/local/bin/yarn

ENV LANG=C.UTF-8 \
  BUNDLE_JOBS=4 \
  BUNDLE_RETRY=3

RUN gem update --system && gem install bundler -v $BUNDLER_VERSION

WORKDIR /app
```

![](/assets/blog/20220301/dockerimages.png)
