// debugLog 使用方式：
//   debugLog('xx狀態')                        → 🟢 綠色狀態標籤（流程正常經過）
//   debugLog(() => 變數)                       → 🔵 藍色變數檢視（不印狀態那行）
//   debugLog(() => [變數1, 變數2])             → 🔵 藍色多變數檢視
//   debugLog('xx狀態', () => 變數)             → 🔴 紅色狀態標籤 + 變數（查問題用）
//   任何形式都可以加 option 作為最後一個參數：
//   debugLog('xx狀態', { focusCondition: x === 1 })
//   debugLog('xx狀態', () => 變數, { mainLabel: '登入流程' })

// 注意：特殊情況不靜態報錯
// debugLog('ooo', () => xxx)  // xxx 若是解構賦值結果，執行時才會報錯，要注意
// const { xxx } = fn()

type Getter = () => any

interface Option {
  focusCondition?: boolean
  // 有填時，在該次輸出前先印一行 mainLabel 標題，方便區分偵錯區塊
  mainLabel?: string
}

// ─── 樣式定義 ────────────────────────────────────────────────────────────────
const style = {
  mainLabel: 'background: #0077b6; color: white; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
  stateLabel: 'background: #caf0f8; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
  none: 'font-weight: normal; color: gray;',
  bold: 'font-weight: bold;',
  green: 'background: #c7f9cc; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
  red: 'background: #ffb3c6; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
}

// ─── 函式多載簽名 ─────────────────────────────────────────────────────────────
// 形式一：只有狀態標籤（綠色）
export function debugLog (stateLabel: string, option?: Option): void
// 形式二：狀態標籤 + 單一變數檢視（紅色）
// 注意：getter 回傳值不可為陣列，多變數請用形式三
export function debugLog (stateLabel: string, getter: Getter, option?: Option): void
// 形式三：只有變數檢視（藍色，不印狀態那行）
// getter 回傳陣列時，會拆成多筆分別輸出
export function debugLog (getter: Getter, option?: Option): void

export function debugLog (
  arg1: string | Getter,
  arg2?: Getter | Option,
  arg3?: Option,
): void {
  // ── 解析參數 ──────────────────────────────────────────────────────────────
  let stateLabel: string | undefined
  let getter: Getter | undefined
  let option: Option | undefined

  if (typeof arg1 === 'string') {
    stateLabel = arg1
    if (typeof arg2 === 'function') {
      // 形式二：debugLog('xx狀態', () => 變數, option?)
      getter = arg2
      option = arg3
    }
    else {
      // 形式一：debugLog('xx狀態', option?)
      option = arg2 as Option | undefined
    }
  }
  else {
    // 形式三：debugLog(() => 變數, option?)
    getter = arg1
    option = arg2 as Option | undefined
  }

  // ── focusCondition 篩選 ───────────────────────────────────────────────────
  const focusCondition = option?.focusCondition ?? true
  if (!focusCondition) { return }

  // ── mainLabel 標題行（有填才印） ──────────────────────────────────────────
  if (option?.mainLabel) {
    console.log(
      `🫥 %c------ debug: ${option.mainLabel} ------`,
      style.mainLabel,
    )
  }

  // ── 顏色決定 ──────────────────────────────────────────────────────────────
  // 形式一（只有 stateLabel）→ 綠色：代表流程正常經過
  // 形式二（stateLabel + getter）→ 紅色：代表要查問題
  // 形式三（只有 getter）→ 藍色（stateLabel 預設色）
  const colorizedFlow = stateLabel && getter
    ? style.red // 形式二
    : stateLabel
      ? style.green // 形式一
      : style.stateLabel // 形式三（getter 的 source 用藍色）

  // ── 輸出 ──────────────────────────────────────────────────────────────────
  if (stateLabel && !getter) {
    // 形式一：只印狀態標籤
    console.log(
      `🫥 %c${stateLabel}`,
      colorizedFlow,
    )
    return
  }

  if (getter) {
    // 形式二 / 形式三：印變數
    const [source, result] = showDebugKeyData(getter)

    // 形式三（只有 getter）且回傳陣列：拆成多筆分別輸出
    // 判斷 source 是否為 [var1, var2] 格式（使用者輸入的是變數陣列，非陣列變數）
    if (!stateLabel && Array.isArray(result)) {
      const isVarArray = /^\[.+\]$/.test(source.trim())
      if (isVarArray) {
        // 從 source 字串拆出各變數名稱：[obj1, obj2] → ['obj1', 'obj2']
        const varNames = source.trim().slice(1, -1).split(',').map(s => s.trim())
        result.forEach((item: any, index: number) => {
          const itemSource = varNames[index] ?? `${index}`
          if (typeof item !== 'object') {
            const displayItem = typeof item === 'string' && item.length > 60 ? `\n${item}` : item
            console.log(`🫥  %c${itemSource}%c → ${displayItem}`, style.stateLabel, '')
            return
          }
          handleVariousObj('', itemSource, item, style.stateLabel)
        })
        return
      }
    }

    if (typeof result !== 'object') {
      // 純值（string、number、boolean）直接印
      const displayResult = typeof result === 'string' && result.length > 60
        ? `\n${result}`
        : result

      if (stateLabel) {
        // 形式二：帶狀態標籤
        console.log(
          `🫥 %c${stateLabel}:%c %c${source} → ${displayResult}`,
          colorizedFlow,
          '',
          style.bold,
        )
      }
      else {
        // 形式三：不帶狀態標籤，source 上 stateLabel 色，→ 不上色
        console.log(
          `🫥  %c${source}%c → ${displayResult}`,
          style.stateLabel,
          '',
        )
      }
      return
    }

    // 物件類型交給 handleVariousObj 處理
    handleVariousObj(stateLabel ?? '', source, result, colorizedFlow)
  }
}

// ─── 物件輸出處理 ─────────────────────────────────────────────────────────────
// 依物件類型選擇最適合的 console 輸出方式
function handleVariousObj (
  stateLabel: string,
  source: string,
  result: any,
  colorizedFlow: string,
) {
  // 形式三（無 stateLabel）：source 上 stateLabel 色，→ 不上色
  // 形式二（有 stateLabel）：stateLabel 上 colorizedFlow 色，source 上 bold
  const label = stateLabel
    ? `🫥 %c${stateLabel}:%c %c${source} →`
    : `🫥 %c${source}%c →`
  const labelStyles = stateLabel
    ? [colorizedFlow, '', style.bold]
    : [style.stateLabel, '']

  // Set / Map / WeakMap / WeakSet / RegExp / URL：讓瀏覽器原生展示
  if (
    result instanceof Set
    || result instanceof Map
    || result instanceof WeakMap
    || result instanceof WeakSet
    || result instanceof RegExp
    || result instanceof URL
  ) {
    console.log(label, ...labelStyles, result)
    return
  }

  // 可序列化物件：用 JSON.stringify 格式化，折疊顯示
  if (isSerializable(result)) {
    console.groupCollapsed(label, ...labelStyles)
    console.log(JSON.stringify(result, null, 2))
    console.groupEnd()
    return
  }

  // 不可序列化物件（含循環引用、函式等）：直接 console.log，讓瀏覽器展開
  console.log(label, ...labelStyles, result)
}

// ─── 工具函式 ─────────────────────────────────────────────────────────────────

// 從 getter 函式取得「運算式字串」和「運算結果」
// 例如 () => user.name  →  ['user.name', 'Alice']
function showDebugKeyData (getter: Getter): [string, any] {
  try {
    const match = getter.toString().match(/=> (.*)$/)
    if (!match) { throw new Error('錯誤格式，正確格式為：() => ...') }
    const exprSource = match[1]
    const exprResult = getter()
    return [exprSource, exprResult]
  }
  catch (originalError) {
    const error = new Error('🫥 Error: 關鍵數據顯示流程的錯誤') as any
    error.originalError = originalError
    throw error
  }
}

function isSerializable (obj: any): boolean {
  try {
    JSON.stringify(obj)
    return true
  }
  catch {
    return false
  }
}
