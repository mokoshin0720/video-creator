---
name: english-listening-challenge
description: 英語リスニングチャレンジ動画（YouTube Shorts形式）の構成スキル
metadata:
  tags: english, listening, challenge, shorts, subtitles, scrambled
---

## When to use

英語リスニングチャレンジ形式の動画を作成する時に使用する。
「リアル日常英語　聞き取れる？」のような上部バナー付きで、チャレンジ動画→アンサー動画の構成を持つYouTube Shorts動画を作成する。

## 動画構成の概要

この動画は以下の4パート構成で成り立つ（パート間はSEで繋ぎ、ポーズは入れない）:

1. **パート1: チャレンジ動画** — ソース動画の途中から聞き取りにくい部分を切り出して再生。最初のN単語は正しく表示（ハイライト付き）、残りを記号でスクランブル表示する
2. **パート2: アンサー動画** — チャレンジの10〜20秒前からチャレンジ終了フレームまで再生し、正しい字幕をセンテンス単位で表示する（日本語翻訳付き）。最後のセンテンス（= チャレンジ文）は下線スロットのみ表示
3. **パート3: 単語並べ替えチャレンジ** — チャレンジ動画を0.75倍速で3回リプレイし、発話タイミングに合わせて単語が順番に埋まっていくアニメーション
4. **パート4: 通常速度リプレイ** — チャレンジ部分を通常速度で再生し、英語字幕（ハイライト付き）+ 日本語翻訳を表示

画面上部には常に「リアル日常英語　聞き取れる？」のバナーを表示する。

## 詳細ルール

各パートの詳細な実装ルールは以下のファイルを参照:

- [rules/video-structure.md](rules/video-structure.md) - 動画全体の構成とタイムライン
- [rules/scrambled-subtitles.md](rules/scrambled-subtitles.md) - チャレンジ動画の字幕（聞き取れる単語 + スクランブル）
- [rules/top-banner.md](rules/top-banner.md) - 上部バナーのデザインと実装
- [rules/subtitle-display.md](rules/subtitle-display.md) - アンサー動画の字幕表示（センテンス単位・単語ハイライト・日本語翻訳）
- [rules/word-ordering-challenge.md](rules/word-ordering-challenge.md) - パート3の単語並べ替えチャレンジ（0.75倍速×3回リプレイ・下線スロット・単語バンク）
- [rules/props-schema.md](rules/props-schema.md) - コンポジションのプロパティスキーマ

## 技術的な前提

- フォーマット: YouTube Shorts（1080x1920、縦型）
- FPS: 30
- **フォント: Zen Kaku Gothic New**（`@remotion/google-fonts/ZenKakuGothicNew`）を全テキストに使用する。Noto Sans JP は使わない
- Remotionの `@remotion/captions` パッケージを使用
- 字幕は `Caption` 型の JSON データとして管理
- アニメーションは全て `useCurrentFrame()` で駆動（CSS animationは禁止）
- 動画は `<OffthreadVideo>` で表示（音声も含まれるため `<Audio>` は不要）
- 動画は画面中央に配置、字幕は動画の直下に配置
