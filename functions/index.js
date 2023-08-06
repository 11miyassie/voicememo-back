const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { namespace } = require("firebase-functions/v1/firestore");

//chatGPT周り
const { Configuration, OpenAIApi } = require("openai");
const dotenv = require('dotenv');
dotenv.config();

admin.initializeApp();


// exports.testFunction = functions.firestore.document('/user-inputs/{documentId}')
//   .onCreate(async (snap, context) => {
//
//   const audioData = snap.data();
//   const text = audioData.text;
//   const userId = audioData.user_id;
//   const timestamp = audioData.timestamp;
//
//   const result =
// 	  {
// 		  "date": "2021-10-01",
// 		  "repeat": "3週間",
// 		  "task": "この薬をこれから3週間毎日朝の8:00に飲んでください"
// 	  };
//
//   await admin.firestore().collection('reminders').add(
// 	{
// 	  task: result["task"],
// 	  date: result["date"],
// 	  repeat: result["repeat"],
// 	  user_id: userId
// 	});
// });

//answerが新規作成されたら起動する、回答分析の関数
exports.answerNLAnalysis = functions.firestore.document('/user-inputs/{documentId}')
  .onCreate(async (snap, context) => {

  const audioData = snap.data();
  const text = audioData.text;
  const fcmToken = audioData.fcm_token;
  // const timestamp = audioData.timestamp;

  let result = await NLAnalysis(text);

  //console.log("final:" + result);
  await admin.firestore().collection('reminders').add(
      {
          fcm_token: fcmToken,
          task: result["task"],
          time: result["time"]
      });
});

async function NLAnalysis(text){
	const configuration = new Configuration({
		apiKey: process.env.OPENAI_API_KEY,
	});
	const openai = new OpenAIApi(configuration);

	const condition = `これから与えられる文章からリマインドしたい事案と時間だけを抽出してjson形式で出力してください。
	余計な感想などを出力しないでください。
	
	例:
	1
	医者: この薬をこれから3週間毎日朝の8:00に飲んでください。
	
	患者: わかりました。
	
	正解:
	{
		"reminders": [
			{
				"time": 08:00,
				"task": "薬を飲む"
			}
		]
	}
	
	2
	今日の日付:5/3
	A: 明日、夕方の5時に買い物に行かないと
	
	正解:
	{
		"reminders": [
			{
				"time": 17:00,
				"task": "買い物に行く"
			}
		]
	}
	
	3
	A: 毎日朝の6時に散歩に行って、午後3時に買い物に行く。
	
	正解:
	{
		"reminders": [
			{
				"time": 06:00,
				"task": "散歩に行く"
			},
			{
				"time": 15:00,
				"task"買い物に行く"
			}
		]
	}
					`;

    const content = text;
	const completion = await openai.createChatCompletion({
		model: "gpt-3.5-turbo",
		messages: [{"role": "system", "content": condition}, {role: "user", content: content}],
	});
	//console.log(completion.data.choices[0].message.content);
	//let result = JSON.parse(completion.data.choices[0].message.content)
	//console.log(result["firstword"]);
  return JSON.parse(completion.data.choices[0].message.content);
}

exports.sendPushNotification = functions.firestore
  .document('reminders/{documentId}')
  .onCreate(async (snap, context) => {
    const reminderData = snap.data();
    const time = reminderData.time;

    try {
      sendDailyPushNotification = functions.pubsub
      .schedule(`every day ${time}`)
      .timeZone('Asia/Tokyo')
      .onRun(async (context) => {
        try {
          const fcmToken = reminderData.fcm_token
          // 通知を送信する処理
          const payload = {
            notification: {
              title: 'リマインダー',
              body: '毎朝8時のリマインダーです。',
            },
          };

          // FCMトークンを使って全てのユーザーに通知を送信
          const response = await admin.messaging().sendToDevice(fcmToken, payload);
    
          console.log('通知が送信されました。', response);
          return null;
        } catch (error) {
          console.error('通知の送信中にエラーが発生しました。', error);
          return null;
        }
      });
      console.log('通知が送信されました。', response);
      return null;
    } catch (error) {
      console.error('通知の送信中にエラーが発生しました。', error);
      return null;
    }
  });