const scriptProperties = PropertiesService.getScriptProperties();

// LINE
const LINE_API_URL = scriptProperties.getProperty('LINE_API_URL');
const CHANNEL_ACCESS_TOKEN = scriptProperties.getProperty('CHANNEL_ACCESS_TOKEN');
const YOUR_USER_ID = scriptProperties.getProperty('YOUR_USER_ID');

// OpenUVの設定
const OPENUV_API_URL = scriptProperties.getProperty('OPENUV_API_URL');
const OPENUV_API_KEY = scriptProperties.getProperty('OPENUV_API_KEY');
const LATITUDE = parseFloat(scriptProperties.getProperty('LATITUDE')); //数値に
const LONGITUDE = parseFloat(scriptProperties.getProperty('LONGITUDE')); //数値に

// スプレッドシートの設定
const SPREADSHEET_ID = scriptProperties.getProperty('SPREADSHEET_ID');
const SHEET_NAME = scriptProperties.getProperty('SHEET_NAME'); // プロパティから取得する場合

// スクレイピング先のURL
const TENKI_URL = scriptProperties.getProperty('TENKI_URL');


function getUvIndex() {
/** OpenUV APIから紫外線指数(最大値とその時刻)を取得 */
  const options = {
    'method': 'get',
    'headers': {
      'x-access-token': OPENUV_API_KEY,
    },
  };
  const params = {
    'lat': LATITUDE,
    'lng': LONGITUDE,
    'dt': new Date().toISOString() // 現在時刻は不要だが、APIの仕様上必要
  };
  const url = OPENUV_API_URL + '?' + buildQueryString(params);

  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    console.log("OpenUV API response:", data); // レスポンス全体を出力(確認用)

    const uvMax = data.result.uv_max;
    const uvMaxTime = new Date(data.result.uv_max_time); // ISO形式からDateオブジェクトへ

    return { uvMax: uvMax, uvMaxTime: uvMaxTime }; // オブジェクトで返す

  } catch (error) {
    console.error('Error fetching UV index:', error);
    sendErrorMessage("紫外線情報の取得に失敗しました: " + error.message);
    return null;
  }
}

function buildQueryString(params) {
/** クエリパラメータを生成する関数 */
  return Object.keys(params).map(key => key + '=' + encodeURIComponent(params[key])).join('&');
}

function appendDataToSheet(uvIndex, weatherInfo) {
  /** スプレッドシートにデータ追記 */
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  const now = new Date();
  // 天気情報も追記
  sheet.appendRow([now, uvIndex, weatherInfo.weather, weatherInfo.highTemp, weatherInfo.lowTemp, weatherInfo.precip, weatherInfo.pollen]);
}

function createChart() {
/** スプレッドシートにグラフ作成・更新 */
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME);
  const dataRange = sheet.getDataRange();

  const charts = sheet.getCharts();
  for (const chart of charts) {
    sheet.removeChart(chart);
  }

// 紫外線指数のグラフ
  const uvChart = sheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(dataRange.offset(0,0,dataRange.getNumRows(), 2)) // 日時とUV
    .setPosition(5, 1, 0, 0)
    .setOption('title', '紫外線指数 (過去データ)')
    .setOption('hAxis.title', '日時')
    .setOption('vAxis.title', '紫外線指数')
    .build();

  sheet.insertChart(uvChart);

  //　気温のグラフ
    const tempChart = sheet.newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(dataRange.offset(0,0,dataRange.getNumRows(),1)) // 日時
    .addRange(dataRange.offset(0,3,dataRange.getNumRows(),1)) // 最高気温
    .addRange(dataRange.offset(0,4,dataRange.getNumRows(),1)) // 最低気温
    .setPosition(5, 8, 0, 0)
    .setOption('title', '最高/最低気温 (過去データ)')
    .setOption('hAxis.title', '日時')
    .setOption('vAxis.title', '気温[℃]')
    .build();
     sheet.insertChart(tempChart);
}

function sendPushMessage(message) {
/** LINE Messaging APIでプッシュメッセージ送信 */
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
  };

  const messages = [
    {
      type: 'text',
      text: message,
    }
  ];

  const payload = {
    to: YOUR_USER_ID, // あなたのLINEのユーザーID
    messages: messages,
  };

  const options = {
    'method': 'post',
    'headers': headers,
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true, // エラー詳細確認用
  };

  try {
    const response = UrlFetchApp.fetch(LINE_API_URL, options);
    console.log(response.getContentText()); // レスポンス確認
  } catch (error) {
    console.error('Error sending push message:', error);
  }
}

// エラーメッセージを送信する関数 (getUvIndex 内で利用)
function sendErrorMessage(errorMessage) {
  sendPushMessage("エラーが発生しました:\n" + errorMessage);
}

function main() {
  // Tenkiオブジェクトを使って関数を呼び出す
  const response = UrlFetchApp.fetch(TENKI_URL);
  const html = response.getContentText('UTF-8');
  const todayWeatherInfo = Tenki.extractInfo(html, "today-weather");

  const uvData = getUvIndex(); // 戻り値がオブジェクトになった

  if (uvData !== null && todayWeatherInfo !== null) {
    const uvMax = uvData.uvMax; // 最大紫外線指数
    const uvMaxTime = uvData.uvMaxTime;  // 最大となる時刻

    let uvLevel;
    if (uvMax <= 2) {
      uvLevel = "低い";
    } else if (uvMax <= 5) {
      uvLevel = "中程度";
    } else if (uvMax <= 7) {
      uvLevel = "高い";
    } else if (uvMax <= 10) {
      uvLevel = "非常に高い";
    } else {
      uvLevel = "極端に強い";
    }

    // メッセージに天気情報と紫外線情報を追加
    const message = `今日の天気: ${todayWeatherInfo.weather}
最高気温: ${todayWeatherInfo.highTemp}
最低気温: ${todayWeatherInfo.lowTemp}
降水確率: ${todayWeatherInfo.precip}
花粉: ${todayWeatherInfo.pollen}
今日の紫外線情報：
最大紫外線指数: ${uvMax.toFixed(1)} (${uvLevel})
${uvMaxTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}頃に最大`;

    // スプレッドシートにデータ(最大値)を追記
    appendDataToSheet(uvMax, todayWeatherInfo); // 天気情報も渡す
    createChart();

    sendPushMessage(message);
  } else {
      //nullの場合
      let message = "今日の天気情報か紫外線情報の取得に失敗しました。"

      //考えられるエラーを捕捉
      if(uvData == null) message += "\n紫外線情報の取得失敗"
      if(todayWeatherInfo == null) message += "\n天気情報の取得失敗"

      sendPushMessage(message);
  }
}

// Webhookイベントを受け取るための関数 (doPost)
function doPost(e) {
  const output = ContentService.createTextOutput(JSON.stringify({ 'success': true }))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

function test_function() {
  sendPushMessage('test')
}

// トリガー設定関数
function createTrigger() {
  ScriptApp.newTrigger('main')
    .timeBased()
    .atHour(7)
    .everyDays(1)
    .create();
}