// 不知為何在共享函式中需這樣 import { debugLog } from '../share' 引用，才不會在控制台中報錯
// 意即使用 import { debugLog } from './debugLog.ts 會報錯'

// 注意：特殊情況不靜態報錯
// _debug('ooo',() => xxx) // 此種情況此處應該報錯，不會報錯，但會在執行時產生錯誤，要注意
// const { xxx } = fn()

type Getter = () => any
// type Getters = () => any[]
type Getters = Getter[]
// Getter 代表 () => 觀察項
// Getters 代表 [() => 觀察項 1, () => 觀察項 2 ,...]
// 但實際上這樣也可以：Getters () => [觀察項 1, 觀察項 2, ...]
// 只是這樣他就是會顯示 [觀察項 1, 觀察項 2, ...]

interface Option {

  expectedFlow?: 'o' | 'x'
  callerFnName?: string
  focusCondition?: boolean
}

// 實際上，這是一個「帶方法的函式」 (Function with Methods)
interface DebugLogger {
  // 函式多載簽名 1
  (stateLabel: string, secondArg?: Option | Getters | Getter, option?: Option): void
  // 函式多載簽名 2
  (stateLabel: string, secondArg?: Option | Getters | Getter): void
  // 函式作為物件的靜態方法
  head: (label: string, isFold?: boolean) => void
  end: () => void
}

// const  _debug = debugLog('xxx 偵錯'); // 主要偵錯標籤
// _debug('xx 狀態', ()=> 變數檢視) // 變數檢視
// _debug('xx 狀態', ()=> [變數1, 變數2]) // 變數檢視
// _debug('xx 狀態', { expectedFlow: 'o' }) // 綠燈檢視
// _debug('xx 狀態', { focusCondition: 變數 === 當前狀態特徵值 }) // 聚焦某一次狀態的偵錯
// 當該次要偵錯的狀態特徵值符合時，才會是 true，否則為 false

// 想要重構
// debugLog 本來像是二段式的函式，想改成一段式意即第一段的功能直接改成第一次執行時，才會去列印 mainLabel 部分，而這個值，應該列印出當前檔案
// 而後把第二段的參數都改成第一段就能使用但具體規則如下
//  debugLog('xx狀態') 此時需要相當於舊的二段是函式的 _debug('xx 狀態', { expectedFlow: 'o' })
//  debugLog(()=> 變數檢視)  此時需要相當於舊的二段是函式的 _debug('', ()=> 變數檢視,) 但我想要讓 '' 顯示那一行消失，直接從 ()=> 變數檢視 顯示的部分開始
//  debugLog(()=> [變數1, 變數2])  此時需要相當於舊的二段是函式的 _debug('', ()=> [變數1, 變數2],) 但我想要讓 '' 顯示那一行消失，直接從 ()=> [變數1, 變數2] 顯示的部分開始
//  debugLog('xx狀態', ()=> 變數檢視) 此時需要相當於舊的二段是函式的 _debug('xx 狀態', ()=> 變數檢視, { expectedFlow: 'x' }) ，此時應該把 { expectedFlow: 'x' } 的顏色套在 'xx 狀態' 部位
//  上面的函式都有一定程度的化簡，即把多個參數改為較少參數，然而最終的  const { expectedFlow, callerFnName } = option 功能需保留，而如上所示，相當於把 expectedFlow 拆成自動生效不再手動控制

export function debug(arg1: string | Getters | Getter, arg2?: Getters | Getter) {
  const filename = import.meta.url.split('/').pop() as string
  if (arguments.length === 1) {
    if (typeof arg1 === 'string') { return debugLog(filename)(arg1, { expectedFlow: 'o' }) }
    else { return debugLog(filename)('', arg1, { expectedFlow: 'o' }) }
  }
  if (typeof arg1 === 'string') { return debugLog(filename)(arg1, arg2, { expectedFlow: 'o' }) }
}

export function debugLog(mainLabel: string): DebugLogger {
  if (typeof mainLabel !== 'string') {
    throw new TypeError('🫥 Error: label 應為必填的 string 型別')
  }
  const style = {
    mainLabel: 'background: #0077b6; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
    dirLabel: 'background: #90e0ef; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
    stateLabel: 'background: #caf0f8; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
    none: 'font-weight: normal; color: gray;',
    bold: 'font-weight: bold;',
    green: 'background: #c7f9cc; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
    red: 'background: #ffb3c6; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
  }
  console.log(
    `🫥 %c------ debug: ${mainLabel} ------`,
    style.mainLabel,
  )
  // 用來儲存當前上色策略的「顏色模式」決定，提供給 console ... %c 來上色使用
  let colorizedFlow: string | undefined
  const count = 1

  function debugLogger(stateLabel: string, option?: Option): void
  function debugLogger(stateLabel: string, getters?: Getters | Getter): void
  function debugLogger(stateLabel: string, secondArg?: Option | Getters | Getter, thirdArg?: Option): void {
    if (stateLabel === '') { console.log() }
    let observedItems: Getters | Getter | undefined
    let option: Option | undefined
    if (arguments.length === 2) {
      (Array.isArray(secondArg) || typeof secondArg === 'function')
        ? observedItems = (secondArg as Getters | Getter)
        : option = secondArg
    }
    if (arguments.length === 3) {
      observedItems = (secondArg as Getters | Getter)
      option = thirdArg
    }

    const { expectedFlow, callerFnName } = option ?? {}
    // 默認：無特殊意義，不作「預期/非預期」的高亮標記
    // expectedFlow: 'o'  可使用在未被執行，而期望執行的流程中，當成功 debug 後，就會出現綠色的輸出
    // expectedFlow: 'x'  可使用在已被執行，而非期望執行的流程中，當成功局部 debug 後，紅色的輸出應該就不會列印

    // 聚焦條件設計:
    // { focusCondition: 變數 === 當前狀態特徵值 }
    // 當該次要偵錯的狀態特徵值符合時，才會是 true，否則為 false
    const focusCondition = option?.focusCondition ?? true
    if (!focusCondition) { return }
    if (typeof stateLabel !== 'string') {
      throw new TypeError('🫥 Error: stateLabel(firstArg) 應為 string 型別')
    }

    // 用策略模式寫的條件決定模式
    // 當 strategies.condFn() 執行時，會向外取得 expectedFlow 變數來判斷，上色的策略
    const strategies = [
      {
        name: 'expected',
        condFn: () => expectedFlow === 'o',
        decidedColor: () => style.green,
      },
      {
        name: 'unexpected',
        condFn: () => expectedFlow === 'x',
        decidedColor: () => style.red,
      },
      {
        name: 'default',
        condFn: () => expectedFlow === undefined,
        decidedColor: () => style.stateLabel,
      },
      {
        name: 'error',
        condFn: () => true,
        decidedColor: () => { throw new Error('expectedFlow 僅允許選填 "o" 或 "x"') },
        // decidedColor: () => { throw new Error('🫥') },
      },
    ]

    // 取得當前上色策略的「顏色模式」決定，提供給 console ... %c 來上色使用
    colorizedFlow = strategies.find(({ condFn }) => condFn())?.decidedColor()

    // 下面為上面簡化後的代碼
    // 上面主要用來嘗試，驗證條件的策略模式
    // if (!expectedFlow) { colorizedFlow = style.stateLabel }
    // if (expectedFlow === 'o') { colorizedFlow = style.green }
    // if (expectedFlow === 'x') { colorizedFlow = style.red }

    if (!!callerFnName) {
      if (typeof callerFnName !== 'string') {
        throw new TypeError('🫥 Error: callerFn 應為 string 型別')
      }
      if (!isInTheCallerFn(callerFnName)) { return }
    }

    let observedItem = null as Getter | null
    switch (true) {
      // 多個觀察項
      case Array.isArray(observedItems) && observedItems.length > 0:
        multipleObservedItemsHandler(stateLabel, observedItems)
        break
      // 單一觀察項
      case typeof observedItems === 'function':
        observedItem = observedItems
        singleObservedItemHandler(stateLabel, observedItem)
        break
      // 觀察項未填寫
      case observedItems === undefined:
        // 未填觀察項，會直接列印當前狀態標籤
        console.log(
          `🫥 %c${stateLabel}:%c ---(${count})`,
          colorizedFlow,
          style.none,
        )
        break
      // switch 錯誤選項
      default:
        throw new Error('🫥 Error: exprFns 參數，可不填。或填入 ()=> 要觀察的運算式，或 [()=> ..., ()=> ...]')
    }
  }

  let _isFold: boolean

  return debugLogger as DebugLogger
  function singleObservedItemHandler(stateLabel: string, getter: Getter) {
    // source, result 為 exprSource, exprResult 的再簡寫
    let [source, result] = showDebugKeyData(getter)
    if (typeof result !== 'object') {
      if (typeof result === 'string' && result.length > 60) { result = `\n${result}` }
      console.log(
        `🫥 %c${stateLabel}:%c %c${source}  →  ${result}`,
        colorizedFlow,
        '',
        style.bold,
      )
      return
    }
    handleVariousObj(stateLabel, source, result)
  }
  function multipleObservedItemsHandler(stateLabel: string, getters: Getters) {
    console.log('進入 multipleMonitoredTargetHandler')
    const isAllGetter = getters.every(getter => typeof getter === 'function')
    console.log('isAllGetter :', isAllGetter)
    if (!isAllGetter) {
      console.log('進入 if (!isAllGetter)')
      throw new Error('🫥 Getters 陣列中，有格式不符，應為 [() => ... ,]')
    }
    console.log('未進入 if (!isAllGetter)')
    console.groupCollapsed(
      `🫥 %c${stateLabel}:%c ---(${count})`,
      colorizedFlow,
      style.none,
    )
    getters.forEach((exprFn: any) => {
      let [exprStr, result] = showDebugKeyData(exprFn)
      if (typeof result !== 'object') {
        if (typeof result === 'string' && result.length > 60) { result = `\n${result}` }
        console.log(`🫥 %c${exprStr} → ${result}`, style.bold)
        return
      }
      handleVariousObj(stateLabel, exprStr, result)
    })
    console.groupEnd()
  }
  function handleVariousObj(stateLabel: string, source: string, result: any) {
    // 色系選擇
    const style = {
      mainLabel: 'background: #0077b6; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
      dirLabel: 'background: #90e0ef; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
      stateLabel: 'background: #caf0f8; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
      none: 'font-weight: normal; color: gray;',
      bold: 'font-weight: bold;',
    }
    // const style = {
    //   mainLabel: 'background: #a4c2a5; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
    //   dirLabel: 'background: #f0f3bd; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
    //   stateLabel: 'background: #fefae0; color: black; padding: 2px 6px; border-radius: 8px; font-weight: normal;',
    //   none: 'font-weight: normal; color: gray;',
    //   bold: 'font-weight: bold;',
    // }

    if (result instanceof Set
      || result instanceof Map
      || result instanceof WeakMap
      || result instanceof WeakSet
      || result instanceof RegExp
      || result instanceof URL
    ) {
      console.log(
        `🫥 %c${stateLabel}:%c %c${source} →`,
        colorizedFlow,
        '',
        style.bold,
        result,
      )
      return
    }
    if (isSerializable(result)) {
      console.groupCollapsed(
        `🫥 %c${stateLabel}:%c %c${source} →`,
        colorizedFlow,
        '',
        style.bold,
      )
      console.log(`${JSON.stringify(result, null, 2)}`)
      // 特殊物件篩選
      console.groupEnd()
      return
    }
    console.log(
      `🫥 %c${stateLabel}:%c %c${source} →`,
      colorizedFlow,
      '',
      style.bold,
      result,
    )
  }
}

// 可以將 () => 運算式
// 取得該運算式的 exprSource 以及 exprResult
function showDebugKeyData(getter: Getter) {
  try {
    const match = getter.toString().match(/=> (.*)$/)
    if (!match) { throw new Error('錯誤格式，正確格式為：() => ...') }
    const exprSource = match[1] // 若 100% 確定存在則可以這樣  或用 if(match){throw ... 來報錯}
    const exprResult = getter() // 安全執行傳入的函式
    return [exprSource, exprResult]
  }
  catch (originalError) {
    const error = new Error(`🫥 Error: 關鍵數據顯示流程的錯誤`) as any
    error.originalError = originalError
    throw error
  }
}

function isSerializable(obj: any) {
  try {
    JSON.stringify(obj)
    return true
  }
  catch (e) {
    return false
  }
}

// 用來檢視是否在指定堆疊中，若有則回傳 true
function isInTheCallerFn(
  callerFnName: string,
): boolean | void {
  // 1. 獲取呼叫堆疊資訊
  const stackTrace = new Error('stack-debug').stack

  // 檢查 stackTrace 是否存在且是字串
  if (!stackTrace || typeof stackTrace !== 'string') {
    // 在某些極端環境下可能無法獲取堆疊，此時退出。
    console.warn(`isInStack() 無法獲取呼叫堆疊資訊。`)
    return
  }

  // 2. 準備用於正規表達式的安全名稱
  // 避免特殊字符破壞正規表達式
  const escapedName = callerFnName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')

  // 3. 建立正規表達式來尋找呼叫者
  // V8/Node.js 堆疊格式通常是 "    at functionName (file.js:line:col)"
  // 我們尋找包含目標名稱及其後跟空格或括號的行。
  // 我們尋找的目標在堆疊中會出現在 'e' 函式 (conditionalLogByCaller) 的上方。
  const regex = new RegExp(`\\s+at\\s+${escapedName}\\s*[\\s(]`)

  // 4. 在堆疊字串中進行匹配
  // .slice(90) 用於跳過堆疊頂部的幾行（如 "Error" 和 "at conditionalLogByCaller"），加快搜索。
  const isTargetCaller = regex.test(stackTrace.slice(90))
  return !!isTargetCaller
}