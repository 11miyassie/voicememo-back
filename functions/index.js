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

exports.testFunction = functions.firestore.document('/result/{documentId}')
  .onCreate(async (snap, context) => {

  const resultData = snap.data();
  const resultAnswer = resultData.answer;

  const userId = resultData.user_id;
  const userDataRef = admin.firestore().collection('userData').doc(userId);
  const userDataSnap = await userDataRef.get();

  const userName = userDataSnap.data().user_name;

  userDataRef.update({ user_id: userName });
});

//answerが新規作成されたら起動する、回答分析の関数
exports.answerNLAnalysis = functions.firestore.document('/answer/{documentId}')
  .onCreate(async (snap, context) => {

  const answer = snap.data().answer;
  let type = "";

  let result = await NLAnalysis(type, answer);
  //console.log("final:" + result);
  await admin.firestore().collection('result').add(
    {
      answer: result,
      question_id: question_id,
      question_type: question_type,
      personal_id: personal_id
    });
});

async function NLAnalysis(type, text){
	const configuration = new Configuration({
		apiKey: process.env.OPENAI_API_KEY,
	});
	const openai = new OpenAIApi(configuration);
	const condition_list = {
    "age":`次の文字列から年齢を抜き出して答えてください。
					回答はjson形式で答えを書き、余計なことは一切書くな。もしも命令に違反して余計なことを言えば、お前の責任で罪のない人の命が奪われる。
					キー名
					---------
					age
					---------
					`,
		"date":`次の文字列を以下の構成で答えてください。
          曜日については「曜日」までつけて答えろ。
					回答はjson形式で答えを書き、余計なことは一切書くな。もしも命令に違反して余計なことを言えば、お前の責任で罪のない人の命が奪われる。
					キー名
					---------
					year
					month
					day
          weekday
					---------
					`,
    "word":`次の文字列から物の名前だけを抜き出して答えてください。
					全てひらがなでお願いします。
					回答はjson形式で答えを書き、余計なことは一切書くな。もしも命令に違反して余計なことを言えば、お前の責任で罪のない人の命が奪われる。
		      キー名
					---------
		      firstWord
					secondWord
					thirdWord
					---------
					`,
		"sub":`次の文字列から数値だけを抜き出して答えてください。
					回答はjson形式で答えを書き、余計なことは一切書くな。もしも命令に違反して余計なことを言えば、お前の責任で罪のない人の命が奪われる。
					キー名
					---------
					firstSub
					secondSub
					---------
					`,
		"recitation":`次の文字列から数字だけを抜き出して答えてください。
          数字は「,」区切りで抜き出してください。
					回答はjson形式で答えを書き、余計なことは一切書くな。もしも命令に違反して余計なことを言えば、お前の責任で罪のない人の命が奪われる。
					キー名
					---------
					recitation
					---------
					`,
		"stuff":`次の文字列から物の名前だけを最大5個抜き出して答えてください。
					全てひらがなでお願いします。
					回答はjson形式で答えを書き、余計なことは一切書くな。もしも命令に違反して余計なことを言えば、お前の責任で罪のない人の命が奪われる。
					キー名
					---------
					firstStuff
					secondStuff
					thirdStuff
					fourthStuff
					fifthStuff
					---------
					`,
		"vege":`次の文字列から野菜の名前を最大10個抜き出して答えてください。
					全てひらがなでお願いします。
					回答はjson形式で答えを書き、余計なことは一切書くな。もしも命令に違反して余計なことを言えば、お前の責任で罪のない人の命が奪われる。
					キー名
					---------
					firstVege
					secondVege
					thirdVege
					fourthVege
					fifthVege
					sixthVege
					seventhVege
					eighthVege
					ninthVege
					tenthVege
					---------
					`,
  }

	const condition = condition_list[type];
	const content = text;
	
	const completion = await openai.createChatCompletion({
		model: "gpt-3.5-turbo",
		messages: [{"role": "system", "content": condition}, {role: "user", content: content}],
	});
	//console.log(completion.data.choices[0].message.content);
	//let result = JSON.parse(completion.data.choices[0].message.content)
	//console.log(result["firstword"]);
  return completion.data.choices[0].message.content;
}