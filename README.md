# swtc-transaction-util

shell for wallet operation and transaction, only for Jingtum chain

命令行钱包操作和交易工具（仅针对Jingtum）

## Shell Commander

```bash

# 生成keystore文件
node generate-keystore.js

# 创建挂单
# 0.004cnt/swt买2个swt
address #钱包地址
counter="cny"
base="swt"
price="0.004"
amount="2"
type="buy"

node create-order.js -A $address -c $counter -b $base -p $price -a $amount -t $type

# 0.006cnt/swt卖3个swt
address #钱包地址
counter="cny"
base="swt"
price="0.006"
amount="3"
type="sell"
node create-order.js -A $address -c $counter -b $base -p $price -a $amount -t $type

# 取消所有挂单
address #钱包地址

node cancel-orders.js  -A $address

# 转移所有资产
# 针对转入钱包地址未激活的case, 未处理, 操作前请确保激活
address #钱包地址
to #转入钱包地址

node transfer-all-tokens.js -A $address -t $to

# 转账
address #钱包地址
to #转入钱包地址
currency #币种名称
amount #数量

node transfer.js -A $address -t $to -c $currency -a $amount

```
