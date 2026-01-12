const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputSvg = path.join(__dirname, '../public/images/nuply-icon.svg');
const outputDir = path.join(__dirname, '../public');

// Couleur de fond pour les favicons (noir pour correspondre au logo original)
const backgroundColor = { r: 0, g: 0, b: 0, alpha: 1 };

async function generateFavicons() {
  try {
    // Lire le SVG
    const svgBuffer = fs.readFileSync(inputSvg);

    // Générer favicon-16x16.png
    await sharp(svgBuffer)
      .resize(16, 16, {
        fit: 'contain',
        background: backgroundColor
      })
      .png()
      .toFile(path.join(outputDir, 'favicon-16x16.png'));

    console.log('✅ Généré favicon-16x16.png');

    // Générer favicon-32x32.png
    await sharp(svgBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: backgroundColor
      })
      .png()
      .toFile(path.join(outputDir, 'favicon-32x32.png'));

    console.log('✅ Généré favicon-32x32.png');

    // Générer apple-touch-icon.png (180x180)
    await sharp(svgBuffer)
      .resize(180, 180, {
        fit: 'contain',
        background: backgroundColor
      })
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));

    console.log('✅ Généré apple-touch-icon.png');

    // Générer favicon.ico avec plusieurs tailles
    // Note: sharp ne supporte pas directement ICO, on va créer un ICO simple
    // ou utiliser les PNG générés. Pour un vrai ICO multi-tailles, on pourrait utiliser un autre outil.
    // Pour l'instant, on va créer un ICO basique à partir du 32x32
    const ico32 = await sharp(svgBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: backgroundColor
      })
      .png()
      .toBuffer();

    // Pour créer un vrai ICO, on va simplement copier le 32x32 comme favicon.ico
    // (Next.js peut utiliser un PNG comme favicon.ico)
    fs.writeFileSync(path.join(outputDir, 'favicon.ico'), ico32);
    console.log('✅ Généré favicon.ico');

    console.log('\n🎉 Tous les favicons ont été générés avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la génération des favicons:', error);
    process.exit(1);
  }
}

generateFavicons();

