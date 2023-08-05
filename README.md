# voicememo-back

## セットアップ

1. Git cloneする
   1. git clone https://github.com/11mrhappy/voicememo-back.git
2. 以下Firebase周り
3. Firebaseへログインする
   1. firebase login
   2. 必要な認証情報を入力する
4. Firebaseのプロジェクトを選ぶ
   1. firebase init
   2. `use an existing project`を選択し、`voicememo-3e665`を選択する
5. (FirestoreとFunctionsは作成済みのため、もし作成しますか?みたいなフローがあったら無視してOK)
6. 今回はハッカソンなので1つのファイル内にすべてのFunctionsを書く(コンフリクトは発生しますが、お互いのFunctionに干渉しないので、かなり楽にコンフリクト解消できます)
   - Firebase全体をデプロイ: firebase deploy
   - 特定の関数をデプロイ: firebase deploy --only functions:FUNCTION_NAME
   - functionのみをデプロイ: firebase deploy --only functions
   - firestoreのruleのみをデプロイ: firebase deploy --only firestore:rules

## フロー

1. アプリ: ホーム画面「リマインド設定画面」
2. アプリ: 何をリマインドしてほしいか要求する
3. ユーザ: リマインド内容を回答する
4. アプリ: 返事をする
5. アプリ: いつ、頻度を要求する
6. ユーザ: リマインド頻度を回答する
7. アプリ: 返事をする
8. アプリ: タイミングが来たらPush通知する
9. ユーザ: Push通知を押す
10. アプリ: 録音音声を流す。
11. アプリ: 一言応援メッセージみたいなものを付け加える
