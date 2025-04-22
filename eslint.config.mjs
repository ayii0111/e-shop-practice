// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: {
      css: true,
      html: true,
      markdown: 'prettier',
    },
  },
  {
    rules: {
      'no-console': 0, // 禁用 console
      'ts/no-unused-expressions': 0, // 預期有一個賦值或函數調用，但卻看到了一個表達式
      'ts/no-use-before-define': 0, // 宣告前使用
      'no-eval': 0, // 禁用 eval()
      'vue/attribute-hyphenation': 0, // 標籤屬性需使用「連字號」連結
      'vue/require-toggle-inside-transition': 0, // <transition> 的子元素需要有 v-if 或 v-show，隔層就不行（太嚴格）
      'unused-imports/no-unused-vars': 0, // 變數未使用
      'no-empty': 0, // if {  } 內為空
      'vue/html-self-closing': 0, // 不檢查 <自定標籤 /> 的代碼
      'no-prototype-builtins': 0, //  解除 obj.hasOwnProperty() 的禁用
      'ts/consistent-type-definitions': 0, // 能使用 interface 就不要用 type
      'curly': ['error', 'multi-line'], // 這個要設定要加大括號，才能與 if 擠一行（莫名其妙）
      'style/max-statements-per-line': 0, // 限制每行的 statement 數量
      'no-unused-expressions': 0, // 可以僅使用「條件式 ? true: null 而不會報錯」
      'no-extra-boolean-cast': 0, // 可以使用 !! 的條件式
      'vue/valid-attribute-name': 0, // 單元素綁定多事件
      'vue/first-attribute-linebreak': 0, // 元素中屬性不強制換行
      'vue/no-unused-refs': 0, // 使用 ref 屬性，但未宣告 ref 屬性值的變數，會報錯
      'style/space-before-function-paren': 0, // 函數括號前要有空格
      'style/eol-last': 0, // 最後一行要有一個換行符
    },
  },
)
