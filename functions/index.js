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

exports.testFunction = functions.firestore.document('/user-inputs/{documentId}')
  .onCreate(async (snap, context) => {

  const audioData = snap.data();
  const text = audioData.text;
  const userId = audioData.user_id;
  const timestamp = audioData.timestamp;

  const result =
	  {
		  "date": "2021-10-01",
		  "repeat": "3週間",
		  "task": "この薬をこれから3週間毎日朝の8:00に飲んでください"
	  };

  await admin.firestore().collection('reminders').add(
	{
	  task: result["task"],
	  date: result["date"],
	  repeat: result["repeat"],
	  user_id: userId
	});
});

//answerが新規作成されたら起動する、回答分析の関数
exports.answerNLAnalysis = functions.firestore.document('/user-inputs/{documentId}')
  .onCreate(async (snap, context) => {

  const audioData = snap.data();
  const text = audioData.text;
  const userId = audioData.user_id;
  const timestamp = audioData.timestamp;

  let result = await NLAnalysis(text);

  //console.log("final:" + result);
  await admin.firestore().collection('reminders').add(
    {
      task: result["task"],
      date: result["date"],
      repeat: result["repeat"],
	  user_id: userId
    });
});

async function NLAnalysis(text){
	const configuration = new Configuration({
		apiKey: process.env.OPENAI_API_KEY,
	});
	const openai = new OpenAIApi(configuration);

	const condition = `次の文字列を以下の構成で答えてください。
          曜日については「曜日」までつけて答えろ。
					回答はjson形式で答えを書き、余計なことは一切書くな。もしも命令に違反して余計なことを言えば、お前の責任で罪のない人の命が奪われる。
					キー名
					---------
					year
					month
					day
          			weekday
          			time
          			task
					---------
					`;
	
	const completion = await openai.createChatCompletion({
		model: "gpt-3.5-turbo",
		messages: [{"role": "system", "content": condition}, {role: "user", content: content}],
	});
	//console.log(completion.data.choices[0].message.content);
	//let result = JSON.parse(completion.data.choices[0].message.content)
	//console.log(result["firstword"]);
  return completion.data.choices[0].message.content;
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