# HTML Table 入門教學

## 一、基本結構

```html
<table>
  <thead>
    <!-- 表頭區域 -->
    <tr>
      <!-- 一列 -->
      <th>姓名</th>
      <!-- 標題欄位 -->
      <th>年齡</th>
    </tr>
  </thead>
  <tbody>
    <!-- 資料區域 -->
    <tr>
      <td>小明</td>
      <!-- 資料欄位 -->
      <td>25</td>
    </tr>
  </tbody>
  <tfoot>
    <!-- 頁尾區域（可選） -->
    <tr>
      <td>合計</td>
      <td>—</td>
    </tr>
  </tfoot>
</table>
```

### 元素說明

| 元素      | 說明                                 |
| --------- | ------------------------------------ |
| `<table>` | 表格容器，所有設定的根節點           |
| `<thead>` | 表頭，通常放欄位標題                 |
| `<tbody>` | 資料主體                             |
| `<tfoot>` | 頁尾，通常放合計、備註               |
| `<tr>`    | Table Row，一列                      |
| `<th>`    | Table Header，標題欄位，預設粗體置中 |
| `<td>`    | Table Data，資料欄位，預設靠左       |

---

## 二、欄寬控制

### display: table-cell 的特性

`<td>` 和 `<th>` 的 `display` 預設是 `table-cell`，這是 table 佈局專屬的顯示模式，有幾個重要特性：

- **不能使用 `flex` 或 `grid`**：在 `<td>` 上加 `display: flex` 會破壞 table-cell 的佈局行為，導致內容異常
- **有自己的對齊機制**：用 `text-align`（水平）和 `vertical-align`（垂直）來對齊，而不是 flexbox 的 `justify-content` / `align-items`

```css
/* ✅ 正確：用 table 原生的對齊方式 */
td {
  text-align: center;
  vertical-align: middle;
}

/* ❌ 錯誤：在 td 上加 flex 會破壞佈局 */
td {
  display: flex;
  justify-content: center;
}
```

如果真的需要 flex，要加在 `<td>` **內部的 wrapper** 上：

```html
<td>
  <div class="flex justify-center items-center">
    <!-- ✅ flex 加在內層 -->
    <img src="..." />
  </div>
</td>
```

---

## 三、table-layout

`table-layout` 是加在 `<table>` 上的 CSS 屬性，控制欄寬的計算方式。

### auto（預設）

```css
table {
  table-layout: auto;
}
```

- 瀏覽器讀完**所有內容**後，再決定每欄寬度
- 欄寬由內容撐開，你設的寬度只是「建議值」
- **固定像素（如 `width: 64px`）常常被忽略**
- 百分比（如 `width: 16.666%`）因為符合比例分配機制，通常有效
- 渲染較慢

### fixed

```css
table {
  table-layout: fixed;
  width: 100%; /* fixed 模式下 table 本身需要明確寬度 */
}
```

- 欄寬由**第一列的 `<th>`** 決定，之後的資料不影響寬度
- 你設的寬度（包含固定像素）會被**嚴格遵守**
- 渲染較快（不需要讀完所有資料）
- 內容超出時需要自己處理截斷

```css
/* fixed 模式下的欄寬設定 */
th:nth-child(1) {
  width: 4rem;
} /* 固定 64px，有效 */
th:nth-child(2) {
  width: 30%;
} /* 固定 30%，有效 */
th:nth-child(3) {
} /* 剩餘空間自動填滿 */
```

### 套用層級

```
<table>   ← table-layout 加這裡
  <thead>
    <tr>
      <th> ← width 加這裡（決定欄寬）
  <tbody>
    <tr>
      <td> ← 這裡的 width 在 fixed 模式下無效，以 th 為準
```

---

## 三之一、欄位寬度的分類機制（W3C 規範）

> 參考：[CSS Table Module Level 3 — Distribution Algorithm](https://www.w3.org/TR/css-tables-3/#distribution-algorithm)

W3C 規範明確定義，table 在計算欄寬時，會先將每個欄位分類成三種類型：

| 類型             | 條件               | 說明                                     |
| ---------------- | ------------------ | ---------------------------------------- |
| `percent-column` | 寬度用 `%` 指定    | 例如 `width: 16.6%`、Tailwind 的 `w-1/6` |
| `pixel-column`   | 寬度用固定長度指定 | 例如 `width: 3rem`、`width: 64px`        |
| `auto-column`    | 沒有指定寬度       | 由瀏覽器自動分配                         |

### 分配優先順序

規範的 Rule 1 規定：

```
percent-column > pixel-column > auto-column
```

**瀏覽器會先把百分比欄位的空間分配完，再處理固定長度欄位，最後才是 auto 欄位。**

### 為什麼混用 % 和 px 會出問題

當表格中同時存在 `percent-column` 和 `pixel-column` 時：

1. 瀏覽器先把所有 `percent-column` 的空間分配完
2. 剩下的空間才給 `pixel-column`
3. `pixel-column` 指定的 `3rem` 被完全忽略，改用剩餘空間

**範例**：6 個欄位，5 個 `w-1/6`（83.3%）+ 1 個 `width: 3rem`
→ 83.3% 先分配給百分比欄位，剩下 16.7% 給 `3rem` 欄位，`3rem` 完全無效。

### 正確做法：統一使用同一種類型

```css
/* ✅ 全部用百分比 */
th:nth-child(1) {
  width: 8%;
}
th:nth-child(2) {
  width: 23%;
}
/* ... 加總 = 100% */

/* ✅ 全部用固定長度（需搭配 table-layout: fixed） */
th:nth-child(1) {
  width: 3rem;
}
th:nth-child(2) {
  width: 10rem;
}

/* ✅ 固定 + auto（fixed 模式下，auto 欄位平均分配剩餘空間） */
th:nth-child(1) {
  width: 3rem;
} /* 固定 */
th:nth-child(2) {
} /* auto，分配剩餘空間 */
th:nth-child(3) {
} /* auto，分配剩餘空間 */

/* ❌ 混用 % 和 px，px 欄位會被忽略 */
th:nth-child(1) {
  width: 3rem;
} /* 無效，被百分比欄位擠掉 */
th:nth-child(2) {
  width: 20%;
}
```

### 指定固定寬度 + 其他欄位自動分配的方法

搭配 `table-layout: fixed`，固定欄位指定寬度，其他欄位**不設任何寬度**（auto-column），瀏覽器會把剩餘空間平均分配給 auto 欄位：

```html
<table style="table-layout: fixed; width: 100%">
  <colgroup>
    <col style="width: 3rem" />
    <!-- 固定 -->
    <col />
    <!-- auto，平均分配剩餘空間 -->
    <col />
    <!-- auto，平均分配剩餘空間 -->
    <col />
    <!-- auto，平均分配剩餘空間 -->
  </colgroup>
</table>
```

---

## 四、常用 CSS 屬性整理

### 加在 `<table>` 上

```css
table {
  table-layout: fixed; /* 欄寬計算模式 */
  width: 100%; /* 表格總寬 */
  border-collapse: collapse; /* 合併邊框（消除雙線） */
  border-spacing: 0; /* 欄位間距（border-collapse: separate 時有效） */
}
```

### 加在 `<th>` / `<td>` 上

```css
th,
td {
  text-align: center; /* 水平對齊 */
  vertical-align: middle; /* 垂直對齊 */
  padding: 0.5rem 1rem; /* 內距 */
  white-space: nowrap; /* 禁止換行 */
  overflow: hidden; /* 超出截斷（需搭配 table-layout: fixed） */
  text-overflow: ellipsis; /* 超出顯示 ... */
}
```

---

## 五、在 PrimeVue DataTable 中的對應

PrimeVue 的 `<DataTable>` 和 `<Column>` 是對 HTML table 的封裝，概念相同但有自己的 API。

### 欄寬

```html
<!-- 百分比（auto 模式下有效） -->
<Column class="w-1/6" />

<!-- 固定寬度（需搭配 tableStyle="table-layout: fixed"） -->
<DataTable tableStyle="table-layout: fixed; width: 100%">
  <Column style="width: 4rem" />
</DataTable>
```

### 置中對齊

```html
<!-- 單一欄位的標題置中 -->
<Column headerClass="text-center" bodyClass="text-center" />

<!-- 全部欄位統一設定（透過 pt） -->
<DataTable
  :pt="{
    column: {
      columnHeaderContent: { class: 'justify-center' }, <!-- 標題文字置中 -->
      bodyCell: { class: 'text-center' },               <!-- 資料置中 -->
    }
  }"
/>
```

> **注意**：標題置中要用 `columnHeaderContent`（內層 flex container），而不是 `headerCell`（外層 th），因為文字實際上在內層。

### pt vs dt

|            | `pt`（Pass Through）         | `dt`（Design Token）                  |
| ---------- | ---------------------------- | ------------------------------------- |
| 用途       | 控制 class、style、HTML 屬性 | 控制 CSS 變數（顏色、間距、字體大小） |
| 能否置中   | ✅ 可以                      | ❌ 不行                               |
| 能否改顏色 | ✅ 可以（但建議用 dt）       | ✅ 可以                               |

---

## 六、常見陷阱

| 陷阱                              | 原因                                   | 解法                                                    |
| --------------------------------- | -------------------------------------- | ------------------------------------------------------- |
| `w-4` 無效                        | `table-layout: auto` 忽略固定像素      | 改用百分比，或加 `table-layout: fixed`                  |
| `flex` 加在 `<td>` 上導致內容消失 | 覆蓋了 `display: table-cell`           | 把 flex 加在 `<td>` 內部的 wrapper div                  |
| `headerCell` 置中無效             | 文字在內層的 `columnHeaderContent`     | 改用 `columnHeaderContent: { class: 'justify-center' }` |
| `border` 顯示雙線                 | table 預設 `border-collapse: separate` | 加 `border-collapse: collapse`                          |
