# restaurants-searcher
住所周辺のレストランを探します。

## インストール

```
$ npm install -g restaurants-searcher
```

## 使い方

```
restaurants-searcher [住所] [-r number]

option
-r (range) 検索範囲を指定できます。数字で入力してください。
```

### 実例

```
export GOOGLE_MAPS_API_KEY=あなたのGoogleMapsのAPIキーを入力してください
restaurants-searcher 東京タワー -r 50
辺50mにあるお店は10店です。
ランチ:    6店
ディナー:  5店
? どの時間帯のレストラン情報をみたいですか？ …
❯ 全レストラン
  ランチ
  ディナー
店舗名:〇〇店
住所:〇〇
電話番号:xxx-xxxx-xxxx
URL:https://maps.google.com/...
評価:xxx/5.0
評価数:xx
閉店中
-------------------営業時間-------------------
月曜日: 定休日
火曜日: 定休日
水曜日: 定休日
木曜日: 定休日
金曜日: 定休日
土曜日: 12時00分～20時00分
日曜日: 12時00分～20時00分
----------------------------------------------
...
```
