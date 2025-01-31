const express       = require('express')
const swaggerJsdoc  = require('swagger-jsdoc')
const swaggerUi     = require('swagger-ui-express')
const yargs         = require('yargs')
const axios         = require('axios')
const cheerio       = require('cheerio')
const proxy         = require('https-proxy-agent')
const iconv         = require('iconv-lite')
const xml2js        = require('xml2js')
const path          = require('path')
const fs            = require('fs')

// Прочитать содержимое файла с категориями
const categoryList = JSON.parse(fs.readFileSync(path.join(__dirname, 'category.json'), 'utf-8'))

// Параметры запуска
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv))
    .option('port', {
        alias: 'p',
        type: 'number',
        default: 8443,
        description: 'Express server port'
    })
    .option('test', {
        alias: 't',
        type: 'boolean',
        default: false,
        description: 'Test endpoints and stop server'
    })
    .option('query', {
        alias: 'q',
        type: 'string',
        default: 'The+Rookie',
        description: 'Title for test'
    })
    .option('proxyAddress', {
        type: 'string',
        description: 'Address proxy server'
    })
    .option('proxyPort', {
        type: 'number',
        description: 'Port proxy server'
    })
    .option('username', {
        type: 'string',
        description: 'Username for proxy server'
    })
    .option('password', {
        type: 'string',
        description: 'Password for proxy server'
    })
    .argv

// Использовать Puppeteer для получения списка файлов
// const puppeteer       = require('puppeteer')
const RuTrackerPuppeteer = false
const RuTorPuppeteer     = false

// Создание экземпляра Axios с использованием конфигурации Proxy
const createAxiosProxy = () => {
    const config = {}
    if (argv.proxyAddress && argv.proxyPort) {
        if (argv.username && argv.password) {
            config.httpsAgent = new proxy.HttpsProxyAgent(`http://${argv.username}:${argv.password}@${argv.proxyAddress}:${argv.proxyPort}`)
        } else {
            config.httpsAgent = new proxy.HttpsProxyAgent(`http://${argv.proxyAddress}:${argv.proxyPort}`)
        }
    }
    return axios.create(config)
}
const axiosProxy = createAxiosProxy()

// Имя агента в заголовке запросов (вместо axios)
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

// Cookie для автроризации на сайте RuTracker (требуется для получения info hash списка файлов)
const headers_RuTracker = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Cookie': 'bb_session=0-44590272-Sp8wQfjonpx37QjDuZUD'
}

// Cookie для автроризации на сайте Kinozal (требуется для получения info hash списка файлов)
const headers_Kinozal = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0 Win64 x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Cookie': 'uid=20631917; pass=KOJ4DJf1VS'
}

// Функция получения текущего времени для логирования
function getCurrentTime() {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
}

// Функция преобразования номера страницы (для RuTracker и NoNameClub)
function getPage(page) {
    const pages = {
        '0': '0',
        '1': '50',
        '2': '100',
        '3': '150',
        '4': '200',
        '5': '250',
        '6': '300',
        '7': '350',
        '8': '400',
        '9': '450',
        '10': '500',
        '11': '550',
        '12': '600',
        '13': '650',
        '14': '700',
        '15': '750',
        '16': '800',
        '17': '850',
        '18': '900',
        '19': '950',
        '20': '1000'
    }
    return pages[page]
}

// Функция преобразования времени в формат 'dd.mm.yyyy' (для RuTracker и RuTor)
function formatDate(dateString, type) {
    const months = {
        'Янв': '01',
        'Фев': '02',
        'Мар': '03',
        'Апр': '04',
        'Май': '05',
        'Июн': '06',
        'Июл': '07',
        'Авг': '08',
        'Сен': '09',
        'Окт': '10',
        'Ноя': '11',
        'Дек': '12'
    }
    const parts = dateString.split(`${type}`)
    let day = parts[0].trim()
    const month = months[parts[1].trim()]
    const year = '20' + parts[2].trim()
    // Добавляем ведущий ноль к дню
    if (day.length === 1) {
        day = '0' + day
    }
    return `${day}.${month}.${year}`
}

// Функция преобразования времени из Unix Timestamp в 'dd.mm.yyyy HH:MM' (для NoNameClub)
function unixTimestamp(timestamp) {
    const date = new Date(timestamp * 1000)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}.${month}.${year} ${hours}:${minutes}`
}

// Функция для добавления списка торрент трекеров в магнитную ссылку
function addTrackerList(infoHash, tracker) {
    let magnetLink = `magnet:?xt=urn:btih:${infoHash}`
    let trackers = []
    if (tracker === "RuTracker") {
        trackers = [
            "http://retracker.local/announce",
            "http://bt.t-ru.org/ann",
            "http://bt2.t-ru.org/ann",
            "http://bt3.t-ru.org/ann",
            "http://bt4.t-ru.org/ann"
        ]
    }
    else if (tracker === "Kinozal") {
        trackers = [
            "http://retracker.local/announce",
            "http://tr0.torrent4me.com/ann?uk=kCm7WcIM00",
            "http://tr1.torrent4me.com/ann?uk=kCm7WcIM00",
            "http://tr2.torrent4me.com/ann?uk=kCm7WcIM00",
            "http://tr3.torrent4me.com/ann?uk=kCm7WcIM00",
            "http://tr4.torrent4me.com/ann?uk=kCm7WcIM00",
            "http://tr5.torrent4me.com/ann?uk=kCm7WcIM00",
            "http://tr0.tor4me.info/ann?uk=kCm7WcIM00",
            "http://tr1.tor4me.info/ann?uk=kCm7WcIM00",
            "http://tr2.tor4me.info/ann?uk=kCm7WcIM00",
            "http://tr3.tor4me.info/ann?uk=kCm7WcIM00",
            "http://tr4.tor4me.info/ann?uk=kCm7WcIM00",
            "http://tr5.tor4me.info/ann?uk=kCm7WcIM00",
            "http://tr0.tor2me.info/ann?uk=kCm7WcIM00",
            "http://tr1.tor2me.info/ann?uk=kCm7WcIM00",
            "http://tr2.tor2me.info/ann?uk=kCm7WcIM00",
            "http://tr3.tor2me.info/ann?uk=kCm7WcIM00",
            "http://tr4.tor2me.info/ann?uk=kCm7WcIM00",
            "http://tr5.tor2me.info/ann?uk=kCm7WcIM00"
        ]
    }
    else if (tracker === "RuTor") {
        trackers = [
            "http://retracker.local/announce",
            "udp://opentor.net:6969",
            "udp://open.stealth.si:80/announce",
            "udp://exodus.desync.com:6969/announce",
            "http://tracker.grepler.com:6969/announce",
            "udp://tracker.dler.com:6969/announce",
            "udp://tracker.bitsearch.to:1337/announce",
            "http://h1.trakx.nibba.trade:80/announce",
            "http://h2.trakx.nibba.trade:80/announce",
            "http://h3.trakx.nibba.trade:80/announce",
            "http://h4.trakx.nibba.trade:80/announce",
            "http://h5.trakx.nibba.trade:80/announce"
        ]
    }
    else if (tracker === "NoNameClub") {
        trackers = [
            "http://retracker.local/announce",
            "http://bt01.nnm-club.info:2710/announce",
            "http://bt02.nnm-club.info:2710/announce",
            "http://bt01.nnm-club.cc:2710/announce",
            "http://bt02.nnm-club.cc:2710/announce"
        ]
    }
    for (var i = 0; i < trackers.length; i++) {
        magnetLink += "&tr=" + encodeURIComponent(trackers[i])
    }
    return magnetLink
}

// RuTracker
async function RuTracker(query, categoryId, page) {
    if (query === 'undefined') {
        query = ''
    }
    // Получаем кастомный номер страницы через функцию (кратный 50)
    const p = getPage(page)
    // Список все зеркальных URL провайдера для перебора в цикле в случае недоступности одного
    const urls = [
        'https://rutracker.org',
        'https://rutracker.net',
        'https://rutracker.nl'
    ]
    // Переменная для отслеживания успешного выполнения запроса
    let checkUrl = false
    const torrents = []
    let html
    let url
    for (let i = 0; i < urls.length; i++) {
        url = urls[i]
        urlQuery = `${urls[i]}/forum/tracker.php?nm=${query}&f=${categoryId}&start=${p}`
        try {
            const response = await axiosProxy.get(urlQuery, {
                timeout: 3000,
                responseType: 'arraybuffer',
                headers: headers_RuTracker
            })
            // Декодируем HTML-страницу в кодировку win-1251
            html = iconv.decode(response.data, 'win1251')
            // Если удалось получить данные, фиксируем успух, логируем и выходим из цикла
            checkUrl = true
            console.log(`${getCurrentTime()} [Request] ${urlQuery}`)
            break
        } catch (error) {
            console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        }
    }
    if (!checkUrl) {
        return { 'Result': `Server is not available` }
    }
    const data = cheerio.load(html)
    data('table .forumline tbody tr').each((_, element) => {
        const checkData = data(element).find('.row4 .wbr .med').text().trim()
        if (checkData.length > 0) {
            const torrent = {
                'Name': data(element).find('.row4 .wbr .med').text().trim(),
                'Id': parseInt(data(element).find('.row4 .wbr .med').attr('href').replace(/.+t=/g, ''), 10),
                'Url': `${url}/forum/` + data(element).find('.row4 .wbr .med').attr('href'),
                'Torrent': `${url}/forum/dl.php?t=` + data(element).find('.row4 .wbr .med').attr('href').replace(/.+t=/g, ''),
                // Забираем первые два значения (размер и тип данных)
                /// 'Size': data(element).find('.row4.small:eq(0)').text().trim().split(' ').slice(0,1).join(' '),
                'Size': data(element).find('a.small.tr-dl.dl-stub').text().trim().split(' ').slice(0, 1).join(' '),
                'Download_Count': data(element).find('td.row4.small.number-format').text().trim(),
                // Проверяем проверенный ли торрент и изменяем формат вывода
                'Checked': data(element).find('td.row1.t-ico').text().trim() === '√' ? 'True' : 'False',
                // 'Type_Link': `${url}/forum/` + data(element).find('.row1 .f-name .gen').attr('href'),
                'Category': data(element).find('.row1 .f-name .gen').text().trim(),
                'Seeds': data(element).find('b.seedmed').text().trim(),
                'Peers': data(element).find('td.row4.leechmed.bold').text().trim(),
                // Заменяем все символы пробела на обычные пробелы и форматируем дату (передаем пробел вторым параметром разделителя)
                'Date': formatDate(
                    data(element).find('td.row4 p').text().trim().replace(/(\d{1,2}-[А-Яа-я]{3}-\d{2}).*/, '$1'),
                    "-"
                )
            }
            torrents.push(torrent)
        }
    })
    if (torrents.length === 0) {
        return { 'Result': 'No matches were found for your title' }
    } else {
        return torrents
    }
}

// RuTracker All Page
async function RuTrackerAllPage(query, categoryId) {
    let result = []
    page = 0
    while (true) {
        let currentResult = await RuTracker(query, categoryId, page)
        if (Array.isArray(currentResult)) {
            currentResult.forEach(element => {
                result.push(element)
            })
        } else {
            result = [{ 'Result': 'No matches were found for your title' }]
            break
        }
        // Максимум 10 страниц
        if (currentResult.length === 50 && page < 9) {
            page++
        }
        else {
            break
        }
    }
    return result
}

// RuTracker ID
async function RuTrackerID(query) {
    const url = `https://rutracker.org/forum/viewtopic.php?t=${query}`
    let html
    try {
        const response = await axiosProxy.get(url, {
            responseType: 'arraybuffer',
            headers: headers_RuTracker
        })
        html = iconv.decode(response.data, 'win1251')
        console.log(`${getCurrentTime()} [Request] ${url}`)
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `The ${error.hostname} server is not available` }
    }
    const data = cheerio.load(html)
    let Name = data('a#topic-title').text().trim()
    // Hash
    let Hash = data('a[href*="magnet:?xt=urn:btih:"]').attr('href').replace(/.+btih:|&.+/g, '')
    // Получение ссылки на загрузку торрент файла (по поиску части содержимого атрибута и по классу необходимы Cookie)
    // let Torrent = data('a[href*="dl.php?t="]').attr('href')
    // let Torrent = data('a.dl-stub.dl-link.dl-topic').attr('href')
    let Torrent = `https://rutracker.org/forum/dl.php?t=${query}`
    // IMDb
    let imdb
    data('a[href*="imdb.com"]').each((index, element) => {
        const href = data(element).attr('href')
        if (href.includes('imdb.com')) {
            imdb = href
            return false
        }
    })
    if (!imdb) {
        imdb = ""
    }
    // Kinopoisk
    let kp
    data('a[href*="kinopoisk.ru"]').each((index, element) => {
        const href = data(element).attr('href')
        if (href.includes('kinopoisk.ru')) {
            kp = href
            return false
        }
    })
    if (!kp) {
        kp = ""
    }
    // Год выпуска
    const Year = (() => {
        const element = data('span.post-b:contains("Год")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Страна
    let Release = (() => {
        const element = data('span.post-b:contains("Страна")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Жанр
    const Type = (() => {
        const element = data('span.post-b:contains("Жанр")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Продолжительность
    const Duration = (() => {
        const element = data('span.post-b:contains("Продолжительность")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Перевод
    const Audio = (() => {
        const element = data('span.post-b:contains("Перевод")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Режиссёр
    const Directer = (() => {
        const element = data('span.post-b:contains("Режиссёр")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // В ролях
    const Actors = (() => {
        const element = data('span.post-b:contains("В ролях")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Описание
    const Description = (() => {
        const element = data('span.post-b:contains("Описание")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Качество
    const videoQuality = (() => {
        const element = data('span.post-b:contains("Качество")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Видео
    const Video = (() => {
        const element = data('span.post-b:contains("Видео")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Постер
    let Poster = ''
    const posterElement = data('.postImg.postImgAligned.img-right').attr('title')
    if (posterElement && posterElement.length) {
        Poster = posterElement
    }
    // Получаем список файлов
    let torrents = []
    // Puppeteer
    if (RuTrackerPuppeteer == true) {
        torrents = await RuTrackerFilesPuppetter(query)
    } else {
        const urlFiles = 'https://rutracker.org/forum/viewtorrent.php'
        const postData = `t=${query}`
        try {
            const response = await axiosProxy.post(urlFiles, postData, {
                responseType: 'arraybuffer',
                headers: headers_RuTracker
            })
            html = iconv.decode(response.data, 'win1251')
            console.log(`${getCurrentTime()} [Request] ${urlFiles} (RuTracker Files)`)
        } catch (error) {
            console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
            return { 'Result': `The ${error.hostname} server is not available` }
        }
        const dataFiles = cheerio.load(html)
        dataFiles('ul.ftree > li.dir > ul > li').each((index, element) => {
            const fileName = dataFiles(element).find('b').text().trim()
            const fileSize = dataFiles(element).find('i').text().trim()
            torrents.push({
                Name: fileName,
                Size: fileSize
            })
        })
    }
    return [
        {
            Name: Name,
            Url: url,
            Hash: Hash,
            Magnet: addTrackerList(Hash,"RuTracker"),
            Torrent: Torrent,
            IMDb_link: imdb,
            Kinopoisk_link: kp,
            IMDb_id: imdb.replace(/[^0-9]/g, ''),
            Kinopoisk_id: kp.replace(/[^0-9]/g, ''),
            Year: Year.replace(/:\s/g, ''),
            Release: Release.replace(/:\s/g, ''),
            Type: Type.replace(/:\s/g, ''),
            Duration: Duration.replace(/:\s/g, '').replace(/~ |~/g, ''),
            Audio: Audio.replace(/:\s/g, ''),
            Directer: Directer.replace(/:\s/g, ''),
            Actors: Actors.replace(/:\s/g, ''),
            Description: Description.replace(/:\s/g, ''),
            Quality: videoQuality.replace(/:\s/g, ''),
            Video: Video.replace(/:\s/g, ''),
            Poster: Poster,
            Files: torrents
        }
    ]
}

async function RuTrackerFilesPuppetter(query) {
    const torrents = []
    const url = `https://rutracker.org/forum/viewtopic.php?t=${query}`
    const launchOptions = {
        // Скрыть отображение браузера (по умолчанию)
        headless: true,
        // Опции запуска браузера без песочницы, которая изолирует процессы от операционной системы (для работы через Docker)
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-quic'
        ]
    }
    // Добавляем Proxy в конфигурацию запуска браузера
    if (argv.proxyAddress && argv.proxyPort) {
        launchOptions.args.push(`--proxy-server=http://${argv.proxyAddress}:${argv.proxyPort}`)
    }
    // Запускаем браузер
    const browser = await puppeteer.launch(launchOptions)
    // Открываем новую пустую страницу
    const page = await browser.newPage()
    // Авторизация в Proxy
    if (argv.username && argv.password) {
        await page.authenticate({
            username: argv.username,
            password: argv.password
        })
    }
    // Устанавливаем Cookie
    const cookies = [
        { name: 'bb_session', value: '0-44590272-Sp8wQfjonpx37QjDuZUD', domain: '.rutracker.org', path: '/' }
    ]
    for (const cookie of cookies) {
        await page.setCookie(cookie)
    }
    // Открываем страницу
    // await page.goto(`https://rutracker.org/forum/viewtopic.php?t=6489937`, {timeout: 60000, waitUntil: 'domcontentloaded'})
    await page.goto(url, {
        // Ожиданием загрузку страницы 60 секунд
        timeout: 60000,
        // Ожидать только полной загрузки DOM (не ждать загрузки внешних ресурсов, таких как изображения, стили и скрипты)
        waitUntil: 'domcontentloaded'
    })
    // Ожидаем загрузку кнопки на странице
    await page.waitForSelector('.lite')
    // Метод выполнения JavaScript в контексте страницы браузера
    await page.evaluate(() => {
        // Находим кнопку по пути JavaScript (по id) и нажимаем на нее
        document.querySelector("#tor-filelist-btn").click()
        // Находим все кпноки (по классу или id)
        // const buttons = document.querySelectorAll('.lite')
        // const buttons = document.querySelectorAll('#tor-filelist-btn')
        // Проходимся по найденным кнопкам
        // buttons.forEach(button => {
        //     // Проверяем, содержит ли кнопка текст "Список файлов" и нажимаем на нее
        //     if (button.textContent.includes('Список файлов')) {
        //         button.click()
        //     }
        // })
    })
    // Дожидаемся загрузки нового элемента
    // const elementHandle = await page.waitForSelector('#tor-filelist')
    // Находим элемент с идентификатором #tor-filelist или по классу .med.ftree-windowed
    await page.waitForFunction(() => {
        // Первый аргумент функция с условием, которая должна вернуть true
        const element = document.querySelector('#tor-filelist')
        // Проверяем, что элемент существует и его содержимое не содержит текст загрузки
        return element && !element.textContent.includes("загружается...")
    },
        // Опции
        {
            // Ожидать результат 30 секунд (по умолчанию)
            timeout: 30000,
            // Проверка каждые 50мс (по умолчанию 100мс)
            polling: 50
        })
    // После успешной проверки возвращаем результат, используя метод textContent, innerText (массив) или innerHTML (включая HTML-разметку внутри элемента) или null
    const elementTable = await page.evaluate(() => {
        const element = document.querySelector('#tor-filelist')
        return element ? element.innerHTML : null
    })
    // Закрываем браузер
    await browser.close()
    // Заполняем массив
    const dataFiles = cheerio.load(elementTable)
    dataFiles('li.file').each((index, element) => {
        const fileName = dataFiles(element).find('b').text().trim()
        const fileSize = dataFiles(element).find('s').text().trim()
        torrents.push({
            Name: fileName,
            Size: fileSize
        })
    })
    return torrents
}

// RuTracker RSS Native
async function RuTrackerRSS(typeData, categoryId) {
    const url = `https://feed.rutracker.cc/atom/f/${categoryId}.atom`
    console.log(`${getCurrentTime()} [Request] ${url}`)
    try {
        const response = await axiosProxy.get(url, {
            headers: headers
        })
        if (typeData === "json") {
            const parser = new xml2js.Parser({
                mergeAttrs: true,
                explicitArray: false
            })
            let json = await parser.parseStringPromise(response.data)
            // Вытаскиваем только item (entry) для json
            json = json.feed.entry.map(item => ({
                id: item.id,
                link: item.link.href,
                updated: item.updated,
                title: item.title,
                author: item.author.name,
                author: item.author.name,
                category: item.category.term,
                categoryLable: item.category.label
            }))
            return json
        } else {
            return response.data
        }
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `Server is not available` }
    }
}

// Kinozal
async function Kinozal(query, categoryId, page, year, format) {
    if (query === 'undefined') {
        query = ''
    }
    const urls = [
        'https://kinozal.tv',
        'https://kinozal.me',
        'https://kinozal.guru'
    ]
    let checkUrl = false
    const torrents = []
    let html
    let url
    for (const u of urls) {
        url = u.replace('https://','')
        const urlQuery = `${u}/browse.php?s=${query}&page=${page}&c=${categoryId}&d=${year}&v=${format}`
        try {
            const response = await axiosProxy.get(urlQuery, {
                timeout: 3000,
                responseType: 'arraybuffer',
                headers: headers
            })
            html = iconv.decode(response.data, 'win1251')
            checkUrl = true
            console.log(`${getCurrentTime()} [Request] ${urlQuery}`)
            break
        } catch (error) {
            console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        }
    }
    if (!checkUrl) {
        return { 'Result': `Server is not available` }
    }
    // Загружаем HTML-страницу с помощью Cheerio
    const data = cheerio.load(html)
    // Поиск таблицы с классом (.) t_peer, его дочернего элемента tbody и вложенных tr для перебора строк таблицы и извлечения данных из каждой строки
    data('.t_peer tbody tr').each((_, element) => {
        // Проверяем, что элемент с названием не пустой (пропустить первый элемент наименование столбцов)
        const checkData = data(element).find('.nam a')
        if (checkData.length > 0) {
            // Ищем дочерний элемент с классом 'nam' и его вложенным элементом 'a'
            torrentName = data(element).find('.nam a')
            // Забираем текст заголовка и разбиваем его на массив
            const Title = torrentName.text().trim()
            const arrTitle = Title.split(" / ")
            // Получаем количество элементов в заголовке
            // const count = arrTitle.length
            // +++ Анализ заголовка
            // Забираем все элементы 's'
            const s = data(element).find('.s')
            // Забираем дату из 3-его элемента 's'
            const sDate = s.eq(2).text().trim() // сейчас || сегодня в 15:17 || вчера в 23:51 || 06.10.2024 в 19:47
            // Разбиваем дату на массив
            const dateArray = sDate.split(" ")
            let date
            let time
            // Получаем текущую дату и время
            const today = new Date()
            let currentDay = String(today.getDate()).padStart(2, '0')
            let currentMonth = String(today.getMonth() + 1).padStart(2, '0') // Месяцы начинаются с 0
            let currentYear = today.getFullYear()
            // Проверяем и обновляем дату и время до формата dd.mm.yyyy и hh:mm
            if (dateArray.includes('сейчас')) {
                date = `${currentDay}.${currentMonth}.${currentYear}`
                time = `${today.getHours()}:${today.getMinutes()}`
            }
            // Получаем текущую дату и вытаскиваем время из массива
            else if (dateArray.includes('сегодня')) {
                date = `${currentDay}.${currentMonth}.${currentYear}`
                time = dateArray[2]
            }
            // Вычитаем один день
            else if (dateArray.includes('вчера')) {
                today.setDate(today.getDate() - 1)
                currentDay = String(today.getDate()).padStart(2, '0')
                currentMonth = String(today.getMonth() + 1).padStart(2, '0')
                currentYear = today.getFullYear()
                date = `${currentDay}.${currentMonth}.${currentYear}`
                time = dateArray[2]
            }
            else {
                date = dateArray[0]
                time = dateArray[2]
            }
            // Получем жанр по type id
            const categoryGetId = data(element).find("td.bt img")?.attr("onclick")?.match(/\d+/)[0]
            // Получаем название жанра по id через индекс массива
            const category = categoryList.Kinozal[categoryGetId]
            // Заполняем новый временный массив
            const torrent = {
                // Заполняем параметры из заголовка
                'Name': Title.trim(),
                'Title': arrTitle[0].trim(),
                'Id': parseInt(torrentName.attr('href').replace(/.+id=/, ''), 10),
                'Original_Name': arrTitle[1]?.trim() || '',
                'Year': arrTitle[2]?.trim() || '',
                'Language': arrTitle[3]?.trim() || '',
                'Format': arrTitle[4]?.trim() || '',
                'Url': `https://${url}` + torrentName.attr('href'),
                'Torrent': `https://dl.${url}` + data(element).find('.nam a').attr('href').replace(/details/, 'download'),
                // Обновить наименования едениц измерений на англ.
                'Size': s.eq(1).text().trim().replace(/КБ/g, 'KB').replace(/ГБ/g, 'GB').replace(/МБ/g, 'MB'),
                'Comments': s.eq(0).text().trim(),
                'Category': category,
                'Seeds': data(element).find('.sl_s').text().trim(),
                'Peers': data(element).find('.sl_p').text().trim(),
                'Time': time,
                'Date': date
            }
            torrents.push(torrent)
        }
    })
    if (torrents.length === 0) {
        return { 'Result': 'No matches were found for your title' }
    } else {
        return torrents
    }
}

// Kinozal All Page
async function KinozalAllPage(query, categoryId, year, format) {
    let result = []
    page = 0
    while (true) {
        let currentResult = await Kinozal(query, categoryId, page, year, format)
        if (Array.isArray(currentResult)) {
            currentResult.forEach(element => {
                result.push(element)
            })
        } else {
            result = [{ 'Result': 'No matches were found for your title' }]
            break
        }
        // Максимум 100 страниц
        if (currentResult.length === 50 && page < 99) {
            page++
        }
        else {
            break
        }
    }
    return result
}

// Kinozal ID
async function KinozalID(query) {
    const url = `https://kinozal.tv/details.php?id=${query}`
    const torrents = []
    let html
    try {
        const response = await axiosProxy.get(url, {
            responseType: 'arraybuffer',
            headers: headers
        })
        html = iconv.decode(response.data, 'win1251')
        console.log(`${getCurrentTime()} [Request] ${url}`)
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `The ${error.hostname} server is not available` }
    }
    const data = cheerio.load(html)
    // Hash and files
    const url_get_srv_details = `https://kinozal.tv/get_srv_details.php?id=${query}&action=2`
    let html2
    try {
        const response = await axiosProxy.get(url_get_srv_details, {
            responseType: 'arraybuffer',
            headers: headers_Kinozal
        })
        html2 = iconv.decode(response.data, 'utf8')
        console.log(`${getCurrentTime()} [Request] ${url}`)
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `The ${error.hostname} server is not available` }
    }
    dataFiles = cheerio.load(html2)
    // Files
    const torrentFiles = []
    dataFiles('div.treeview ul li').each((index, element) => {
        const fileName = dataFiles(element).text().trim()
        // Получаем текст из дочернего элемента <i>
        const fileSize = dataFiles(element).find('i').text().trim()
        torrentFiles.push({
            // Удаляем размер из названия (разбиваем на массив, удаляем последние 3 элемента и объединяем обратно)
            Name: fileName.split(' ').slice(0, -3).join(' '),
            // Удаляем байты
            Size: fileSize.replace(/ \(.+/, '')
        })
    })
    // Проверяем количество элементов в массиве
    if (torrentFiles.length == 0) {
        dataFiles('div.b.ing').each((index, element) => {
            const fileName = dataFiles(element).text().trim()
            const fileSize = dataFiles(element).find('i').text().trim()
            torrentFiles.push({
                Name: fileName.split(' ').slice(0, -3).join(' '),
                Size: fileSize.replace(/ \(.+/, '')
            })
        })
    }
    // IMDb
    let imdb
    data('a[href*="imdb.com"]').each((index, element) => {
        const href = data(element).attr('href')
        if (href.includes('imdb.com')) {
            imdb = href
            return false
        }
    })
    if (!imdb) {
        imdb = ""
    }
    // Kinopoisk
    let kp
    data('a[href*="kinopoisk.ru"]').each((index, element) => {
        const href = data(element).attr('href')
        if (href.includes('kinopoisk.ru')) {
            kp = href
            return false
        }
    })
    if (!kp) {
        kp = ""
    }
    let Hash = dataFiles('li').eq(0).text().replace(/.+:/, '').trim()
    // Постер
    let Poster = ''
    const posterElement = data('div.content > div.mn_wrap > div.mn1_menu > ul > li > a > img').attr('src')
    if (posterElement && posterElement.length) {
        // Проверка на внешний или внутренний источник постера
        if (posterElement.startsWith('http')) {
            Poster = posterElement
        } else {
            Poster = 'https://kinozal.tv' + posterElement
        }
    }
    // Массив из внешних постеров
    const url_posters = `https://kinozal.tv/get_srv_details.php?id=${query}&pagesd=2`
    let Posters = []
    let html3
    try {
        const response = await axiosProxy.get(url_posters, {
            responseType: 'arraybuffer',
            headers: headers_Kinozal
        })
        html3 = iconv.decode(response.data, 'utf8')
        console.log(`${getCurrentTime()} [Request] ${url}`)
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `The ${error.hostname} server is not available` }
    }
    let dataPosters = cheerio.load(html3)
    // dataPosters('a').attr('href')
    // Перебрать все элементы с тэгом 'a' для получения значения их атрибута 'href'
    dataPosters('a').each((index, element) => {
        const href = dataPosters(element).attr('href')
        if (href) {
            Posters.push(href)
        }
    })
    // Заполняем массив
    const torrent = {
        'Name': (() => {
            const element = data('div.mn1_content .bx1 b:contains("Название:")')[0]
            if (element) {
                const nextNode = element.nextSibling
                return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
            } else {
                return ''
            }
        })(),
        'Original_Name': (() => {
            // Обращаемся к элементу b по наименованию контейнера
            const element = data('div.mn1_content .bx1 b:contains("Оригинальное название:")')[0]
            // Проверяем наличие контейнера (что оно не является null или undefined)
            if (element) {
                // Свойство DOM, которое возвращает следующий узел после элемента <b>
                const nextNode = element.nextSibling
                // Используем тернарный оператор, проверяем, что nextNode не является null или undefined и тип узла равен текстовому значению DOM
                return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : '' // Возвращаем текстовое содержимое узла или пустое значение
            } else {
                return ''
            }
        })(),
        'Url': url,
        'Hash': Hash,
        'Magnet': addTrackerList(Hash,"Kinozal"),
        'Torrent': `https://dl.kinozal.tv/download.php?id=${query}`,
        'IMDb_link': imdb,
        'Kinopoisk_link': kp,
        'IMDB_id': imdb.replace(/[^0-9]/g, ''),
        'Kinopoisk_id': kp.replace(/[^0-9]/g, ''),
        // Находим нужный контейнер который содержит год выпуска и забираем текстовое значение следующего узла
        'Year': data('div.mn1_content .bx1 b:contains("Год выпуска:")')[0]?.nextSibling?.nodeValue?.trim() || '',
        'Type': data('div.mn1_content').find('.lnks_tobrs').eq(0)?.text()?.trim() || '',
        'Release': data('div.mn1_content').find('.lnks_tobrs').eq(1)?.text()?.trim() || '',
        'Directer': data('div.mn1_content').find('.lnks_toprs').eq(0)?.text()?.trim() || '',
        'Actors': data('div.mn1_content').find('.lnks_toprs').eq(1)?.text()?.trim() || '',
        // 'Description': data('div.mn1_content').find('.bx1.justify:eq(2) p b').eq(0)[0].nextSibling.nodeValue.trim(),
        'Description': data('div#main div.content div.mn_wrap div.mn1_content div.bx1.justify p')
            ?.clone()       // Клонируем элемент, чтобы не модифицировать исходный
            ?.children('b') // Выбираем все дочерние элементы 'b'
            ?.remove()      // Удаляем их
            ?.end()         // Возвращаемся к исходному элементу
            ?.text().trim() || '',
        'Quality': data('div.mn1_content').find('.justify.mn2.pad5x5 b').eq(0)[0]?.nextSibling?.nodeValue?.trim() || '',
        'Video': data('div.mn1_content').find('.justify.mn2.pad5x5 b').eq(1)[0]?.nextSibling?.nodeValue?.trim() || '',
        'Audio': data('div.mn1_content').find('.justify.mn2.pad5x5 b').eq(2)[0]?.nextSibling?.nodeValue?.trim() || '',
        'Size': data('div.mn1_content').find('.justify.mn2.pad5x5 b').eq(3)[0]?.nextSibling?.nodeValue?.trim() || '',
        // 'Size': data('div.mn1_menu').find('span.floatright.green.n').eq(0).text().replace(/\(.+/, '').trim(),
        'Duration': data('div.mn1_content').find('.justify.mn2.pad5x5 b').eq(4)[0]?.nextSibling?.nodeValue?.trim() || '',
        'Transcript': data('div.mn1_content').find('.justify.mn2.pad5x5 b').eq(5)[0]?.nextSibling?.nodeValue?.trim() || '',
        'Seeds': data('div.mn1_menu').find('span.floatright').eq(0)?.text()?.trim() || '',
        'Peers': data('div.mn1_menu').find('span.floatright').eq(1)?.text()?.trim() || '',
        'Download_Count': data('div.mn1_menu').find('span.floatright').eq(2)?.text()?.trim() || '',
        'Files_Count': data('div.mn1_menu').find('span.floatright').eq(3)?.text()?.trim() || '',
        'Comments': data('div.mn1_menu').find('span.floatright').eq(4)?.text()?.trim() || '',
        'IMDb_Rating': data('div.mn1_menu').find('span.floatright').eq(5)?.text()?.trim() || '',
        'Kinopoisk_Rating': data('div.mn1_menu').find('span.floatright').eq(6)?.text()?.trim() || '',
        'Kinozal_Rating': data('div.mn1_menu').find('span.floatright').eq(7)?.text()?.trim().replace(/\s.+/, '') || '',
        'Votes': data('div.mn1_menu').find('span.floatright').eq(8)?.text()?.trim() || '',
        'Added_Date': data('div.mn1_menu').find('span.floatright.green.n').eq(1)?.text()?.trim() || '',
        'Update_Date': data('div.mn1_menu').find('span.floatright.green.n').eq(2)?.text()?.trim() || '',
        'Poster': Poster,
        'Posters': Posters,
        'Files': torrentFiles
    }
    torrents.push(torrent)
    if (torrents.length === 0) {
        return { 'Result': 'No matches were found for your title' }
    } else {
        return torrents
    }
}

// Kinozal RSS Custom (через основную функцию)
async function KinozalRssCustom(typeData, categoryId, year, format) {
    const dataKinozal = await Kinozal('', categoryId, 0, year, format)
    const torrents = []
    if (dataKinozal.length === 50) {
        dataKinozal.forEach(element => {
            let dateArray = element.Date.split('.')
            let time = element.Time
            // Получаем формат: YYYY-MM-DDTHH:MM:SS+00:00
            let updateDate = `${dateArray[2]}-${dateArray[1]}-${dateArray[0]}T${time}:00+00:00`
            const torrent = {
                'date': updateDate,
                'title': element.Name,
                'category': element.Category,
                'link': element.Url ,
                'downloadLink': element.Torrent,
                'size': element.Size,
                'comments': element.Comments,
                'seeds': element.Seeds,
                'peers': element.Peers
            }
            torrents.push(torrent)
        })
    }
    // Получаем параметр описания по категории
    let description = 'Раздачи на главной торрент трекера'
    if (
        (categoryId >= 0 && categoryId <= 24) || // 0-24
        (categoryId === 32) ||
        (categoryId === 35) ||
        (categoryId === 37) ||
        (categoryId === 38) ||
        (categoryId === 39) ||
        (categoryId >= 40 && categoryId <= 50) || // 40-50
        (categoryId >= 1001 && categoryId <= 1006) // 1001-1006
    ) {
        description = categoryList.Kinozal[categoryId]
    }
    if (torrents.length === 0) {
        return { 'Result': `Server is not available` }
    } else {
        if (typeData === "json") {
            return torrents
        } else {
            const builder = new xml2js.Builder()
            const rss = {
                rss: {
                  $: {
                    version: '2.0'
                  },
                  channel: {
                    title: 'Торрент трекер Кинозал',
                    link: 'https://kinozal.tv',
                    description: description,
                    language: 'ru-ru',
                    pubDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toUTCString().replace('GMT', '+0300'),
                    lastBuildDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toUTCString().replace('GMT', '+0300'),
                    item: torrents.map(torrent => ({
                      title: torrent.title,
                      category: torrent.category,
                      link: torrent.link,
                      pubDate: torrent.date,
                      size: torrent.size,
                      comments: torrent.comments,
                      seeds: torrent.seeds,
                      peers: torrent.peers,
                      enclosure: {
                        $: {
                          url: torrent.downloadLink,
                          type: 'application/x-bittorrent'
                        }
                      }
                    }))
                  }
                }
              }
              return builder.buildObject(rss)
        }
    }
}

// Kinozal RSS Native
async function KinozalRSS(typeData) {
    const url = "https://kinozal.tv/rss.xml"
    console.log(`${getCurrentTime()} [Request] ${url}`)
    try {
        const response = await axiosProxy.get(url, {
            headers: headers
        })
        if (typeData === "json") {
            const parser = new xml2js.Parser({
                mergeAttrs: true, // Атрибуты элемента XML включаются в список дочерних элементов вместо добавления в отдельный объект с ключом $
                explicitArray: false // Элементы, которые встречаются только один раз, преобразуются в объект, а не в массив
            })
            let json = await parser.parseStringPromise(response.data)
            // Вытаскиваем только item для json
            json = json.rss.channel.item.map(item => ({
                    title: item.title,
                    link: item.link,
                    category: item.category,
                    guid: item.guid,
                    pubDate: item.pubDate
            }))
            return json
        } else {
            return response.data
        }
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `Server is not available` }
    }
}

// RuTor
async function RuTor(query, categoryId, page) {
    let urls = []
    if (query === 'undefined' || !query || query === '' || query.length === 0) {
        urls = [
            `https://rutor.info/browse/${page}/${categoryId}/0/0`,
            `https://rutor.is/browse/${page}/${categoryId}/0/0`
        ]
    } else {
        urls = [
            `https://rutor.info/search/${page}/${categoryId}/300/0/${query}`,
            `https://rutor.is/search/${page}/${categoryId}/300/0/${query}`
        ]
    }
    let checkUrl = false
    const torrents = []
    let html
    let url
    for (const urlQuery of urls) {
        url = urlQuery.replace(/^(https:\/\/rutor\.[a-z]{2,4}).+/, "$1") // подстановочный параметр для рабочего url
        try {
            const response = await axiosProxy.get(urlQuery, {
                timeout: 3000,
                responseType: 'arraybuffer',
                headers: headers
            })
            // Декодируем HTML-страницу в кодировку UTF-8
            html = iconv.decode(response.data, 'utf8')
            checkUrl = true
            console.log(`${getCurrentTime()} [Request] ${urlQuery}`)
            break
        } catch (error) {
            console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        }
    }
    if (!checkUrl) {
        return { 'Result': `Server is not available` }
    }
    const data = cheerio.load(html)
    data('table:eq(2) tbody tr').each((_, element) => {
        const checkData = data(element).find('a:eq(2)')
        if (checkData.length > 0) {
            // Проверяем количетсов элементов 'td'
            const count = data(element).find('td').length
            // Если 5 элементов, то 3-й индекс содержит размер, если 4, то 2-й индекс
            const sizeIndex = count === 5 ? 3 : count === 4 ? 2 : 1
            // Если 5 элементов, то есть комментарии и забираем их количество из 2 индекса
            const comments = count === 5 ? data(element).find('td:eq(2)').text().trim() : count === 5 ? 0 : "0"
            const torrent = {
                'Name': data(element).find('a:eq(2)').text().trim(),
                'Id': parseInt(data(element).find('a:eq(2)').attr('href').replace(/\/torrent\//g, "").replace(/\/.+/g, ""), 10),
                'Url': url + data(element).find('a:eq(2)').attr('href'),
                'Torrent': "https:" + data(element).find('a:eq(0)').attr('href'),
                'Hash': data(element).find('a:eq(1)').attr('href').replace(/.+btih:|&.+/g, ''),
                'Size': data(element).find(`td:eq(${sizeIndex})`).text().trim(),
                'Comments': comments,
                'Seeds': data(element).find('.green').text().trim(),
                'Peers': data(element).find('.red').text().trim(),
                // 'Date': data(element).find('td:eq(0)').text().trim(),
                // Заменяем все символы пробела на обычные пробелы и форматируем дату (передаем пробел вторым параметром разделителя)
                'Date': formatDate(
                    data(element).find('td:eq(0)').text().trim().replace(/\s+/g, ' '),
                    " "
                )
            }
            torrents.push(torrent)
        }
    })
    if (torrents.length === 0) {
        return { 'Result': 'No matches were found for your title' }
    } else {
        return torrents
    }
}

// RuTor All Page
async function RuTorAllPage(query, categoryId) {
    let result = []
    page = 0
    while (true) {
        let currentResult = await RuTor(query, categoryId, page)
        if (Array.isArray(currentResult)) {
            currentResult.forEach(element => {
                result.push(element)
            })
        } else {
            result = [{ 'Result': 'No matches were found for your title' }]
            break
        }
        // Максимум 20 страниц (20 по 100 = 2000 результатов)
        if (currentResult.length === 100 && page < 9) {
            page++
        }
        else {
            break
        }
    }
    return result
}

// RuTor ID
async function RuTorID(query) {
    const url = `https://rutor.info/torrent/${query}`
    let html
    try {
        const response = await axiosProxy.get(url, {
            responseType: 'arraybuffer',
            headers: headers
        })
        html = response.data.toString('utf-8')
        console.log(`${getCurrentTime()} [Request] ${url}`)
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `The ${error.hostname} server is not available` }
    }
    const data = cheerio.load(html)
    let name = data('#all h1').text().trim()
    let torrent_url = 'https:' + data('#download a:eq(1)').attr('href').trim()
    // Hash
    let Hash = data('#download a').attr('href').replace(/magnet:\?xt=urn:btih:|\&dn=.+/g, '').trim()
    // IMDb
    let imdb
    // Ищем во всех элементах "a" атрибут "href" который содержит строку "imdb.com"
    data('a[href*="imdb.com"]').each((index, element) => {
        // Извлекаем значение атрибута href из текущего элемента
        const href = data(element).attr('href')
        // Проверяем, содержит ли значение атрибута href строку "imdb.com"
        if (href.includes('imdb.com')) {
            imdb = href
            // Прерываем цикл после нахождения первого элемента
            return false
        }
    })
    // Если элемент содержащий imdb не найден, возвращаем пустой параметр
    if (!imdb) {
        imdb = ""
    }
    // Kinopoisk
    let kp
    data('a[href*="kinopoisk.ru"]').each((index, element) => {
        const href = data(element).attr('href')
        if (href.includes('kinopoisk.ru')) {
            kp = href
            return false
        }
    })
    if (!kp) {
        kp = ""
    }
    // Определяем порядковый номер индекса с содержимым рейтинга и забираем остальные данные по порядку
    let index
    let test = data('#details > tbody > tr:nth-child(2) > td.header').text()
    if (test == 'Оценка') {
        index = 2
        test = false
    } else {
        test = data('#details > tbody > tr:nth-child(3) > td.header').text()
    }
    if (test == 'Оценка' && test != false) {
        index = 3
        test = false
    }
    let rating = data(`#details > tbody > tr:nth-child(${index}) > td:nth-child(2)`).text()
    let category = data(`#details > tbody > tr:nth-child(${index + 1}) > td:nth-child(2) > a`).text()
    let seeds = data(`#details > tbody > tr:nth-child(${index + 2}) > td:nth-child(2)`).text()
    let peers = data(`#details > tbody > tr:nth-child(${index + 3}) > td:nth-child(2)`).text()
    let seed_date = data(`#details > tbody > tr:nth-child(${index + 4}) > td:nth-child(2)`).text()
    let add_date = data(`#details > tbody > tr:nth-child(${index + 5}) > td:nth-child(2)`).text()
    let size = data(`#details > tbody > tr:nth-child(${index + 6}) > td:nth-child(2)`).text().replace(/\s+/g, ' ')
    // Постер
    let Poster = ''
    const posterElement = data('tbody > tr > td > img').attr('src')
    if (posterElement && posterElement.length) {
        Poster = posterElement
    }
    // Получаем список файлов
    let torrents = []
    // Puppeteer
    if (RuTorPuppeteer == true) {
        torrents = await RuTorFilesPuppeteer(query)
    } else {
        const urlFiles = `https://rutor.info/descriptions/${query}.files`
        try {
            const response = await axiosProxy.get(urlFiles, {
                responseType: 'arraybuffer',
                headers: headers
            })
            // Получаем байты и преобразуем их в строку UTF-8
            html = response.data.toString('utf-8')
            console.log(`${getCurrentTime()} [Request] ${urlFiles}`)
        } catch (error) {
            console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
            return { 'Result': `The ${error.hostname} server is not available` }
        }
        // Оборачиваем строки таблицы в тег <table> для правильного разбора с помощью Cheerio
        const data_files = cheerio.load(`<table>${html}</table>`)
        data_files('tr').each((_, element) => {
            const torrent = {
                'Name': data_files(element).find('td').eq(0).text().trim(),
                'Size': data_files(element).find('td').eq(1).text().replace(/\(.+/g, '').trim().replace(/'\s| |┬а'/g, '')
            }
            torrents.push(torrent)
        })
    }
    if (torrents.length === 0) {
        return { 'Result': 'No matches were found for your ID' }
    } else {
        return [
            {
                Name: name,
                Url: url,
                Hash: Hash,
                Magnet: addTrackerList(Hash,"RuTor"),
                Torrent: torrent_url,
                IMDb_link: imdb,
                Kinopoisk_link: kp,
                IMDb_id: imdb.replace(/[^0-9]/g, ''),
                Kinopoisk_id: kp.replace(/[^0-9]/g, ''),
                Rating: rating,
                Category: category,
                Seeds: seeds,
                Peers: peers,
                Seed_Date: seed_date,
                Add_Date: add_date,
                Size: size,
                Poster: Poster,
                Files: torrents
            }
        ]
    }
}

// RuTor Puppeteer
async function RuTorFilesPuppeteer(query) {
    const torrents = []
    // Запускаем браузер и открываем новую пустую страницу 
    const browser = await puppeteer.launch({
        headless: true // Скрыть отображение браузера (по умолчанию)
    })
    const page = await browser.newPage()
    // Открываем страницу с ожиданием загрузки 60 сек
    await page.goto(`https://rutor.info/torrent/${query}`, {
        timeout: 60000,
        waitUntil: 'domcontentloaded' // ожидать только полной загрузки DOM (не ждать загрузки внешних ресурсов, таких как изображения, стили и скрипты)
    })
    // await page.goto(`https://rutor.info/torrent/970650`, {timeout: 60000})
    await page.evaluate(() => {
        // Находим кнопку по JavaScript пути и нажимаем на нее
        // document.querySelector("#details > tbody > tr:nth-child(11) > td.header > span").click()
        // document.querySelector("#details > tbody > tr:nth-child(12) > td.header > span").click()
        // Находим все кпноки
        const buttons = document.querySelectorAll('span.button')
        // Проходимся по найденным кнопкам
        buttons.forEach(button => {
            // Проверяем, содержит ли кнопка текст "Файлы" и нажимаем на нее
            if (button.textContent.includes('Файлы')) {
                button.click()
            }
        })
    })
    // Дождаться загрузки результатов
    // const elementHandle = await page.waitForSelector('#files')
    // Ищем элемент с идентификатором #files и проверяем, что элемент существует его содержимое не содержит текст загрузки
    await page.waitForFunction(() => {
        const element = document.querySelector('#files')
        return element && !element.textContent.includes("Происходит загрузка списка файлов...")
    }, {
        timeout: 30000, // Ожидать результат 30 секунд
        polling: 50   // Проверка каждые 50мс (по умолчанию 100мс)
    })
    // Забираем результат после успешной проверки
    const elementContent = await page.evaluate(() => {
        const element = document.querySelector('#files')
        return element ? element.textContent : null
    })
    // Закрываем браузер
    await browser.close()
    // Разбиваем на массив из строк исключая первую строку
    const lines = elementContent.trim().split('\n').slice(1)
    // Регулярное выражение для разбиения строки на название и размер
    const regex = /^(.+?)([\d.]+\s*\S+)\s+\((\d+)\)$/
    for (const line of lines) {
        const match = line.match(regex)
        const torrent = {
            'Name': match[1],
            'Size': match[2]
        }
        torrents.push(torrent)
    }
    if (torrents.length === 0) {
        return { 'Result': 'No matches were found for your ID' }
    } else {
        return torrents
    }
}

// RuTor RSS Custom
async function RuTorRssCustom(typeData, categoryId) {
    const url = `https://rutor.info/browse/0/${categoryId}/0/0`
    const torrents = []
    let html
    try {
        const response = await axiosProxy.get(url, {
            responseType: 'arraybuffer',
            headers: headers
        })
        html = iconv.decode(response.data, 'utf8')
        console.log(`${getCurrentTime()} [Request] ${url} (Custom RSS)`)
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `Server is not available` }
    }
    const data = cheerio.load(html)
    data('#ws #index tbody tr').not('.backgr').each((index, element) => {
        const row = data(element)
        // Формируем дату
        let date = formatDate(
            row.find('td:eq(0)').text().trim().replace(/\s+/g, ' '),
            " "
        )
        // Получаем формат: YYYY-MM-DDTHH:MM:SS+00:00
        let dateArray = date.split('.')
        let updateDate = `${dateArray[2]}-${dateArray[1]}-${dateArray[0]}T00:01:00+00:00`
        const torrent = {
            'date': updateDate,
            'title': row.find('td').eq(1).find('a').last().text().trim(),
            'link': 'https://rutor.info' + row.find('td').eq(1).find('a[href^="/torrent"]').attr('href'),
            'downloadLink': 'https://' + row.find('td').eq(1).find('a.downgif').attr('href').replace(/^\//, ''),
            'magnet': row.find('td').eq(1).find('a[href^="magnet:"]').attr('href'),
            'size': '',
            'comments': 0,
            'seeds': 0,
            'peers': 0
        }
        // Обработка размера и комментариев
        const cells = row.find('td')
        // Есть комментарии
        if (cells.length === 5) {
            torrent.size = cells.eq(3).text().trim()
            torrent.comments = parseInt(cells.eq(2).text().match(/\d+/)[0], 10)
        }
        // Нет комментариев
        else if (cells.length === 4) {
            torrent.size = cells.eq(2).text().trim()
        }
        // Обработка сидов и пиров через last (всегда в последней ячейке)
        const lastCell = cells.last()
        torrent.seeds = parseInt(lastCell.find('span.green').text().match(/\d+/)[0] || '0', 10)
        torrent.peers = parseInt(lastCell.find('span.red').text().match(/\d+/)[0] || '0', 10)
        torrents.push(torrent)
    })
    // Получаем параметр описания по категории
    let description = 'Раздачи на главной торрент трекера'
    if (categoryId >= 1 && categoryId <= 17) {
        description = categoryList.RuTor[categoryId]
    }
    if (torrents.length === 0) {
        return { 'Result': `Server is not available` }
    } else {
        if (typeData === "json") {
            return torrents
        } else {
            const builder = new xml2js.Builder()
            const rss = {
                rss: {
                  $: {
                    version: '2.0'
                  },
                  channel: {
                    title: 'Торрент трекер Рутор',
                    link: 'https://rutor.info',
                    description: description,
                    language: 'ru-ru',
                    pubDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toUTCString().replace('GMT', '+0300'),
                    lastBuildDate: new Date(Date.now() + 3 * 60 * 60 * 1000).toUTCString().replace('GMT', '+0300'),
                    item: torrents.map(torrent => ({
                      title: torrent.title,
                      link: torrent.link,
                      guid: torrent.magnet,
                      pubDate: torrent.date,
                      size: torrent.size,
                      comments: torrent.comments,
                      seeds: torrent.seeds,
                      peers: torrent.peers,
                      enclosure: {
                        $: {
                          url: torrent.downloadLink,
                          type: 'application/x-bittorrent'
                        }
                      }
                    }))
                  }
                }
              }
              return builder.buildObject(rss)
        }
    }
}

// RuTor RSS Native
async function RuTorRSS(typeData, categoryId) {
    const url = `https://alt.rutor.info/rss.php?category=${categoryId}` // cat=${categoryId} || full=${categoryId}
    console.log(`${getCurrentTime()} [Request] ${url}`)
    try {
        const response = await axiosProxy.get(url, {
            headers: headers
        })
        if (typeData === "json") {
            const parser = new xml2js.Parser({
                mergeAttrs: true,
                explicitArray: false
            })
            let json = await parser.parseStringPromise(response.data)
            // Вытаскиваем только item для json
            json = json.rss.channel.item.map(item => ({
                title: item.title,
                description: item.description,
                pubDate: item.pubDate,
                link: item.link
            }))
            return json
        } else {
            return response.data
        }
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `Server is not available` }
    }
}

// NoNameClub
async function NoNameClub(query, categoryId, page) {
    if (query === 'undefined') {
        query = ''
    }
    if (categoryId === 0) {
        categoryId = ''
    }
    const p = getPage(page)
    const url = `https://nnmclub.to/forum/tracker.php?nm=${query}&f=${categoryId}&start=${p}`
    const torrents = []
    let html
    try {
        const response = await axiosProxy.get(url, {
            responseType: 'arraybuffer',
            headers: headers
        })
        // Декодируем HTML-страницу в кодировку win-1251
        html = iconv.decode(response.data, 'win1251')
        console.log(`${getCurrentTime()} [Request] ${url}`)
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `The ${error.hostname} server is not available` }
    }
    const data = cheerio.load(html)
    data('.forumline:eq(1) tbody tr').each((_, element) => {
        const checkData = data(element).find('.genmed a b').text().trim()
        if (checkData.length > 0) {
            // Получаем количество элементов с классом 'gensmall'
            const count = data(element).find('.gensmall').length
            // Определяем индекс для выбора размера
            const sizeIndex = count === 4 ? 1 : count === 5 ? 2 : 1
            // Исключаем первый элемент байт из массива (slice(1))
            const size = data(element).find(`.gensmall:eq(${sizeIndex})`).text().trim().split(' ', 3).slice(1).join(' ')
            // Забираем и преобразуем timestamp
            const dataArray = unixTimestamp(
                data(element).find(`.gensmall:eq(${sizeIndex + 2})`).text().trim().split(' ')[0]
            ).split(' ')
            const date = dataArray[0]
            const time = dataArray[1]
            const torrent = {
                'Name': data(element).find('.genmed a b').text().trim(),
                'Id': parseInt(data(element).find('.genmed a').attr('href').replace(/.+t=/, ''), 10),
                'Url': "https://nnmclub.to/forum/" + data(element).find('a:eq(1)').attr('href'),
                'Torrent': "https://nnmclub.to/forum/" + data(element).find('a:eq(3)').attr('href'),
                'Size': size,
                'Comments': data(element).find(`.gensmall:eq(${sizeIndex + 1})`).text().trim(),
                'Category': data(element).find('.gen').text().trim(),
                'Seeds': data(element).find('.seedmed').text().trim(),
                'Peers': data(element).find('.leechmed').text().trim(),
                // Забираем и преобразуем timestamp
                'Time': time,
                'Date': date
            }
            torrents.push(torrent)
        }
    })
    if (torrents.length === 0) {
        return { 'Result': 'No matches were found for your title' }
    } else {
        return torrents
    }
}

// NoNameClub All Page
async function NoNameClubAllPage(query, categoryId) {
    let result = []
    page = 0
    while (true) {
        let currentResult = await NoNameClub(query, categoryId, page)
        if (Array.isArray(currentResult)) {
            currentResult.forEach(element => {
                result.push(element)
            })
        } else {
            result = [{ 'Result': 'No matches were found for your title' }]
            break
        }
        // Максимум 4 страницы
        if (currentResult.length === 50 && page < 3) {
            page++
        }
        else {
            break
        }
    }
    return result
}

// NoNameClub ID
async function NoNameClubID(query) {
    const url = `https://nnmclub.to/forum/viewtopic.php?t=${query}`
    let html
    try {
        const response = await axiosProxy.get(url, {
            responseType: 'arraybuffer',
            headers: headers
        })
        html = iconv.decode(response.data, 'win1251')
        console.log(`${getCurrentTime()} [Request] ${url}`)
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `The ${error.hostname} server is not available` }
    }
    const data = cheerio.load(html)
    let Name = data('body > div.wrap > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td > table:nth-child(2) > tbody > tr > td:nth-child(1) > h1 > a').text().trim()
    // Забираем imdb и kp если они существуют на странице
    let imdb
    data('a[href*="imdb.com"]').each((index, element) => {
        const href = data(element).attr('href')
        if (href.includes('imdb.com')) {
            imdb = href
            return false
        }
    })
    if (!imdb) {
        imdb = ""
    }
    let kp
    data('a[href*="kinopoisk.ru"]').each((index, element) => {
        const href = data(element).attr('href')
        if (href.includes('kinopoisk.ru')) {
            kp = href
            return false
        }
    })
    if (!kp) {
        kp = ""
    }
    // Hash
    let Hash = data('tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td.gensmall > a').attr('href').replace(/.+:/, '')
    // let Magnet = data('tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td.gensmall > a').attr('href')
    // Torrent
    let Torrent = data('tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td.gensmall > span > b > a').attr('href')
    Torrent = `https://nnmclub.to/forum/${Torrent}`
    // Собираем данные со страницы с проверкой наличия по наименованию контейнеров
    // Производство
    const Release = (() => {
        const element = data('tbody > tr:nth-child(1) > td > div > span:contains("Производство:")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Жанр
    // Забираем все элементы "a" содержащие массив, разбиваем их с помощью запятой и объеденям в строку удаляя последнюю запятую
    const Type = data('tbody > tr:nth-child(1) > td > div > a').map((index, element) => {
        return data(element).text().trim()
    }).get().join(', ').replace(/, $/, "")
    // Режиссер
    const Directer = (() => {
        const element = data('tbody > tr:nth-child(1) > td > div > span:contains("Режиссер:")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Актеры
    const Actors = (() => {
        const element = data('tbody > tr:nth-child(1) > td > div > span:contains("Актеры:")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Описание
    const Description = (() => {
        const element = data('tbody > tr:nth-child(1) > td > div > span:contains("Описание:")')[0]
        if (element) {
            // Забираем второй элемент (после <br>)
            const nextNode = element.nextSibling.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Продолжительность
    const Duration = (() => {
        const element = data('tbody > tr:nth-child(1) > td > div > span:contains("Продолжительность:")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Качество видео
    const videoQuality = (() => {
        const element = data('tbody > tr:nth-child(1) > td > div > span:contains("Качество видео:")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Перевод
    const Audio = (() => {
        const element = data('tbody > tr:nth-child(1) > td > div > span:contains("Перевод:")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Video
    const Video = (() => {
        const element = data('tbody > tr:nth-child(1) > td > div > span:contains("Видео:")')[0]
        if (element) {
            const nextNode = element.nextSibling
            return nextNode && nextNode.nodeType === 3 ? nextNode.nodeValue.trim() : ''
        } else {
            return ''
        }
    })()
    // Статические данные (регистрация торрента, рейтинг и размер)
    const Registration = data('tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(3) > td:nth-child(2)').text().trim()
    let Rating = data('tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(5) > td:nth-child(2) > span > span:nth-child(4)').text().trim()
    let ratingNum = Rating.replace(/\s.+/g, '')
    let votesCount = Rating.replace(/.+: /g, '')
    const Size = data('tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(4) > td:nth-child(2) > span:nth-child(1)').text().trim()
    // Постер
    let Poster = ''
    const posterElement = data('.postImg.postImgAligned.img-right').attr('title')
    if (posterElement && posterElement.length) {
        Poster = posterElement
    }
    // Получаем список файлов
    let torrentId = Torrent.replace(/.+id=/, '')
    let urlTorrentFiles = `https://nnmclub.to/forum/filelst.php?attach_id=${torrentId}`
    const torrents = []
    try {
        const response = await axiosProxy.get(urlTorrentFiles, {
            responseType: 'arraybuffer',
            headers: headers
        })
        html = iconv.decode(response.data, 'win1251')
        console.log(`${getCurrentTime()} [Request] ${urlTorrentFiles}`)
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `The ${error.hostname} server is not available` }
    }
    const data_files = cheerio.load(html)
    data_files('tr').each((_, element) => {
        let sizeFile = data_files(element).find('td').eq(2).text().replace(/\(.+/g, '').trim()
        // Проверяем, присутствует ли размер в значение столбца
        if (sizeFile === 'Размер') {
            sizeFile = 'Directory'
        }
        const torrent = {
            'Name': data_files(element).find('td').eq(1).text().trim(),
            'Size': sizeFile
        }
        torrents.push(torrent)
    })
    return [
        {
            Name: Name,
            Url: url,
            Hash: Hash,
            Magnet: addTrackerList(Hash,"NoNameClub"),
            Torrent: Torrent,
            IMDb_link: imdb,
            Kinopoisk_link: kp,
            IMDb_id: imdb.replace(/[^0-9]/g, ''),
            Kinopoisk_id: kp.replace(/[^0-9]/g, ''),
            Release: Release,
            Type: Type,
            Directer: Directer,
            Actors: Actors,
            Description: Description,
            Duration: Duration.replace(/~/, ''),
            Quality: videoQuality,
            Video: Video,
            Audio: Audio,
            Registration: Registration,
            Rating: ratingNum,
            Votes: votesCount,
            Size: Size,
            Poster: Poster,
            Files: torrents
        }
    ]
}

// NoNameClub RSS Native
async function NoNameClubRSS(typeData, categoryId) {
    const url = `https://nnmclub.to/forum/rss.php?f=${categoryId}`
    console.log(`${getCurrentTime()} [Request] ${url}`)
    try {
        const response = await axiosProxy.get(url, {
            responseType: 'arraybuffer',
            headers: headers
        })
        if (typeData === "json") {
            data = iconv.decode(response.data, 'win1251')
            const parser = new xml2js.Parser({
                mergeAttrs: true,
                explicitArray: false
            })
            let json = await parser.parseStringPromise(data)
            // Вытаскиваем только item для json
            json = json.rss.channel.item.map(item => ({
                turbo: item.turbo,
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                description: item.description,
                content: item["turbo:content"],
                creator: item["dc:creator"],
                commentRss: item["wfw:commentRss"],
                comments: item["slash:comments"],
                enclosure: item.enclosure
            }))
            return json
        }
        else {
            data = iconv.decode(response.data, 'win1251')
            return data
        }
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `Server is not available` }
    }
}

// FastsTorrent
async function FastsTorrent(query) {
    const url = `http://fasts-torrent.net/engine/ajax/search_torrent.php?title=${query}`
    const torrents = []
    let html
    try {
        html = await axiosProxy.get(url, {
            responseType: 'arraybuffer',
            headers: headers
        })
        console.log(`${getCurrentTime()} [Request] ${url}`)
    } catch (error) {
        console.error(`${getCurrentTime()} [ERROR] ${error.hostname} server is not available (Code: ${error.code})`)
        return { 'Result': `The ${error.hostname} server is not available` }
    }
    const data = cheerio.load(html.data)
    data('.restable tbody tr').each((_, element) => {
        const torrent = {
            'Name': data(element).find('.torrent-title b').text().trim().replace(/\s+/, ' '),
            'Size': data(element).find('.torrent-sp').eq(0).text().trim(),
            'Torrent': "http://fasts-torrent.net" + data(element).find('.torrent-d-btn a').attr('href')
        }
        torrents.push(torrent)
    })
    if (torrents.length === 0) {
        return { 'Result': 'No matches were found for your title' }
    } else {
        return torrents
    }
}

// Список провайдеров для конечной точки /api/provider/list
const providerList = [
    {
        "Provider": "RuTracker",
        "Urls": [
            "https://rutracker.org",
            "https://rutracker.net",
            "https://rutracker.nl"
        ]
    },
    {
        "Provider": "Kinozal",
        "Urls": [
            "https://kinozal.tv",
            "https://kinozal.me",
            "https://kinozal.guru"
        ]
    },
    {
        "Provider": "RuTor",
        "Urls": [
            "https://rutor.info",
            "https://rutor.is"
        ]
    },
    {
        "Provider": "NoNameClub",
        "Urls": [
            "https://nnmclub.to"
        ]
    }
]

// Test API Endpoints
async function testEndpoints(query) {
    let testQuery = query || "The Rookie"
    // Проверяем RSS
    const RuTrackerRssResult = await RuTrackerRSS("json", 0)
    const RuTrackerRssCheck = Array.isArray(RuTrackerRssResult) && RuTrackerRssResult.length > 0 && RuTrackerRssResult[0].link && RuTrackerRssResult[0].title
    const KinozalRssResult = await KinozalRssCustom("json", 0, 0, 0)
    const KinozalRssCheck = Array.isArray(KinozalRssResult) && KinozalRssResult.length > 0 && KinozalRssResult[0].link && KinozalRssResult[0].title
    // const RuTorRssResult = await RuTorRss("json", 0)
    const RuTorRssResult = await RuTorRssCustom("json", 0)
    const RuTorRssCheck = Array.isArray(RuTorRssResult) && RuTorRssResult.length > 0 && RuTorRssResult[0].link && RuTorRssResult[0].title
    const NoNameClubRssResult = await NoNameClubRSS("json", 0)
    const NoNameClubRssCheck = Array.isArray(NoNameClubRssResult) && NoNameClubRssResult.length > 0 && NoNameClubRssResult[0].link && NoNameClubRssResult[0].title

    // Проверяем поиск по Title
    let startTime = performance.now()
    const RuTrackerResult = await RuTracker(testQuery, 0, 0)
    let endTime = performance.now()
    const RuTrackerCheck = Array.isArray(RuTrackerResult) && RuTrackerResult.length > 0 && RuTrackerResult[0].Name && RuTrackerResult[0].Id && RuTrackerResult[0].Url
    // Фиксируем время выполнения функции
    const RuTrackerRunTime = ((endTime - startTime) / 1000).toFixed(3)
    console.log(`${getCurrentTime()} [DEBUG] RuTracker ID: ${RuTrackerResult[0].Id}`)

    startTime = performance.now()
    const KinozalResult = await Kinozal(testQuery, 0, 0, 0, 0)
    const KinozalCheck = Array.isArray(KinozalResult) && KinozalResult.length > 0 && KinozalResult[0].Name && KinozalResult[0].Id && KinozalResult[0].Url
    endTime = performance.now()
    const KinozalRunTime = ((endTime - startTime) / 1000).toFixed(3)
    console.log(`${getCurrentTime()} [DEBUG] Kinozal ID: ${KinozalResult[0].Id}`)

    startTime = performance.now()
    const RuTorResult = await RuTor(testQuery, 0, 0)
    const RuTorCheck = Array.isArray(RuTorResult) && RuTorResult.length > 0 && RuTorResult[0].Name && RuTorResult[0].Id && RuTorResult[0].Url
    endTime = performance.now()
    const RuTorRunTime = ((endTime - startTime) / 1000).toFixed(3)
    console.log(`${getCurrentTime()} [DEBUG] RuTor ID: ${RuTorResult[0].Id}`)
    
    startTime = performance.now()
    const NoNameClubResult = await NoNameClub(testQuery, 0, 0)
    const NoNameClubCheck = Array.isArray(NoNameClubResult) && NoNameClubResult.length > 0 && NoNameClubResult[0].Name && NoNameClubResult[0].Id && NoNameClubResult[0].Url
    endTime = performance.now()
    const NoNameClubRunTime = ((endTime - startTime) / 1000).toFixed(3)
    console.log(`${getCurrentTime()} [DEBUG] NoNameClub ID: ${NoNameClubResult[0].Id}`)

    // Проверяем поиск по полученному id из запроса Title
    let RuTrackerIdCheck = false
    let RuTrackerIdCheckFiles = false
    startTime = performance.now()
    if (RuTrackerCheck) {
        const RuTrackerIdResult = await RuTrackerID(RuTrackerResult[0].Id)
        RuTrackerIdCheck = Array.isArray(RuTrackerIdResult) && 
            RuTrackerIdResult.length > 0 && 
            RuTrackerIdResult[0].Name && 
            RuTrackerIdResult[0].Url &&
            RuTrackerIdResult[0].Hash &&
            RuTrackerIdResult[0].Magnet &&
            RuTrackerIdResult[0].Torrent
        // Проверяем содержимое файлов
        if (RuTrackerIdCheck) {
            RuTrackerIdCheckFiles = RuTrackerIdResult[0].Files[0].Name
        }
    }
    endTime = performance.now()
    const RuTrackerIdRunTime = ((endTime - startTime) / 1000).toFixed(3)

    let KinozalIdCheck = false
    let KinozalIdCheckFiles = false
    startTime = performance.now()
    if (KinozalCheck) {
        const KinozalIdResult = await KinozalID(KinozalResult[0].Id)
        KinozalIdCheck = Array.isArray(KinozalIdResult) && 
            KinozalIdResult.length > 0 && 
            KinozalIdResult[0].Name && 
            KinozalIdResult[0].Url &&
            KinozalIdResult[0].Hash &&
            KinozalIdResult[0].Magnet &&
            KinozalIdResult[0].Torrent
        if (KinozalIdCheck) {
            KinozalIdCheckFiles = KinozalIdResult[0].Files[0].Name
        }
    }
    endTime = performance.now()
    const KinozalIdRunTime = ((endTime - startTime) / 1000).toFixed(3)

    let RuTorIdCheck = false
    let RuTorIdCheckFiles = false
    startTime = performance.now()
    if (RuTorCheck) {
        const RuTorIdResult = await RuTorID(RuTorResult[0].Id)
        RuTorIdCheck = Array.isArray(RuTorIdResult) && 
            RuTorIdResult.length > 0 && 
            RuTorIdResult[0].Name && 
            RuTorIdResult[0].Url &&
            RuTorIdResult[0].Hash &&
            RuTorIdResult[0].Magnet &&
            RuTorIdResult[0].Torrent
        if (RuTorIdCheck) {
            RuTorIdCheckFiles = RuTorIdResult[0].Files[0].Name
        }
    }
    endTime = performance.now()
    const RuTorIdRunTime = ((endTime - startTime) / 1000).toFixed(3)

    let NoNameClubIdCheck = false
    let NoNameClubIdCheckFiles = false
    startTime = performance.now()
    if (NoNameClubCheck) {
        const NoNameClubIdResult = await NoNameClubID(NoNameClubResult[0].Id)
        NoNameClubIdCheck = Array.isArray(NoNameClubIdResult) && 
            NoNameClubIdResult.length > 0 && 
            NoNameClubIdResult[0].Name && 
            NoNameClubIdResult[0].Url &&
            NoNameClubIdResult[0].Hash &&
            NoNameClubIdResult[0].Magnet &&
            NoNameClubIdResult[0].Torrent
        if (NoNameClubIdCheck) {
            NoNameClubIdCheckFiles = NoNameClubIdResult[0].Files[0].Name
        }
    }
    endTime = performance.now()
    const NoNameClubIdRunTime = ((endTime - startTime) / 1000).toFixed(3)
    
    // Объединяем результаты в один массив
    const Results = [
        {
            RSS: {
                RuTracker: RuTrackerRssCheck ? true : false,
                Kinozal: KinozalRssCheck ? true : false,
                RuTor: RuTorRssCheck ? true : false,
                NoNameClub: NoNameClubRssCheck ? true : false
            },
            Title: {
                Status: {
                    RuTracker: RuTrackerCheck ? true : false,
                    Kinozal: KinozalCheck ? true : false,
                    RuTor: RuTorCheck ? true : false,
                    NoNameClub: NoNameClubCheck ? true : false
                },
                Id: {
                    RuTracker: RuTrackerResult[0].Id ? parseInt(RuTrackerResult[0].Id, 10) : null,
                    Kinozal: KinozalResult[0].Id ? parseInt(KinozalResult[0].Id, 10) : null,
                    RuTor: RuTorResult[0].Id ? parseInt(RuTorResult[0].Id, 10) : null,
                    NoNameClub: NoNameClubResult[0].Id ? parseInt(NoNameClubResult[0].Id, 10) : null
                },
                RunTime: {
                    RuTracker: parseFloat(RuTrackerRunTime),
                    Kinozal: parseFloat(KinozalRunTime),
                    RuTor: parseFloat(RuTorRunTime),
                    NoNameClub: parseFloat(NoNameClubRunTime)
                }
            },
            Id: {
                Status: {
                    RuTracker: RuTrackerIdCheck ? true : false,
                    Kinozal: KinozalIdCheck ? true : false,
                    RuTor: RuTorIdCheck ? true : false,
                    NoNameClub: NoNameClubIdCheck ? true : false
                },
                Files: {
                    RuTracker: RuTrackerIdCheckFiles ? true : false,
                    Kinozal: KinozalIdCheckFiles ? true : false,
                    RuTor: RuTorIdCheckFiles ? true : false,
                    NoNameClub: NoNameClubIdCheckFiles ? true : false
                },
                RunTime: {
                    RuTracker: parseFloat(RuTrackerIdRunTime),
                    Kinozal: parseFloat(KinozalIdRunTime),
                    RuTor: parseFloat(RuTorIdRunTime),
                    NoNameClub: parseFloat(NoNameClubIdRunTime)
                }
            }
        }
    ]
    return Results
}

// Создание экземпляра Express
const web = express()

// CORS (Cross-Origin Resource Sharing) для использования в расширение OpenKinopoisk (https://github.com/Lifailon/OpenKinopoisk)
// const cors = require('cors')
// const corsOptions = {
//     origin: '*', // Разрешает запросы с любого домена (*)
//     methods: 'GET', // Разрешенные методы
//     allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept' // Разрешенные заголовки
// }
// web.use(cors(corsOptions))

web.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Methods", "GET")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    return next()
})

// Опции для Swagger
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TorAPI',
            version: '0.5.2',
            description: 'Unofficial API (backend) for RuTracker, Kinozal, RuTor and NoNameClub',
            contact: {
                name: "© Lifailon (Alex Kup)",
                url: "https://github.com/Lifailon/TorAPI"
            },
            license: {
                name: "License MIT",
                url: "https://github.com/Lifailon/TorAPI/blob/main/LICENSE"
            }
        },
        servers: [
            {
              url: 'http://localhost:8443',
              description: 'Local server'
            },
            {
                url: 'https://torapi.vercel.app',
                description: 'Production server (main)'
            },
            {
                url: 'https://toruapi.vercel.app',
                description: 'Production server (mirror)'
            },
            {
                url: 'https://rutorapi.vercel.app',
                description: 'Production server (mirror)'
            }
        ]
    },
    apis: ['./swagger/swagger.js']
}

// Генерация спецификации Swagger
const specs = swaggerJsdoc(options)

// Конечная точка для Swagger UI
web.use('/docs', swaggerUi.serve, swaggerUi.setup(specs))

// Обработка всех остальных конечных точек
web.all('/:api?/:category?/:type?/:provider?', async (req, res) => {
    // Проверяем методы (пропускаем только GET без учета регистра)
    if (req.method.toLowerCase() !== 'get') {
        console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [405] Method not available. Endpoint: ${req.path}`)
        return res.status(405).send(`Method not available`)
    }
    // Обработка параметров из заголовка запроса
    let query = req.query.query
    let categoryId = req.query.category
    let page = req.query.page
    let year = req.query.year
    let format = req.query.format
    // Обработка тип данных из тела запроса
    const headerAccept = req.get('Accept')
    // Кодируем запрос в формат URL (заменяется последовательностью процентов и двумя шестнадцатеричными числами, представляющими ASCII-код символа в кодировке UTF-8)
    query = encodeURIComponent(query)
    // Если необязательные параметры не были переданы или заданы неверно, присваиваем им значения по умолчанию
    if (!page || (page !== 'all' && isNaN(page))) {
        page = 0
    }
    if (!categoryId || !/^[0-9]+$/.test(categoryId)) {
        categoryId = 0
    }
    if (!year || !/^[0-9]{4}$/.test(year)) {
        year = 0
    }
    if (format === 720 || format === '720') {
        format = 3002
    }
    else if (format === 1080 || format === '1080') {
        format = 3001
    }
    else if (format === 2160 || format === '2160') {
        format = 7
    } else {
        format = 0
    }
    // Обработка path-параметров
    let endpoint = req.params.api
    // Проверяем стартовую конечную точку
    if (endpoint !== 'api') {
        console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [404] Endpoint not found. Endpoint: ${req.path}`)
        return res.status(404).send('Endpoint not found')
    }
    // Проверяем второй обязательный path-параметр: provider, get или search
    let category = req.params.category?.toLowerCase()
    if (category !== 'provider' && category !== 'get' && category !== 'search') {
        console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [404] Endpoint not found. Endpoint: ${req.path}`)
        return res.status(404).send('Endpoint not found')
    }
    // Проверяем третий path-параметр (list/check/test для provider, category/rss для get, title/id для search)
    let type = req.params.type
    if (type === undefined) {
        console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [404] Endpoint not found. Endpoint: ${req.path}`)
        return res.status(404).send('Endpoint not found')
    }
    // Конечная точка, возвращающая список провайдеров
    if (category === "provider" && type === "list") {
        console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [200] Endpoint: ${req.path}`)
        return res.json(providerList)
    }
    // Конечная точка для проверки доступности провайдеров (только поиск по Title)
    if (category === "provider" && type === "check") {
        console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [200] Endpoint: ${req.path}`)
        const testQuery = "The Rookie"
        try {
            const RuTrackerResult = await RuTracker(testQuery, 0, 0)
            const RuTrackerCheck = Array.isArray(RuTrackerResult) && RuTrackerResult.length > 0 && RuTrackerResult[0].Name && RuTrackerResult[0].Id && RuTrackerResult[0].Url
            const KinozalResult = await Kinozal(testQuery, 0, 0, 0, 0)
            const KinozalCheck = Array.isArray(KinozalResult) && KinozalResult.length > 0 && KinozalResult[0].Name && KinozalResult[0].Id && KinozalResult[0].Url
            const RuTorResult = await RuTor(testQuery, 0, 0)
            const RuTorCheck = Array.isArray(RuTorResult) && RuTorResult.length > 0 && RuTorResult[0].Name && RuTorResult[0].Id && RuTorResult[0].Url
            const NoNameClubResult = await NoNameClub(testQuery, 0, 0)
            const NoNameClubCheck = Array.isArray(NoNameClubResult) && NoNameClubResult.length > 0 && NoNameClubResult[0].Name && NoNameClubResult[0].Id && NoNameClubResult[0].Url
            const Results = [
                {
                    RuTracker: RuTrackerCheck ? true : false,
                    Kinozal: KinozalCheck ? true : false,
                    RuTor: RuTorCheck ? true : false,
                    NoNameClub: NoNameClubCheck ? true : false
                }
            ]
            return res.json(Results)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json({ Result: 'No data' })
        }
    }
    // Конечная точка проверки доступности всех конечных точек (RSS, поиск по Title и ID)
    if (category === "provider" && type === "test") {
        console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [200] Endpoint: ${req.path}`)
        try {
            const result = await testEndpoints(query)
            return res.json(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // Отвечаем, если 3-й параметр type не валидный, что бы пропустить к основным маршрутам
    if (type !== "title" && type !== "id" && type !== "rss" && type !== "category") {
        console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [404] Endpoint not found. Endpoint: ${req.path}`)
        return res.status(404).send('Endpoint not found')
    }
    // Проверяем последний обязательный параметр имени провайдера
    let provider = req.params.provider
    if (provider === undefined) {
        console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [404] Endpoint not found. Endpoint: ${req.path}`)
        return res.status(404).send('Endpoint not found')
    }
    // Проверяем, что номер категории соответствует хотя бы одному из ключей массива, или сбрасываем ее
    if (categoryId !== 0) {
        if (
            !Object.keys(categoryList.RuTracker).includes(categoryId) && !Object.keys(categoryList.Kinozal).includes(categoryId) &&
            !Object.keys(categoryList.RuTor).includes(categoryId) && !Object.keys(categoryList.NoNameClub).includes(categoryId)
        ) {
            categoryId = 0
        }
    }
    // Логируем запросы
    console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [200] Endpoint: ${req.path}`)
    // Проверяем конечные точки провайдеров
    // ALL
    if (type === 'title' && provider === 'all') {
        try {
            let Results
            if (page === 'all') {
                // Параллельное выполнение
                // const [
                //     RuTrackerResult,
                //     KinozalResult,
                //     RuTorResult,
                //     NoNameClubResult
                // ] = await Promise.allSettled([
                //     RuTrackerAllPage(query, categoryId),
                //     KinozalAllPage(query, categoryId, year, format),
                //     RuTorAllPage(query, categoryId),
                //     NoNameClubAllPage(query, categoryId)
                // ])
                // Results = {
                //     RuTracker: RuTrackerResult.value,
                //     Kinozal: KinozalResult.value,
                //     RuTor: RuTorResult.value,
                //     NoNameClub: NoNameClubResult.value
                // }
                // Синхронное выполнение
                const RuTrackerResult = await RuTrackerAllPage(query, categoryId)
                const KinozalResult = await KinozalAllPage(query, categoryId, year, format)
                const RuTorResult = await RuTorAllPage(query, categoryId)
                const NoNameClubResult = await NoNameClubAllPage(query, categoryId)
                // Объединяем результаты в один массив
                Results = {
                    RuTracker: RuTrackerResult,
                    Kinozal: KinozalResult,
                    RuTor: RuTorResult,
                    NoNameClub: NoNameClubResult
                }
            }
            else {
                const [
                    RuTrackerResult,
                    KinozalResult,
                    RuTorResult,
                    NoNameClubResult
                ] = await Promise.all([
                    RuTracker(query, categoryId, page),
                    Kinozal(query, categoryId, page, year, format),
                    RuTor(query, categoryId, page),
                    NoNameClub(query, categoryId, page)
                ])
                Results = {
                    RuTracker: RuTrackerResult,
                    Kinozal: KinozalResult,
                    RuTor: RuTorResult,
                    NoNameClub: NoNameClubResult
                }
            }
            return res.json(Results)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json({ Result: 'No data' })
        }
    }
    // Возвращаем список категорий
    else if (category === 'get' && type === 'category') {
        if (provider === "rutracker") {
            console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [200] Endpoint: ${req.path}`)
            return res.json([categoryList.RuTracker])
        }
        else if (provider === "kinozal") {
            console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [200] Endpoint: ${req.path}`)
            return res.json([categoryList.Kinozal])
        }
        else if (provider === "rutor") {
            console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [200] Endpoint: ${req.path}`)
            return res.json([categoryList.RuTor])
        }
        else if (provider === "nonameclub") {
            console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [200] Endpoint: ${req.path}`)
            return res.json([categoryList.NoNameClub])
        } else {
            console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [404] Provider ${provider} not found`)
            return res.status(404).send(`Provider ${provider} not found`)
        }
    }
    // RuTracker Title
    else if (type === 'title' && provider === 'rutracker') {
        try {
            let result
            if (page === 'all') {
                result = await RuTrackerAllPage(query, categoryId)
            }
            else {
                result = await RuTracker(query, categoryId, page)
            }
            return res.json(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // RuTracker ID
    else if (type === 'id' && provider === 'rutracker') {
        try {
            const result = await RuTrackerID(query)
            return res.json(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // RuTracker RSS Native
    else if (category === 'get' && type === 'rss' && provider === 'rutracker') {
        try {
            let result
            if (headerAccept && headerAccept.includes('json')) {
                result = await RuTrackerRSS("json", categoryId)
                res.set('Content-Type', 'application/json')
            }
            else {
                result = await RuTrackerRSS("xml", categoryId)
                res.set('Content-Type', 'application/xml')
            }
            return res.send(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // Kinozal Title
    else if (type === 'title' && provider === 'kinozal') {
        try {
            let result
            if (page === 'all') {
                result = await KinozalAllPage(query, categoryId, year, format)
            }
            else {
                result = await Kinozal(query, categoryId, page, year, format)
            }
            return res.json(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // Kinozal ID
    else if (type === 'id' && provider === 'kinozal') {
        try {
            const result = await KinozalID(query)
            return res.json(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // Kinozal RSS Custom
    else if (category === 'get' && type === 'rss' && provider === 'kinozal') {
        try {
            let result
            if (headerAccept && headerAccept.includes('json')) {
                // result = await KinozalRSS("json")
                result = await KinozalRssCustom("json", categoryId, year, format)
                res.set('Content-Type', 'application/json')
            }
            else {
                // result = await KinozalRSS("xml")
                result = await KinozalRssCustom("xml", categoryId, year, format)
                res.set('Content-Type', 'application/xml')
            }
            return res.send(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // RuTor Title
    else if (type === 'title' && provider === 'rutor') {
        try {
            let result
            if (page === 'all') {
                result = await RuTorAllPage(query, categoryId)
            }
            else {
                result = await RuTor(query, categoryId, page)
            }
            return res.json(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // RuTor ID
    else if (type === 'id' && provider === 'rutor') {
        try {
            const result = await RuTorID(query)
            return res.json(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // RuTor RSS Custom
    else if (category === 'get' && type === 'rss' && provider === 'rutor') {
        try {
            let result
            if (headerAccept && headerAccept.includes('json')) {
                // result = await RuTorRSS("json", categoryId)
                result = await RuTorRssCustom("json", categoryId)
                res.set('Content-Type', 'application/json')
            }
            else {
                // result = await RuTorRSS("xml", categoryId)
                result = await RuTorRssCustom("xml", categoryId)
                res.set('Content-Type', 'application/xml')
            }
            return res.send(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // NoNameClub Title
    else if (type === 'title' && provider === 'nonameclub') {
        try {
            let result
            if (page === 'all') {
                result = await NoNameClubAllPage(query, categoryId)
            }
            else {
                result = await NoNameClub(query, categoryId, page)
            }
            return res.json(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // NoNameClub ID
    else if (type === 'id' && provider === 'nonameclub') {
        try {
            const result = await NoNameClubID(query)
            return res.json(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // NoNameClub RSS Native
    else if (category === 'get' && type === 'rss' && provider === 'nonameclub') {
        try {
            let result
            if (headerAccept && headerAccept.includes('json')) {
                result = await NoNameClubRSS("json", categoryId)
                res.set('Content-Type', 'application/json')
            }
            else {
                result = await NoNameClubRSS("xml", categoryId)
                res.set('Content-Type', 'application/xml')
            }
            return res.send(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // FastsTorrent
    else if (type === 'title' && provider === 'faststorrent') {
        try {
            const result = await FastsTorrent(query)
            return res.json(result)
        } catch (error) {
            console.error("Error:", error)
            return res.status(400).json(
                { Result: 'No data' }
            )
        }
    }
    // Отвечаем, если провайдер не найден 
    else {
        console.log(`${getCurrentTime()} [${req.method}] ${req.ip.replace('::ffff:', '')} (${req.headers['user-agent']}) [404] Provider ${provider} not found`)
        return res.status(404).send(`Provider ${provider} not found`)
    }
})

// Экспорт Express как serverless функцию для Vercel
module.exports = web

// Запуск Express
const port = argv.port
const server = web.listen(port)
console.log(`Server is running on port: ${port}`)

// Локальное тестирование с последующим завершением
function testRequest() {
    axios.get(`http://localhost:${port}/api/provider/test?query=${argv.query}`)
        .then(response => {
            const prettyJson = JSON.stringify(response.data, null, 4)
            console.log(prettyJson)
            server.close(() => {
                console.log('Server closed')
            })
        })
        .catch(error => {
            console.error(`Error: ${error}`)
            server.close(() => {
                console.log('Server closed after error')
            })
        })
}

if (argv.test) {
    JSON.stringify(testRequest(), null, 4)
}