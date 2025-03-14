// 変数をプロパティとして登録

function setScriptProperties() {
    const scriptProperties = PropertiesService.getScriptProperties();
    // LINE Message APIの設定
    // 参考URL: https://qiita.com/MikH/items/d9876b6e50f7c8510d0b
    // Group IDの取得: https://qiita.com/kenichi_odo/items/18badf7c069334d9c3a2 
    scriptProperties.setProperty('LINE_API_URL', 'https://api.line.me/v2/bot/message/push');
    scriptProperties.setProperty('CHANNEL_ACCESS_TOKEN', 'your_key');
    scriptProperties.setProperty('YOUR_USER_ID', 'your_id');
    // OPEN UVのAPI情報
    scriptProperties.setProperty('OPENUV_API_URL', 'https://api.openuv.io/api/v1/uv');
    scriptProperties.setProperty('OPENUV_API_KEY', 'your_key');
    // OPEN UVで使用する位置情報
    scriptProperties.setProperty('LONGITUDE', 135.0);
    scriptProperties.setProperty('LATITUDE', 34.0);
    // GASと紐づくスプレッドシートの情報
    scriptProperties.setProperty('SPREADSHEET_ID', 'your_id');
    scriptProperties.setProperty('SHEET_NAME', 'your_name');
    // 花粉情報の取得先URL
    scriptProperties.setProperty('TENKI_URL', 'your_tenki_url');
}
