require('dotenv').config();
const { twitterClient } = require("./twitterClient.js");
const OpenAI = require('openai');
const cron = require('node-cron');
const fetch = require('node-fetch');
const fs = require('fs');


const PEXELS_API_KEY = process.env.PEXELS_API_KEY; // Get API key from .env
const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });




async function downloadImage(url, path) {
    const response = await fetch(url);
    const buffer = await response.buffer();
    await fs.promises.writeFile(path, buffer);
}


async function downloadVideo(url, path) {
    const response = await fetch(url);
    const buffer = await response.buffer();
    await fs.promises.writeFile(path, buffer);
}


async function fetchMedia(query) {
    let PEXELS_API_URL;
    let responseType;

    const isFetchingVideo = Math.random() >= 0.5; // Randomly decide between fetching an image or a video

    if (isFetchingVideo) {
        PEXELS_API_URL = 'https://api.pexels.com/v1/videos/search';
        responseType = 'videos';
    } else {
        PEXELS_API_URL = 'https://api.pexels.com/v1/search';
        responseType = 'photos';
    }

    const ITEMS_TO_FETCH = 5;
    const response = await fetch(`${PEXELS_API_URL}?query=${query}&per_page=${ITEMS_TO_FETCH}`, {
        headers: {
            'Authorization': PEXELS_API_KEY
        }
    });

    const data = await response.json();

    if (responseType === 'videos' && data.videos && data.videos.length > 0) {
        const randomVideo = data.videos[Math.floor(Math.random() * data.videos.length)];
        const videoURL = randomVideo.video_files[0].link;

        return {
            type: 'video',
            url: videoURL.startsWith("//") ? `https:${videoURL}` : videoURL
        };

    } else if (data.photos && data.photos.length > 0) {
        const randomImage = data.photos[Math.floor(Math.random() * data.photos.length)];
        return {
            type: 'image',
            url: randomImage.src.large
        };
    } else {
        throw new Error('Failed to fetch media from Pexels.');
    }
}



const hardcodedTweets = [
    "Gabriel Boric en Chile propone reforma tributaria incluyendo impuestos a la riqueza. ¿Qué impacto crees que tendrá en la sociedad? #ReformaTributaria #Chile",
    "La reforma tributaria en Chile busca recaudar 4,1% del PIB en cuatro años. ¿Cómo afectará esto a la economía nacional? #EconomíaChilena #Impuestos",
    "Nueva reforma en Chile se enfoca en tributación para ingresos altos. ¿Crees que esto mejorará la equidad en el país? #JusticiaFiscal #Chile",
    "En Chile, la reforma tributaria propone impuesto a patrimonios mayores a US$ 5 millones. ¿Es esto un paso hacia mayor justicia social? #ImpuestoRiqueza #Chile",
    "Chile establece nuevo régimen tributario para la gran minería. ¿Influirá positivamente en el desarrollo del sector? #Minería #Chile",
    "Reforma en Chile busca aumentar carga tributaria para igualar estándares OCDE. ¿Será efectiva para mejorar servicios públicos? #OCDE #Impuestos",
    "En Chile, la reforma tributaria limita exenciones y combate la evasión fiscal. ¿Mejorará esto la transparencia fiscal? #EvasiónFiscal #Chile",
    "Se espera que la recaudación fiscal en Chile aumente hasta un 4,1% para 2025. ¿Qué cambios anticipas en los servicios públicos? #RecaudaciónFiscal #Chile",
    "Ajustes en IVA y boletas de honorarios afectarán a empresas y trabajadores en Chile. ¿Cómo te preparas para este cambio? #IVA #Chile",
    "Exenciones del IVA en servicios médicos y sociedades profesionales se mantienen en Chile. ¿Beneficiará esto a los profesionales? #ExencionesIVA #Chile",
    "Servicios profesionales en Chile quedarán exentos de IVA bajo ciertas condiciones. ¿Impactará esto en tu actividad profesional? #IVA #ServiciosProfesionales",
    "Todos los servicios en Chile estarán afectos al IVA desde 2023. ¿Cómo crees que esto influirá en la economía? #IVA #EconomíaChilena",
    "La Ley 21.420 en Chile afectará todos los servicios con IVA. ¿Qué estrategias seguirás para adaptarte? #Ley21420 #IVA",
    "En Chile, la Ley mantiene exenciones de IVA para ciertos servicios. ¿Cómo valoras estas excepciones? #IVA #ExencionesFiscales",
    "La reforma tributaria en Chile se enfoca en equidad y justicia. ¿Crees que logrará sus objetivos? #ReformaTributaria #JusticiaSocial",
    "Chile espera que la reforma tributaria atraiga a estructuras fiscales avanzadas. ¿Qué impacto tendrá en la inversión? #EstructuraFiscal #Inversión",
    "Chile implementa exención de IVA para sociedades profesionales. ¿Cómo cambiará esto el panorama fiscal? #ExenciónIVA #Fiscalidad",
    "La nueva regulación sobre sociedades profesionales afectará el IVA en Chile. ¿Qué opinas sobre estas medidas? #RegulaciónFiscal #IVA",
    "Con la Ley 21.420, Chile introduce cambios significativos en el IVA. ¿Cómo adaptarás tu negocio a estos cambios? #Ley21420 #Negocios",
    "La entrada en vigencia de la Ley 21.420 en Chile modificará el IVA. ¿Cuál crees que será el mayor desafío para las empresas? #IVA #DesafíosEmpresariales",


    // ... add more tweets here (up to 20 or more)
];


function getHourlyTweet() {
    const currentHour = new Date().getHours();
    const tweetIndex = currentHour % hardcodedTweets.length;
    return hardcodedTweets[tweetIndex];
}

const tweet = async () => {
    try {
        const tweetContent = getHourlyTweet();
        if (tweetContent) {
            // Fetch the image URL for "AI" topic
            const mediaData = await fetchMedia("pesos, efectivo, dinero, monedas, pesos chilenos, billetes chile, billetes chile, billetes, monedas chile, monedas chilenas, dinero chile, dinero chileno, dinero efectivo, dinero en efectivo, dinero en pesos, dinero en pesos chilenos, dinero en billetes, dinero en monedas, dinero en billetes chilenos, dinero en monedas chilenas, dinero en billetes chile, dinero en monedas ");
            const filename = `ai_media_${Date.now()}`;

            let mediaId;

            if (mediaData.type === "image") {
                const localImagePath = `./media/${filename}.jpg`;
                await downloadImage(mediaData.url, localImagePath);
                mediaId = await twitterClient.v1.uploadMedia(localImagePath);
            } else {
                const localVideoPath = `./media/${filename}.mp4`;
                await downloadVideo(mediaData.url, localVideoPath);
                mediaId = await twitterClient.v1.uploadMedia(localVideoPath);
            }

            await twitterClient.v2.tweet({
                text: tweetContent,
                media: {
                    media_ids: [mediaId]
                }
            });
        } else {
            console.log("Failed to generate a tweet.");
        }
    } catch (e) {
        console.error("Error posting tweet:", e);
    }
};

cron.schedule('0 * * * *', tweet);


console.log("Started scheduler to tweet every hour.");
