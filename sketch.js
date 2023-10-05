let textX = 70; // テキストの幅
let textY = 70; // テキストの高さ
let textNumX = 17; // 横の文字数
let textNumY = 5; // 縦の文字数
let textStartX = 100; // テキストの開始X座標
let textStartY = 200; // テキストの開始Y座標
let lineHeight = 80; // 一文字分の高さ
let maxLineWidth = textStartX + (textX * textNumX);
let maxLineHeight = textStartY + (lineHeight * textNumY);

let spaceImage; // スペース用の図形

let inputText = ""; // 入力されたテキスト
let currentLine = ""; // 現在の行のテキスト
let currentX = textX; // 現在のX座標
let currentY = textY; // 現在のY座標
let cursorVisible = true;
let cursorInterval;
let cursor = { x: textX, y: textY };

let playButtonX;
let playButtonY;
let playButtonSize = 20; // ボタンのサイズ
let isPlaying = false; // 動画再生中かどうか

let downloadButton;
P5Capture.setDefaultOptions({
  format: "mp4",
  framerate: 30,
  duration: 30*10,
  quarity: 1,
  bitrate: 10000,
  disableUi: true,
});

let rotoFonts = {}; // アルファベットと数字の動画を保持するオブジェクト

// アルファベットと数字の情報をまとめる
let font = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "'", ":", ",", "!", ".", "?"
];

// 記号文字と対応するファイル名をマップで定義
let symbolFileName = {
  "'": "_apostrophe",
  ":": "_colon",
  ",": "_comma",
  "!": "_exclamation",
  ".": "_period",
  "?": "_question"
};

function preload() {
  for (let char of font) {
    let fileName = symbolFileName[char] || char; // ファイル名を取得し、記号文字の場合は対応するファイル名を使用
    let src = `font/${fileName}_comp.mp4`;

    rotoFonts[char] = createVideo(src);
    rotoFonts[char].hide();
    rotoFonts[char].stop();
  }
  
  // スペース用の図形を作成（白色）
  spaceImage = createGraphics(textX, textY);
  spaceImage.clear();
}

function setup() {
  createCanvas(textStartX + maxLineWidth, textStartY + maxLineHeight);
  console.log("Canvas size: " + width + "x" + height);
  background(255 * 0.6);
  textLeading(lineHeight);
  currentY = textStartY;
  cursor.y = textStartY;
  cursorInterval = setInterval(toggleCursorVisibility, 500); // カーソルを0.5秒ごとに点滅させる

  // 再生ボタンの位置を設定
  playButtonX = width - playButtonSize - 10; // 右下に配置
  playButtonY = height - playButtonSize - 10;
  
  downloadButton = createButton("↓ Download");
  downloadButton.position(10, height + 80);
  downloadButton.mousePressed(startCapture);
  
  frameRate(30); 
}

function draw() {
  background(255 * 0.6);
  displayText();
  if (!isPlaying) {
    drawCursor(); // カーソルを描画
  }
  if (!isPlaying || (isPlaying && isMouseInsideCanvas()) ) {
    drawButton();
  }
}

function drawButton() {
  fill(255);
  noStroke();
  if (isPlaying) {
    // 再生中は四角形を表示
    rect(playButtonX, playButtonY, playButtonSize, playButtonSize);
  } else {
    // 停止中は三角形を表示
    triangle(playButtonX, playButtonY, playButtonX, playButtonY + playButtonSize, playButtonX + playButtonSize, playButtonY + playButtonSize / 2);
  }
}

function isMouseInsideCanvas() {
  return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}

// キーを押して文字を表示したらshowに切り替える関数
function showVideoForKey(key) {
  if (rotoFonts.hasOwnProperty(key.toUpperCase())) {
    let video = rotoFonts[key.toUpperCase()];
    if (video.elt.paused) {
      // 一度show()した後、再度表示する前にhide()する
      for (let char in rotoFonts) {
        if (rotoFonts.hasOwnProperty(char)) {
          rotoFonts[char].hide();
        }
      }
      video.show();
    }
  }
}

function keyPressed() {
  if (rotoFonts.hasOwnProperty(key.toUpperCase())) {
    currentLine += key.toUpperCase(); // 文字を追加
    let charWidth = textWidth(key.toUpperCase());
    currentX += charWidth; // 文字の幅を加算
    cursor.x += charWidth;    
    // キーを押して文字を表示したらshowに切り替える
    showVideoForKey(key);
  } else if (key === "Backspace" && currentLine.length > 0) {
    let lastChar = currentLine.charAt(currentLine.length - 1);
    let charWidth = textWidth(lastChar);
    currentLine = currentLine.slice(0, -1); // 末尾の文字を削除
    currentX -= charWidth; // X座標を調整
    cursor.x -= charWidth;
  } else if (key === " ") {
    currentLine += " "; // スペースを追加
    currentX += textX; // スペースの幅を加算
    cursor.x += textX; // スペースの幅をカーソルのX座標にも加算
} else if (key === "Enter") {
    // 新しい行に移動
    currentLine += "\n"; // 改行文字を追加
    currentX = textX; // X座標を左端にリセット
    cursor.x = textX;
  }
  updateInputText();
}

function updateInputText() {
  inputText = currentLine;
}

function displayText() {
  let x = textStartX; // テキストのX座標を設定
  let y = currentY; // 現在のY座標を使用
  cursor.y = y;

  let lines = inputText.split("\n"); // テキストを改行で分割

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let currentX = x; // 現在のX座標を行ごとにリセット
    cursor.x = x;
    for (let j = 0; j < line.length; j++) {
      let char = line.charAt(j); // テキストの各文字を取得
      if (char === " ") {
        // スペースの場合、スペース用の図形を表示
        if (currentX + spaceImage.width > maxLineWidth) {
          // スペースが一行の最大幅を超えた場合、新しい行に移動
          y += lineHeight;
          currentX = x;
          cursor.y += lineHeight;
          cursor.x = x;
        }
        image(spaceImage, currentX, y);
        currentX += spaceImage.width; // スペースの幅を加算
        cursor.x += spaceImage.width;
      } else if (rotoFonts.hasOwnProperty(char)) {
        let video = rotoFonts[char];
        let charWidth = textX; // 動画の幅を設定
        let charHeight = textY; // 動画の高さを設定

        if (currentX + charWidth > maxLineWidth) {
          // 一行の最大幅を超えた場合、新しい行に移動
          y += lineHeight;
          currentX = x;
          cursor.y += lineHeight;
          cursor.x = x;
        }

        image(video, currentX, y, charWidth, charHeight); // 動画を表示
        currentX += charWidth; // 文字間の幅を動画の幅に合わせる
        cursor.x += charWidth;
      }
    }
    y += lineHeight;
    cursor.y += lineHeight;
  }
}

function drawCursor() {
  if (cursorVisible) {
    stroke(255);
    strokeWeight(2.2 * textX / 100);
    line(cursor.x, cursor.y - lineHeight, cursor.x, cursor.y - (lineHeight - textY)); // カーソルを描画
  }
}

function toggleCursorVisibility() {
  cursorVisible = !cursorVisible; // カーソルの表示/非表示を切り替える
}

function mousePressed() {
  // ボタンをクリックしたときの処理
  if (mouseX >= playButtonX && mouseX <= playButtonX + playButtonSize && mouseY >= playButtonY && mouseY <= playButtonY + playButtonSize) {
    if (isPlaying) {
      // 再生中の場合、動画停止
      for (let char in rotoFonts) {
        if (rotoFonts.hasOwnProperty(char) && inputText.includes(char)) {
          rotoFonts[char].stop();
          rotoFonts[char].time(0);
        }
      }
      isPlaying = false;
    } else {
      // 停止中の場合、動画再生
      for (let char in rotoFonts) {
        if (rotoFonts.hasOwnProperty(char) && inputText.includes(char)) {
          rotoFonts[char].play();
          rotoFonts[char].loop();
        }
      }
      isPlaying = true;
    }
  }
}

function startCapture() {
  for (let char in rotoFonts) {
    if (rotoFonts.hasOwnProperty(char) && inputText.includes(char)) {
      rotoFonts[char].time(0);
      if (!isPlaying){
        rotoFonts[char].loop();
      }
    }
  }
  const capture = P5Capture.getInstance();
  capture.start();
  isPlaying = true;
}