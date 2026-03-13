---
name: video-production-pipeline
description: YouTube URLから1本の動画を完成させるまでの全手順（ダウンロード→文字起こし→区間選定→props設定→レンダリング）
metadata:
  tags: pipeline, workflow, youtube, yt-dlp, whisper, captions, render
---

# 動画制作パイプライン

YouTube URLを受け取り、英語リスニングチャレンジ動画を1本完成させるまでの全手順。

## 全体フロー

```
YouTube URL
  ↓ Step 1: ダウンロード
動画ファイル (.mp4) + 音声ファイル (.mp3)
  ↓ Step 2: 文字起こし
キャプションJSON (Caption[])
  ↓ Step 3: チャレンジ区間の選定
hookStartSec / hookEndSec / answerStartSec / hookRevealWords
  ↓ Step 4: 日本語翻訳の生成
translations[]
  ↓ Step 5: props設定 + レンダリング
完成動画 (.mp4)
```

## Step 1: YouTube動画のダウンロード

`yt-dlp` で動画と音声を取得し `public/` に配置する。

```bash
# 動画（mp4, 1080p以下）
yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]" \
  --merge-output-format mp4 \
  -o "public/<slug>-video.mp4" \
  "<YOUTUBE_URL>"

# 音声のみ（mp3）
yt-dlp -x --audio-format mp3 \
  -o "public/<slug>.mp3" \
  "<YOUTUBE_URL>"
```

- `<slug>` は動画を識別する短い英語名（例: `hp-library`, `friends-cafe`）
- 既にダウンロード済みの場合はスキップ

## Step 2: 文字起こし（キャプション生成）

音声ファイルから単語単位のタイムスタンプ付きキャプションを生成する。

### 出力形式

`public/<slug>-captions.json` に以下の形式で保存:

```json
[
  { "text": "I ", "startMs": 500, "endMs": 700, "timestampMs": 500, "confidence": 1 },
  { "text": "had ", "startMs": 700, "endMs": 950, "timestampMs": 700, "confidence": 1 }
]
```

- `@remotion/captions` の `Caption` 型に準拠
- **単語単位**（文単位ではない）でタイムスタンプを付ける
- `text` には単語の後にスペースを含める（最後の単語・ピリオド前は除く）
- `timestampMs` は `startMs` と同じ値にする

### 文字起こし方法

以下のいずれかの方法で生成する（優先順）:

#### 方法A: OpenAI Whisper API（推奨）

```bash
curl -s https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F file="@public/<slug>.mp3" \
  -F model="whisper-1" \
  -F response_format="verbose_json" \
  -F timestamp_granularities[]="word" \
  -F language="en"
```

レスポンスの `words` 配列を Caption[] 形式に変換する:

```typescript
// OpenAI response.words → Caption[]
const captions = words.map(w => ({
  text: w.word + " ",
  startMs: Math.round(w.start * 1000),
  endMs: Math.round(w.end * 1000),
  timestampMs: Math.round(w.start * 1000),
  confidence: 1,
}));
```

#### 方法B: ローカル Whisper

```bash
# インストール（未導入の場合）
pip3 install openai-whisper

# 実行
whisper "public/<slug>.mp3" --language en --model medium --output_format json --word_timestamps True
```

出力JSONの `segments[].words[]` を Caption[] 形式に変換する。

#### 方法C: YouTube の自動字幕を取得

```bash
yt-dlp --write-auto-subs --sub-langs en --sub-format json3 --skip-download \
  -o "public/<slug>-subs" "<YOUTUBE_URL>"
```

json3形式の字幕を Caption[] に変換する。ただし単語単位のタイムスタンプ精度が低い場合がある。

### 文字起こしの検証

生成後、キャプションの品質を確認する:

- 単語の区切りが正しいか（結合や分離がないか）
- タイムスタンプが音声と合っているか
- 句読点が適切か

## Step 3: チャレンジ区間の選定

キャプションと音声を確認し、チャレンジに使う文を選ぶ。

### 選定基準（video-structure.md より）

ターゲット: **英検2級レベル**（知識はあるが聞き取れない層）

**選ぶべき文:**
- リンキング・リダクション・フラッピングが多い文
- スラング・口語表現
- 句動詞（phrasal verbs）
- 弱形・機能語の脱落（would've, gonna 等）
- ネイティブの自然なスピードの発話

**避けるべき文:**
- ゆっくり・はっきり発音されている文
- 専門用語・固有名詞が多い文
- 文脈がないと意味不明な文

### 決定するパラメータ

| パラメータ | 説明 | 決め方 |
|-----------|------|--------|
| `hookStartSec` | チャレンジ文の開始秒 | キャプションの `startMs / 1000` |
| `hookEndSec` | チャレンジ文の終了秒 | キャプションの `endMs / 1000` |
| `answerStartSec` | アンサー動画の開始秒 | チャレンジの10〜20秒前。動画が短ければ0 |
| `hookRevealWords` | 最初に見せる単語数 | 聞き取りやすい最初の数単語（通常2〜4） |
| `hookText` | チャレンジ文のテキスト | キャプションから結合 |

### hookRevealWords の決め方

チャレンジ文の先頭から、以下の基準で「ここまでは聞き取れるだろう」というラインを決める:

- 短い機能語（I, you, the, a）は聞き取りやすいのでrevealに含める
- リンキングやリダクションが始まる直前で区切る
- 通常は2〜4単語

例: `"I checked this out weeks ago for a bit of light reading."` → `hookRevealWords: 3`（"I checked this" までは聞き取れる）

## Step 4: 日本語翻訳の生成

アンサー動画で表示する日本語翻訳を、センテンス単位で用意する。

### 手順

1. `answerStartSec` 〜 `hookEndSec` の区間のキャプションを取得
2. センテンス（ピリオド・疑問符・感嘆符で区切り）ごとに分割
3. 各センテンスの自然な日本語翻訳を作成
4. `translations` 配列に順番に格納

### 翻訳のルール

- 直訳ではなく自然な日本語にする
- 口語的な表現はそのまま口語で訳す
- 最後のセンテンス（= チャレンジ文）の翻訳も含める（パート4で使用）

### 例

```
英語: "I had you looking in the wrong section."
翻訳: "間違った場所を探させてたわ。"

英語: "How silly of me?"
翻訳: "なんて馬鹿だったの？"

英語: "I checked this out weeks ago for a bit of light reading."
翻訳: "何週間も前にちょっとした軽い読み物として借りたのよ。"
```

## Step 5: props設定 + レンダリング

### Root.tsx の defaultProps を更新

```tsx
<Composition
  id="EnglishListeningChallenge"
  component={EnglishListeningChallenge}
  durationInFrames={300} // calculateMetadata で上書き
  fps={30}
  width={1080}
  height={1920}
  schema={englishListeningChallengeSchema}
  defaultProps={{
    audioFileName: "<slug>.mp3",
    videoFileName: "<slug>-video.mp4",
    captionsFileName: "<slug>-captions.json",
    hookStartSec: <選定した値>,
    hookEndSec: <選定した値>,
    hookText: "<チャレンジ文>",
    hookRevealWords: <選定した値>,
    answerStartSec: <選定した値>,
    bannerText: "リアル日常英語\n聞き取れる？",
    translations: [
      "<翻訳1>",
      "<翻訳2>",
      "<翻訳3（チャレンジ文の翻訳）>",
    ],
    backgroundColor: "#000000",
    highlightColor: "#FFD700",
  }}
  calculateMetadata={calculateMetadata}
/>
```

### プレビュー確認

```bash
npm run dev  # Remotion Studio が起動
```

確認ポイント:
- パート1: チャレンジ字幕のスクランブルタイミングが正しいか
- パート2: アンサー字幕と日本語翻訳が正しく表示されるか
- パート3: 単語並べ替えが発話タイミングに合っているか
- パート4: 通常速度リプレイで字幕が正しいか
- エンディング: 雫→展開→CTA画面が正しく表示されるか

### レンダリング

```bash
npx remotion render EnglishListeningChallenge out/<slug>.mp4
```

## チェックリスト

動画を完成させる際の最終チェック:

- [ ] 動画ファイルが `public/` にある
- [ ] キャプションJSONが `public/` にある（単語単位のタイムスタンプ付き）
- [ ] hookStartSec / hookEndSec がキャプションのタイムスタンプと一致している
- [ ] answerStartSec がチャレンジの10〜20秒前に設定されている
- [ ] hookRevealWords が適切（聞き取れるラインで区切っている）
- [ ] translations がセンテンス数と一致している
- [ ] Remotion Studio でプレビュー確認済み
- [ ] `npx tsc --noEmit` でエラーがない
