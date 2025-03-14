// test用ファンクション
function getWeatherAndPollen() {
    const TENKI_URL = scriptProperties.getProperty('TENKI_URL')
    const response = UrlFetchApp.fetch(url);
    const html = response.getContentText('UTF-8'); // 文字化け対策
  
    // html 全体を出力（デバッグ用）
    // Logger.log("HTML:", html);
  
    //今日の情報
    const todayInfo = extractInfo(html, "today-weather");
    Logger.log(todayInfo);
  
    //明日の情報
    const tomorrowInfo = extractInfo(html, "tomorrow-weather");
    Logger.log(tomorrowInfo);
  }
  
  // スクレイピング
  function extractInfo(html, sectionClass) {
    const sectionRegex = new RegExp(`<section class="${sectionClass}"[^>]*>([\\s\\S]*?)<\/section>`);
    const sectionMatch = html.match(sectionRegex);
  
    if (!sectionMatch) {
      Logger.log(`セクション ${sectionClass} が見つかりません`);
      return null;
    }
  
    let sectionContent = sectionMatch[1].trim();
  
    // コメントアウトを除去
    sectionContent = sectionContent.replace(/<!--[\s\S]*?-->/g, "");
  
    // sectionContent の内容を出力（デバッグ用）
    // Logger.log(sectionContent);
  
    // 天気を抽出
    const weatherRegex = /<div\s+class="weather-icon-box"\s*>[\s\S]*?<img[^>]*?alt="(.*?)"[^>]*?>/is; //★修正
    const weatherMatch = sectionContent.match(weatherRegex);
    // Logger.log(weatherMatch); // デバッグ用
    const weather = weatherMatch ? weatherMatch[1] : null;
    // Logger.log(weather); // デバッグ用
    // 花粉情報を抽出
    const pollenRegex = /<div\s+class="pollen-icon-box"\s*>[\s\S]*?<img[^>]*?alt="(.*?)"[^>]*?>/is; //★修正 (weatherRegex と同じ)
    const pollenMatch = sectionContent.match(pollenRegex);
    // Logger.log("pollenMatch:", pollenMatch); // デバッグ用
    const pollen = pollenMatch ? pollenMatch[1] : null;
  
    //最高気温、最低気温、降水確率を取得
    const tempRegex = /<p class="pollen-weather-date-value">.*?<span class="high-temp">(.*?)<\/span>.*?<span class="low-temp">(.*?)<\/span>.*?<span class="precip">(.*?)<\/span>/s;
    const tempMatch = sectionContent.match(tempRegex);
    let highTemp = null;
    let lowTemp = null;
    let precip = null;
  
    if (tempMatch) {
      highTemp = tempMatch[1];
      lowTemp = tempMatch[2];
      precip = tempMatch[3];
    }
  
    return {
      weather: weather,
      pollen: pollen,
      highTemp: highTemp,
      lowTemp: lowTemp,
      precip: precip,
    };
  }
  
  // 変数として登録
  var Tenki = {
    extractInfo : extractInfo
  }