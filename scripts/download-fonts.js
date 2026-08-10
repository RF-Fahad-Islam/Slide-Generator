import fs from 'fs';
import path from 'path';
import https from 'https';

const fontsDir = path.resolve('public/fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = (targetUrl) => {
      https.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      }, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return request(response.headers.location);
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: Status code ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    request(url);
  });
}

async function run() {
  console.log('Downloading Bengali & UI font files to public/fonts/...');

  const fontUrls = [
    {
      name: 'Kalpurush.woff2',
      url: 'https://fonts.maateen.me/kalpurush/Kalpurush-v0.258.woff2'
    },
    {
      name: 'Kalpurush.ttf',
      url: 'https://fonts.maateen.me/kalpurush/Kalpurush-v0.258.ttf'
    },
    {
      name: 'HindSiliguri-Regular.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/hindsiliguri/HindSiliguri-Regular.ttf'
    },
    {
      name: 'HindSiliguri-Bold.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/hindsiliguri/HindSiliguri-Bold.ttf'
    },
    {
      name: 'NotoSansBengali-Variable.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosansbengali/NotoSansBengali%5Bwght%5D.ttf'
    },
    {
      name: 'AnekBangla-Variable.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/anekbangla/AnekBangla%5Bwdth%2Cwght%5D.ttf'
    },
    {
      name: 'TiroBangla-Regular.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/tirobangla/TiroBangla-Regular.ttf'
    },
    {
      name: 'Atma-Regular.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/atma/Atma-Medium.ttf'
    },
    {
      name: 'Mina-Regular.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/mina/Mina-Regular.ttf'
    },
    {
      name: 'PlusJakartaSans-Variable.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/plusjakartasans/PlusJakartaSans%5Bwght%5D.ttf'
    },
    {
      name: 'Poppins-Regular.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf'
    },
    {
      name: 'Poppins-Bold.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf'
    },
    {
      name: 'PlayfairDisplay-Variable.ttf',
      url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf'
    }
  ];

  for (const item of fontUrls) {
    const destPath = path.join(fontsDir, item.name);
    try {
      console.log(`Downloading ${item.name}...`);
      await downloadFile(item.url, destPath);
      console.log(`Saved ${item.name}`);
    } catch (e) {
      console.error(`Error downloading ${item.name}:`, e.message);
    }
  }

  console.log('Font download complete.');
}

run();
