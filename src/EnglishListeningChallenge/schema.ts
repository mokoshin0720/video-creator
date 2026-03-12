import { z } from "zod";

export const englishListeningChallengeSchema = z.object({
  audioFileName: z.string().default("hp-library.mp3"),
  videoFileName: z.string().default("hp-library-video.mp4"),
  captionsFileName: z.string().default("hp-library-captions.json"),
  /** チャレンジ動画で再生する区間の開始秒 */
  hookStartSec: z.number().default(6.3),
  /** チャレンジ動画で再生する区間の終了秒 */
  hookEndSec: z.number().default(9.1),
  hookText: z.string().default("I checked this out weeks ago for a bit of light reading."),
  /** チャレンジ動画で最初にそのまま表示する単語数（残りがスクランブルになる） */
  hookRevealWords: z.number().default(3),
  /** アンサー動画の再生開始秒（チャレンジの10〜20秒前を目安に設定） */
  answerStartSec: z.number().default(0),
  bannerText: z.string().default("リアル日常英語　聞き取れる？"),
  /** センテンス順の日本語翻訳（アンサー動画で英語字幕の下に表示） */
  translations: z.array(z.string()).default([]),
  backgroundColor: z.string().default("#000000"),
  highlightColor: z.string().default("#FFD700"),
});

export type EnglishListeningChallengeProps = z.infer<
  typeof englishListeningChallengeSchema
>;
