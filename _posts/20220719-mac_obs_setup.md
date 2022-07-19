---
title: 2000円キャプボとMacで配信 OBSメモ
date: '2022-07-19T00:00:00'
ogImage:
  url: '/assets/blog/20220719/obs.png'
---

![](/assets/blog/20220719/obs.png)

## キャプチャーボード

お試しのつもりでMacbookで配信ができればよかったので、USB-Cで安いものを選択。

[Amazon\.co\.jp\|2022放熱動画キャプチャーボード、 HDMIからUSB3\.0 USB C ビデオキャプチャー、4K 1080P60キャプチャデバイス、ゲームライブストリーミング動画レコーダー用、PS4/5、Xbox、Steam用のWindows Mac OSシステムとの互換性があります、キャプチャーボード switch対応 電源不要 \(silver\)\|パソコン・周辺機器通販](https://www.amazon.co.jp/gp/product/B0B2JZCTW2/)

## OBSでやったこと

ググりつつなるべく高品質になるようにしたつもり。`Sources` の内容はキャプチャーボードに依存すると思われる。

### Settings

* General
  * Output
    * `Show confirmation dialogue when starting streams` ✔️
  * Source Alignment Snapping
    * `Snap Sources to horizontal and vertical centre` ✔️
* Stream
  * 配信したいサイトを選んでアカウント連携
    * YouTubeは申請から24時間待つ必要あり
    * Twitchはすぐに配信可能
* Output
  * Output Mode
    * `Advanced`
  * Streaming
    * Encoder
      * `Apple VT H264 Hardware Encoder`
    * Bitrate
      * `9000 Kbps`
  * Recording
    * Recording Format
      * `mp4`
  * Audio
    * Audio Bitrate
      * `320`
* Video
  * Base (Canvas) Resolution
    * `1920x1080`
  * Output (Scaled) Resolution
    * `1920x1080`
  * `Common FPS Values`
    * `60`
* Hotkeys
  * Mic/Aux
    * Mute/Unmute
      * `/`

### Sources

* Video Capture Device
  * Device
    * `USB Video`
* Audio Input Capture
  * Device
    * `USB Digital Audio`

### Audio Mixer

* Advanced Audio Properties
  * 上記の音声ソース
    * `Monitor and Output` (PCで音声聞くための設定)

## 所感

配信を見てもらった上で楽しむにはそれなりの発信力が必要だが、手軽に録画を残すことができるようにもなった。
ゲーム遊ぶ際の選択肢が2000円で増えたのは良かったかなと。
