---
title: GitHub Actions/Docker Compose/Rails キャッシュ時短
date: '2022-07-20T00:00:00'
---


## 前提

* GitHub Actions
* Docker Compose 使ってテスト
* Rails
* できるだけ時短したい

compose.ymlはDocker/Rails環境にSystem SpecのためARM対応Chromiumを追加したものを想定。

* [Ruby on Whales: Dockerizing Ruby and Rails development — Martian Chronicles, Evil Martians’ team blog](https://evilmartians.com/chronicles/ruby-on-whales-docker-for-ruby-rails-development)
* [seleniumhq\-community/docker\-seleniarm: Docker images for the Selenium Grid Server](https://github.com/seleniumhq-community/docker-seleniarm)

## Workflow YAML

```yaml
on: [push]

env:
  DOCKER_BUILDKIT: 1

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Cache dockerimages
        id: cache-dockerimages
        uses: actions/cache@v3
        with:
          path: /tmp/dockerimages
          key: dockerimages-${{ hashFiles('Dockerfile') }}-${{ hashFiles('compose.yml') }}
          restore-keys: dockerimages-
      - name: Load dockerimages
        if: steps.cache-dockerimages.outputs.cache-hit == 'true'
        run: ls -1 /tmp/dockerimages/*.tar | xargs -L 1 docker load -i
      - name: Build dockerimages
        if: steps.cache-dockerimages.outputs.cache-hit != 'true'
        run: docker compose build
      - name: Save dockerimages
        if: steps.cache-dockerimages.outputs.cache-hit != 'true'
        run: mkdir -p /tmp/dockerimages
          && docker image save -o /tmp/dockerimages/app.tar app
      - name: Cache gems
        uses: actions/cache@v3
        with:
          path: vendor/bundle
          key: gems-${{ hashFiles('Gemfile.lock') }}
          restore-keys: gems-
      - name: Install gems & Prepare DB & Run tests
        run: docker compose run --rm web sh -c "bundle config set --local path 'vendor/bundle' && bundle && bundle exec rails db:setup RAILS_ENV=test && bundle exec rspec"
```

## 時短ポイント

* DOCKER_BUILDKIT
* ビルドDockerイメージキャッシュ
  * DBやブラウザはpullするのと変わらなかったためキャッシュしていない
* gemキャッシュ
  * 権限エラー回避のため、CIではcompose.yml定義のvolume外を保存先とする
* コマンドまとめて実行

## その他

* Docker Compose経由だとローカルとCIでアーキテクチャ以外ほぼ同じ条件でテストできる
  * CI用の環境構築やメンテしなくてよい
* `docker compose run` で実行しているためアプリの `depends_on` にDBとブラウザが必要
  * 依存ないほうがきれいだが開発ではさほど問題ないはず
* CI上マシンはARMでないので事前に `bundle lock --add-platform x86_64-linux` が必要
* RubocopなどはJob or Workflowを分けて `ruby/setup-ruby` を利用して直接実行でいいと思う

## 参考

* [依存関係をキャッシュしてワークフローのスピードを上げる \- GitHub Docs](https://docs.github.com/ja/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
* [Dockerで構築したRailsアプリをGitHub Actionsで高速にCIする為のプラクティス（Rails 6 API編） \- Qiita](https://qiita.com/jpshadowapps/items/f32314ba827510cfe504)

