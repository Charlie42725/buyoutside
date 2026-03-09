# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案說明

**代購計算機 Web App** — 協助代購者核算商品真實成本的手機優先工具。

核心功能：記錄進貨商品、記錄其他花費（交通/住宿等），並依商品權重平攤額外成本，算出每件商品最終單件成本。

## 常用指令

```bash
npm run dev      # 開發伺服器 (http://localhost:5173)
npm run build    # 型別檢查 + 打包
npm run lint     # ESLint 檢查
npm run preview  # 預覽打包結果
```

## 技術架構

- **框架**：React 19 + TypeScript + Vite
- **樣式**：純 CSS（`src/index.css` 全域，`src/App.css` 元件）
- **資料儲存**：localStorage（不需登入，第一版不做雲端同步）
- **路由**：無路由套件，用 React state 控制三個頁籤切換

## 核心資料結構

```ts
// 進貨商品
interface Product {
  id: string
  name: string
  currency: string   // 'TWD' | 'KRW' | 'USD'
  price: number      // 單價（外幣）
  quantity: number
  exchangeRate: number  // 對台幣匯率，台幣固定為 1
  weight: number     // 權重（用於分攤其他花費）
}

// 其他花費
interface Expense {
  id: string
  category: string   // 排隊薪水/機票/住宿/計程車/運費/網卡/機場接送/地鐵/其他
  amount: number     // 金額（外幣）
  currency: string
  exchangeRate: number
  note: string
}
```

## 計算邏輯

```
商品原始總成本 = 單價 × 數量 × 匯率
其他花費總額  = 所有 Expense 換算台幣後加總
某商品分攤額  = 其他花費總額 × (該商品權重 / 所有商品權重總和)
最終單件成本  = (商品原始總成本 + 分攤額) / 數量
```

## 頁面架構

```
App
├── BuyPage    （買貨）— 新增/編輯/刪除進貨商品
├── ExpensePage（記帳）— 新增/編輯/刪除其他花費
└── ReportPage （報表）— 整合計算，顯示最終單件成本
```

底部固定導航列切換三個頁面，手機優先設計。

## UI 原則

- 手機優先（375px 基準寬度）
- 卡片式資訊呈現
- 報表頁第一眼看到總成本與單件成本
- 繁體中文介面
