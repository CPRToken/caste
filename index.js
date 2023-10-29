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



const prompts = [
    "Cómo maximizar tu devolución de impuestos este año?",
    "Qué estrategias financieras puedes usar para aumentar tu devolución de impuestos?",
    "Cómo la Inteligencia Artificial está ayudando en la optimización de la declaración de impuestos?",
    "Cuáles son las herramientas de IA más efectivas para la planificación fiscal?",
    "Cómo la tecnología está cambiando la forma en que hacemos nuestras declaraciones de impuestos?",
    "Qué impacto tiene la legislación fiscal en tus inversiones a largo plazo?",
    "Cómo puedes usar la Inteligencia Artificial para detectar deducciones fiscales que podrías haber pasado por alto?",
    "Cuál es el futuro de la planificación fiscal con el avance de la Inteligencia Artificial?",
    "Cómo están las fintechs ayudando a las personas a manejar sus impuestos de manera más eficiente?",
    "Qué deberías saber sobre las criptomonedas y los impuestos?",
    "Cuáles son las implicaciones fiscales de invertir en bienes raíces?",
    "Cómo puedes prepararte para la temporada de impuestos usando tecnología moderna?",
    "Qué impacto tienen los cambios en las leyes fiscales en los autónomos y freelancers?",
    "Cómo la planificación fiscal inteligente puede mejorar tu bienestar financiero?",
    "Qué papel juega la automatización en la eficiencia de la gestión fiscal?",
    "Cómo elegir un software de impuestos que se adapte a tus necesidades?",
    "Qué consideraciones fiscales debes tener en cuenta al iniciar un nuevo negocio?",
    "Cómo están cambiando las leyes tributarias en Latinoamérica y qué pueden esperar los trabajadores?",
    "Cuáles son las últimas novedades en regulaciones fiscales en Latinoamérica?",
    "Cómo están revolucionando las fintech el sistema tributario en Chile?",
    "Qué papel juegan las políticas fiscales en la formación de empleos del futuro para grandes empresas?",
    "Comparte ideas sobre la relación entre la evasión fiscal y la economía en Latinoamérica.",
    "Cómo impactan las leyes tributarias en el sector salud y médico en Chile?",
    "Cuáles son los riesgos potenciales de no estar al día con los impuestos para las pequeñas empresas?",
    "Cómo están cambiando las leyes tributarias en Latinoamérica y qué pueden esperar los trabajadores?",
    "Discute los impactos de la digitalización en la recaudación de impuestos en la era moderna.",
    "Qué papel juegan las políticas fiscales en la formación de empleos del futuro en Latinoamérica?",
    "Cómo están beneficiando las nuevas leyes fiscales al sistema de salud en Chile?",
    "Describe los beneficios de la digitalización en la gestión tributaria.",
    "Cuál es la intersección entre políticas fiscales y soluciones de energía renovable en Latinoamérica?",
    "Cómo están cambiando las leyes tributarias en Latinoamérica y qué pueden esperar los trabajadores?",
    "Destaca la importancia de la regulación fiscal en el transporte moderno en Chile.",
    "Comparte una perspectiva sobre la automatización impulsada por fintech en contabilidad y seguridad.",
    "Discute el papel de las políticas fiscales en las predicciones del mercado financiero y económico.",
    "Comparte ideas sobre la influencia de la regulación tributaria en el arte y diseño modernos.",
    "¿Reemplazarán las fintech a los contadores? Discute los pros y contras.",
    "Analiza los efectos de la globalización en la economía chilena y su relación con la tributación internacional.",
    "Explora cómo la tecnología blockchain está transformando los procesos fiscales en el mundo empresarial.",
    "Habla sobre los desafíos y beneficios de la digitalización de los registros contables en el sector financiero.",
    "Examina el impacto de la pandemia de COVID-19 en las políticas fiscales y su influencia en la recuperación económica.",
    "Reflexiona sobre las implicaciones económicas de la evasión fiscal y las medidas para combatirla en América Latina.",
    "Comenta sobre la relación entre la sostenibilidad ambiental y las políticas fiscales en la industria energética.",
    "Analiza cómo las criptomonedas están cambiando la forma en que se gravan las transacciones financieras.",
    "Explora el papel de los incentivos fiscales en el fomento de la inversión extranjera directa en países latinoamericanos.",
    "Discute las tendencias actuales en la tributación de la economía digital y su impacto en los ingresos gubernamentales.",
    "Comparte tus ideas sobre cómo la inteligencia artificial está siendo utilizada para mejorar la recaudación de impuestos y la eficiencia fiscal en América Latina."


];
async function getGeneratedTweet() {
    try {
        // Randomly pick a prompt from the prompts array
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

        const response = await openai.completions.create({
            model: "gpt-3.5-turbo-instruct",
            prompt: randomPrompt,
            max_tokens: 300,
            temperature: 0.7
        });

        return response.choices[0].text.trim();
    } catch (error) {
        console.log("Error generating tweet:", error);
    }
}
const appendHashTagsAndMentions = (tweetContent) => {
    return `${tweetContent} #impuestos`
};



const trimToCompleteSentence = (tweet) => {
    if (tweet.length <= 280) return tweet;

    let lastValidEnd = tweet.lastIndexOf('.', 279);
    if (lastValidEnd === -1) lastValidEnd = tweet.lastIndexOf('!', 279);
    if (lastValidEnd === -1) lastValidEnd = tweet.lastIndexOf('?', 279);

    return lastValidEnd !== -1 ? tweet.substring(0, lastValidEnd + 1) : tweet.substring(0, 277) + "...";
};

const tweet = async () => {
    try {
        const tweetContent = await getGeneratedTweet();
        if (tweetContent) {
            const fullTweet = appendHashTagsAndMentions(tweetContent);
            const trimmedTweet = trimToCompleteSentence(fullTweet);

            // 1. Fetch the image URL for "AI" topic
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
                text: trimmedTweet,
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



cron.schedule('0 */2 * * *', tweet);



console.log("Started scheduler to tweet every 2 hours.");
