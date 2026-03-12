---
name: props-schema
description: 英語リスニングチャレンジ動画のプロパティスキーマ定義
metadata:
  tags: props, schema, zod, parameters
---

# プロパティスキーマ

動画をパラメータ化するために Zod スキーマを定義する。

## スキーマ定義

```tsx
import { z } from "zod";

export const englishListeningChallengeSchema = z.object({
  // === 素材ファイル ===
  /** public/ 内の音声ファイル名 */
  audioFileName: z.string().default("audio.mp3"),
  /** public/ 内の動画ファイル名 */
  videoFileName: z.string().default("video.mp4"),

  // === キャプション ===
  /** public/ 内のキャプションJSONファイル名（Caption[]形式） */
  captionsFileName: z.string().default("captions.json"),

  // === チャレンジ動画パート ===
  /** チャレンジ動画で再生する音声の開始秒 */
  hookStartSec: z.number().default(0),
  /** チャレンジ動画で再生する音声の終了秒 */
  hookEndSec: z.number().default(3),
  /** チャレンジ動画の表示テキスト（スクランブル前の正しいテキスト） */
  hookText: z.string().default("What did you say?"),
  /** チャレンジ動画で最初にそのまま表示する単語数（残りがスクランブルになる） */
  hookRevealWords: z.number().default(3),

  // === アンサー動画パート ===
  /** アンサー動画の再生開始秒（チャレンジの10〜20秒前を目安に設定） */
  answerStartSec: z.number().default(0),

  // === 上部バナー ===
  /** 上部バナーのテキスト */
  bannerText: z.string().default("リアル日常英語　聞き取れる？"),

  // === 日本語翻訳 ===
  /** センテンス順の日本語翻訳（アンサー動画で英語字幕の下に表示） */
  translations: z.array(z.string()).default([]),

  // === スタイル ===
  /** 背景色 */
  backgroundColor: z.string().default("#000000"),
  /** ハイライト色 */
  highlightColor: z.string().default("#FFD700"),
});

export type EnglishListeningChallengeProps = z.infer<
  typeof englishListeningChallengeSchema
>;
```

## Root.tsx での登録

```tsx
import { Composition } from "remotion";
import { EnglishListeningChallenge, calculateMetadata } from "./EnglishListeningChallenge";
import { englishListeningChallengeSchema } from "./EnglishListeningChallenge/schema";

export const RemotionRoot = () => {
  return (
    <Composition
      id="EnglishListeningChallenge"
      component={EnglishListeningChallenge}
      durationInFrames={300} // calculateMetadata で上書き
      fps={30}
      width={1080}
      height={1920}
      schema={englishListeningChallengeSchema}
      defaultProps={{
        audioFileName: "audio.mp3",
        videoFileName: "video.mp4",
        captionsFileName: "captions.json",
        hookStartSec: 0,
        hookEndSec: 3,
        hookText: "What did you say?",
        hookRevealWords: 3,
        bannerText: "リアル日常英語　聞き取れる？",
        backgroundColor: "#000000",
        highlightColor: "#FFD700",
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
```

## calculateMetadata での動的長さ計算

チャレンジ動画とアンサー動画の間にポーズは入れない。チャレンジ動画終了後すぐにアンサー動画が始まる。

```tsx
import { CalculateMetadataFunction } from "remotion";
import type { Caption } from "@remotion/captions";

const calculateMetadata: CalculateMetadataFunction<
  EnglishListeningChallengeProps
> = async ({ props }) => {
  const response = await fetch(staticFile(props.captionsFileName));
  const captions: Caption[] = await response.json();

  const challengeDurationSec = props.hookEndSec - props.hookStartSec;
  const answerDurationSec = props.hookEndSec - props.answerStartSec;
  const totalDurationSec = challengeDurationSec + answerDurationSec;

  return {
    durationInFrames: Math.ceil(totalDurationSec * 30),
    props: {
      ...props,
      captions,
    },
  };
};
```

## 必要なファイル

動画を作成するために以下のファイルを `public/` に配置する:

1. **動画ファイル** (例: `video.mp4`) - 素材動画（音声込み）
2. **音声ファイル** (例: `audio.mp3`) - 英語の音声素材（バックアップ用）
3. **キャプションJSON** (例: `captions.json`) - `Caption[]` 形式の字幕データ
