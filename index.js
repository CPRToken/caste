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



    "México introduce nuevas regulaciones fiscales para combatir la evasión y promover la transparencia. ¿Qué efectos tendrá en el clima de negocios? #Impuestos #México",

    "Colombia avanza en su plan de reforma tributaria, buscando equidad y justicia fiscal. ¿Cómo cambiará esto el panorama económico? #Tributaria #Chile",

    "Perú implementa medidas para atraer inversión extranjera, con incentivos fiscales y simplificación de procesos. ¿Serán efectivas? #Impuestos #Inversión",

    "Con la Ley 21.420, todos los servicios en Chile se verán afectados por el IVA. ¿Qué estrategias seguirás para adaptarte a estos cambios? ¿Crees que afectará positivamente a la economía? #Chile #Inversión",

    "La Ley en Chile mantiene exenciones de IVA para ciertos servicios. ¿Cómo valoras estas excepciones en términos de justicia fiscal? ¿Crees que benefician a sectores específicos? #Chile #Inversión",

    "La reforma tributaria en Chile se centra en equidad y justicia. ¿Crees que estas medidas lograrán sus objetivos? ¿Qué impacto esperas ver en la sociedad? #ReformaTributaria #JusticiaSocial",

    "Chile espera que la reforma tributaria atraiga estructuras fiscales avanzadas. ¿Qué impacto crees que tendrá esto en la inversión extranjera y en el crecimiento económico? #Chile #Inversión",

    "Chile implementa exención de IVA para sociedades profesionales. ¿Cómo cambiará esto el panorama fiscal del país? ¿Crees que beneficiará a la economía en general? #Chile #Inversión",

    "Chile debate reformas en el sistema de pensiones, con posibles impactos fiscales. ¿Mejorará esto la seguridad social? #Pensiones #Chile",

    "Ecuador anuncia nuevos incentivos fiscales para el sector tecnológico, buscando impulsar la innovación. ¿Cuál será el impacto en la economía digital? #Tecnología #Ecuador",

    "Bolivia refuerza la lucha contra la evasión fiscal, con nuevas regulaciones y controles. ¿Cómo afectará esto a las empresas? #Impuestos #Bolivia",

    "Paraguay se enfoca en la reforma fiscal para mejorar la infraestructura y los servicios públicos. ¿Qué esperas de esta iniciativa? #Paraguay #ReformaFiscal",

    "Guatemala implementa cambios fiscales para mejorar la educación y la salud. ¿Cómo cambiará esto la calidad de vida? #Impuestos #Guatemala",

    "Panamá se destaca por su crecimiento económico, con políticas fiscales orientadas a la inversión y el desarrollo. ¿Qué lecciones ofrece para la región? #Panamá #Economía",

    "Gabriel Boric en Chile propone una reforma tributaria incluyendo impuestos a la riqueza. ¿Qué impacto crees que tendrá esta propuesta en la sociedad y la distribución de la riqueza? ¿Será un paso hacia una mayor justicia social? #ReformaTributaria #Chile",

    "La reforma tributaria en Chile apunta a recaudar 4,1% del PIB en cuatro años, una medida clave en la política fiscal. ¿Cómo crees que esto afectará la economía nacional y el bienestar de los ciudadanos? #EconomíaChilena #Impuestos #Chile",

    "Chile se enfoca en una nueva reforma tributaria, dirigida a la tributación de ingresos altos, buscando mayor equidad. ¿Opinas que esto mejorará la justicia fiscal en el país? ¿Cómo te afectará personalmente? #Justicia #Dinero #Chile",

    "Reforma tributaria en Chile propone impuestos a patrimonios mayores a US$ 5 millones, un paso hacia la justicia social. ¿Crees que esto es suficiente para mejorar la equidad en el país? Comparte tus pensamientos. #Impuestos #Chile",

    "Chile establece un nuevo régimen tributario para la gran minería, buscando un impacto positivo en el sector. ¿Crees que esto beneficiará el desarrollo económico? ¿Cómo influirá esto en el mercado laboral? #Minería #Chile",

    "La reforma en Chile busca igualar los estándares OCDE, aumentando la carga tributaria. ¿Piensas que será efectiva para mejorar los servicios públicos y la calidad de vida? ¿Cuáles son tus expectativas? #OCDE #Impuestos",

    "En Chile, la reforma tributaria limita exenciones y combate la evasión fiscal. ¿Cómo crees que estas medidas mejorarán la transparencia fiscal? ¿Veremos un impacto significativo en la economía? #EvasiónFiscal #Chile",

    "Se espera un aumento en la recaudación fiscal en Chile de hasta 4,1% para 2025. ¿Qué cambios crees que se verán reflejados en los servicios públicos y la infraestructura nacional? #Recaudación #Chile",

    "Ajustes en IVA y boletas de honorarios en Chile podrían afectar significativamente a empresas y trabajadores. ¿Cómo te estás preparando para estos cambios? ¿Crees que serán beneficiosos a largo plazo? #IVA #Chile",

    "En Chile, las exenciones del IVA en servicios médicos y sociedades profesionales se mantienen. ¿Cómo valoras este beneficio para los profesionales del país? ¿Crees que es justo? #ExencionesIVA #Chile",

    "Servicios profesionales en Chile serán exentos de IVA bajo ciertas condiciones desde 2023. ¿Cómo impactará esto en tu actividad profesional y en la economía general? #IVA #ServiciosProfesionales",

    "Desde 2023, todos los servicios en Chile estarán afectos al IVA. ¿Cómo crees que esto influirá en la economía y en el día a día de los ciudadanos? ¿Estás preparado para este cambio? #IVA #EconomíaChilena",

    "Con la Ley 21.420, todos los servicios en Chile se verán afectados por el IVA. ¿Qué estrategias seguirás para adaptarte a estos cambios? ¿Crees que afectará positivamente a la economía? #Ley21420 #IVA",

    "La Ley en Chile mantiene exenciones de IVA para ciertos servicios. ¿Cómo valoras estas excepciones en términos de justicia fiscal? ¿Crees que benefician a sectores específicos? #IVA #ExencionesFiscales",

    "La reforma tributaria en Chile se centra en equidad y justicia. ¿Crees que estas medidas lograrán sus objetivos? ¿Qué impacto esperas ver en la sociedad? #ReformaTributaria #JusticiaSocial",

    "Chile espera que la reforma tributaria atraiga estructuras fiscales avanzadas. ¿Qué impacto crees que tendrá esto en la inversión extranjera y en el crecimiento económico? #EstructuraFiscal #Inversión",

    // ... add more tweets here (up to 20 or more)
];

let currentIndex = 0;

function getNextTweet() {
    const tweet = hardcodedTweets[currentIndex];
    currentIndex = (currentIndex + 1) % hardcodedTweets.length;
    return tweet;
}

const tweet = async () => {
    try {
        const tweetContent = getNextTweet();
        if (tweetContent) {
            // Fetch the image URL for "AI" topic
            const mediaData = await fetchMedia("pesos, efectivo, dinero, monedas, pesos chilenos, oro en Chile, plata, ");
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

cron.schedule('* */1 * * *', tweet);

console.log("Started scheduler to tweet every hour.");


