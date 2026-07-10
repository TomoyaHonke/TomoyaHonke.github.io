// サイトのコンテンツツリー。children があるエントリはサブリストへ分岐し、
// ないエントリはクリックで詳細パネルを開く。
// エントリの id は main.ts のゾーン定義(背景シーン)と対応する。

export interface EntryData {
  id: string;
  /** リストに大きく出す英字タイトル */
  title: string;
  /** ジャンル・状態などの添え書き */
  subtitle: string;
  description: string;
  tags: string[];
  /** プレイ/ストアのリンク。未定なら null */
  url: string | null;
  /** ホバー時に強調する色(現状は装飾用) */
  color: number;
  /** パネル下部のボタン群。指定がなければ id に応じた既定(PLAY 等) */
  links?: { label: string; url: string | null }[];
  /** パネルに表示するスクリーンショット(public/ からのパス) */
  images?: string[];
  children?: EntryData[];
}

export const tree: EntryData[] = [
  {
    id: "about",
    title: "ABOUT",
    subtitle: "本家智也について",
    description:
      "名古屋大学大学院 理学研究科に在籍。観測的宇宙論(宇宙の大規模構造)を研究しています。\n\n個人でのゲーム開発も続けていて、デッキ構築ローグライク『FateBound』を公開、近未来RPG『ZoneDiver』を開発中。ドット絵と、AI 画像生成を使ったアート制作が好き。\n\n連絡は下の EMAIL からどうぞ。",
    tags: ["Cosmology", "Unity", "C#", "Python", "Pixel Art", "AI Art"],
    url: null,
    color: 0xffc46a,
  },
  {
    id: "research",
    title: "RESEARCH",
    subtitle: "2 items",
    description: "",
    tags: [],
    url: null,
    color: 0x9ad8ff,
    children: [
      {
        id: "thesis",
        title: "PFS MOCK CATALOG",
        subtitle: "卒業論文 — 観測的宇宙論",
        description:
          "『PFS Flagship Mock カタログの作成に向けた研究』\n名古屋大学 理学部 物理学科 卒業論文(2026年3月)。\n\nUchuu シミュレーションに基づく PFS 用 mock カタログと DESI 観測データを比較し、銀河数密度と色分布の再現性を検証。さらに HOD モデルによる mock カタログ構築に向けて、相関関数で銀河クラスタリングの再現性を評価する解析パイプラインを構築した。",
        tags: ["Cosmology", "PFS", "DESI", "Python"],
        url: null,
        color: 0xcfe8ff,
        links: [
          { label: "PDF", url: "/honke.pdf" },
          { label: "GitHub", url: "https://github.com/TomoyaHonke/ELG_targetselection" },
        ],
        images: ["/works/thesis/page16-colormap.jpg"],
      },
      {
        id: "mockviewer",
        title: "COSMIC WEB VIEWER",
        subtitle: "宇宙の大規模構造ビューア — In development",
        description:
          "Uchuu N体シミュレーション(一辺 2000 Mpc/h)に基づく ELG 銀河モックカタログ(各時代 約900万銀河)をブラウザで探索できる可視化ツール。\n\n「宇宙の大規模構造」「天球(夜空ドーム)」「宇宙の断面(コズミック・ウェブ)」の3モードを、赤方偏移 z = 0.63〜2.31 のスライダーで切り替えながら眺められる。開発中。",
        tags: ["Cosmology", "Streamlit", "Python", "In dev"],
        url: null,
        color: 0x4fe8c8,
        links: [
          { label: "OPEN VIEWER", url: "https://fumofumosan-cosmicwebviewer.hf.space/" },
        ],
        images: [
          "/works/cosmicweb/01-structure.jpg",
          "/works/cosmicweb/02-cosmicweb.jpg",
          "/works/cosmicweb/03-skydome.jpg",
        ],
      },
    ],
  },
  {
    id: "game",
    title: "GAME",
    subtitle: "2 works",
    description: "",
    tags: [],
    url: null,
    color: 0x6ae8ff,
    children: [
      {
        id: "fatebound",
        title: "FATEBOUND",
        subtitle: "Roguelike Deckbuilder — Godot 4",
        description:
          "ダークファンタジー・ローグライクデッキ構築カードゲーム。仲間に裏切られた主人公が、復讐のために聖都へ戻る本編(全3幕)と、裏切りの夜に至る過去編を収録。\n\nマップのルート選択 → カード戦闘 → デッキ強化のループを、1ラン30〜60分の密度に凝縮。シルエット調のビジュアルで、カード65種・敵49体・レリック38種・イベント22種を実装。",
        tags: ["Godot 4", "GDScript", "Roguelike", "Deckbuilder"],
        url: null,
        color: 0xff4fd8,
        images: [
          "/works/fatebound/01-title.jpg",
          "/works/fatebound/02-battle.jpg",
          "/works/fatebound/03-map.jpg",
        ],
      },
      {
        id: "zonediver",
        title: "ZONEDIVER",
        subtitle: "Cyberpunk Dungeon RPG — In development",
        description:
          "近未来ダンジョンダイブ型RPG。Unity 6 で制作中。\n※スクリーンショットや詳細は今後追加予定。",
        tags: ["Unity 6", "C#", "In dev"],
        url: null,
        color: 0x7eff9a,
      },
    ],
  },
];

export const links: { label: string; url: string | null }[] = [
  { label: "EMAIL", url: "mailto:honya8217@gmail.com" },
  { label: "GitHub", url: "https://github.com/TomoyaHonke" },
  // ※実際のURLに差し替え予定
  { label: "X(準備中)", url: null },
  { label: "itch.io(準備中)", url: null },
];
