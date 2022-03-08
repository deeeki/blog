---
title: jsbundling-rails with Webpack
date: '2022-03-08T00:00:00'
---

Webpacker利用してるRailsアプリからの移行を検討して試したメモ。

[deeeki/rails\_jsbundling\_webpack](https://github.com/deeeki/rails_jsbundling_webpack)

## 環境
* Rails 7.0.2.2
* jsbundling-rails 1.0.2 with Webpack 5.69.1
* Sass Vue TypeScript
* `app/javascript` にCSSも画像も入れる場合

## 仕組み
* jsbundling-rails(Webpack)が `app/javascript` から `app/assets/builds` に出力
* sprockets-railsが `app/assets/builds` から動的出力(dev)または `public/assets` に出力(prod)
* Foreman経由でRailsサーバーとビルドウォッチャーを同時に動かす `bin/dev` が提供される

## 留意すること

2種類のビルドがあることでややこしくなっている。2022年3月時点でOpenなIssueもある。

### ビルドスクリプトは手動追記

インストール後に促されるので、package.jsonに追記。

```javascript
"scripts": { "build": "webpack --config webpack.config.js" }
```

### Webpackでダイジェスト付加は不要

画像ファイルは[Shakapackerのルール](https://github.com/shakacode/shakapacker/blob/master/package/rules/file.js)を参考に、`-[hash]` を無くす。
どのみちSprockets使うわけなので、最初から `app/assets/images` に置くのがよさそう。

```javascript
// webpack.config.js
module: {
  rules: [
    {
      test: /\.(bmp|gif|jpe?g|png|tiff|ico|avif|webp|eot|otf|ttf|woff|woff2|svg)$/,
      exclude: /\.(js|mjs|jsx|ts|tsx)$/,
      type: 'asset/resource',
      generator: {
        filename: (pathData) => {
          const folders = path.dirname(pathData.filename)
            .replace('app/javascript/', '')
            .split('/')
            .slice(1)

          const foldersWithStatic = path.join('static', ...folders)
          return `${foldersWithStatic}/[name][ext][query]`
        }
      }
    }
  ]
}
```

### CSSでの画像パス

Sprockets Railsが置換してくれる([PR](https://github.com/rails/sprockets-rails/pull/476))。v3.3.0以降なので既存アプリで古い場合はバージョン上げる。

### JSでの画像パス

本番でのダイジェスト付きパスを扱うには、Sprockets影響下で置換しないといけない。
`<img src="<%= asset_path('static/image.png') %>" />`のように書き、Webpackは `.js.erb` として出力。さらにSprocketsが適切なパスを出力。

```javascript
// webpack.config.js
output: {
  filename: "[name].js.erb"
},
```

[Can't load images in JavaScript files · Issue \#76 · rails/jsbundling\-rails](https://github.com/rails/jsbundling-rails/issues/76#issuecomment-1023853842)

全くきれいではないので、JSでは画像使わないのがよさそう(CSSで表示する)。

### .js.erbの処理

jsbundling-railsが追記した状態の `app/assets/config/manifest.js` ではうまくいかない。`.js` と明記する。

```patch
-//= link_tree ../builds
+//= link_tree ../builds .js
```

[Sprockets 4 has stopped working with js\.erb? · Issue \#667 · rails/sprockets](https://github.com/rails/sprockets/issues/667)

### 自動リロード

Foremanを活かし、webpack-dev-serverよりもguard-livereloadでViewファイルも対象にすると開発しやすい。

[Rails 7: guard\-livereload gemで開発中にライブリロードする｜TechRacho by BPS株式会社](https://techracho.bpsinc.jp/hachi8833/2022_02_04/115417)

## 既存アプリのWebpackerからの移行選択肢

* Webpackerのまま様子見
  * しばらくはこれでもいいかもしれない。Webpack5が使えない
* [Shakapacker](https://github.com/shakacode/shakapacker)
  * Webpackerの設定ファイルが使える。本家がリタイアしたことを考えるとどうか
* [Simpacker](https://github.com/hokaccha/simpacker)
  * 素のWebpackが使える。Webpackerと同名のヘルパーが用意されている
* [jsbundling-rails](https://github.com/rails/jsbundling-rails)
  * 他のビルドツールへの移行もできる。本家が提供。現状はJSで画像扱いづらい

## 新規アプリでは

`rails new` のデフォルトは[importmap-rails](https://github.com/rails/importmap-rails)なので、JSの役割が少なければこちらを検討できるとよさそう。
