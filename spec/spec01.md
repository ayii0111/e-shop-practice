我想要作當前這個優惠卷使用頁面，請善用 primevue 框架
想要類似數據表的排列，但風格要活潑因此要使用primevue 框架的 Message 元件，為標卷上色
該票券的最左邊要有，下面這個 icon 元件，為標卷上色<span>
<font-awesome-icon :icon="slotProps.option.icon" class="mr-2" />
</span>
icon: ['fas', 'ticket']

每張票券的數據結構如下，請適當的讓他們簡單地呈現在頁面中的數據表中
title / name：顯示名稱，例如「新會員 $100 折價券」
code：優惠券代碼，例如 WELCOME100
startDate：可使用起始時間
endDate / expiryDate：到期時間
status：狀態，如 available、used、expired、upcoming
userGroup：適用身分，如 new_user、vip、all
totalLimit：全站總發放數量
usedCount：已被領取/使用次數
remainingCount：剩餘數量


幫我設計一下，訂單紀錄面板，交給你全權設計
/Users/ayii/Projects/e-shop-practice/src/layouts/Body/Dashboard/OrderlistTabPanel.vue