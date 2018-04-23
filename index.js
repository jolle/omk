const request = require('request-promise').defaults({ // eslint-disable-line
    headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:51.0) Gecko/20100101 Firefox/51.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    jar: true,
    transform: (body, response, resolveWithFullResponse) => response.statusCode === 302 ? body : (resolveWithFullResponse ? response : body), // eslint-disable-line
    simple: false,
});
const cheerio = require('cheerio');

module.exports = class OMK {
    /**
     * login - logs the user in with an username and a password
     *
     * @param  {string} username
     * @param  {string} password
     * @return {Promise}          resolves on successful login
     */
    login(username, password) {
        return request.get('https://omamatkakortti.hsl.fi/')
            .then(body => cheerio.load(body))
            .then($ => $('[name="__RequestVerificationToken"]').val())
            .then(__RequestVerificationToken => request({
                uri: 'https://omamatkakortti.hsl.fi/',
                method: 'POST',
                form: {
                    __RequestVerificationToken,
                    UserName: username,
                    Password: password,
                    LoginButton: 'Kirjaudu',
                },
                headers: {
                    Referer: 'https://omamatkakortti.hsl.fi/Account/Login',
                },
            }));
    }


    /**
     * getCards - fetches all the cards of the user and caches them for next time
     *
     * @return {Promise<Array<Object>>}  resolves with an array of objects of cards
     */
    getCards() {
        return request.get('https://omamatkakortti.hsl.fi/Shop').then(body => JSON.parse(body.match(/ETUILE\.CARD_DETAILS = ETUILE\.dotnet\.parseJSON\('(.*)'\);/)[1]));
    }


    /**
     * getCard - gets information about a specific card
     *
     * @param  {String} id the id of the card
     * @return {Promise<Object>}    resolves with an object of information
     */
    getCard(id) {
        return request({
            url: 'https://omamatkakortti.hsl.fi/Shop/SelectCard',
            method: 'POST',
            json: {
                lang: 'fi',
                id,
                name: 'undefined',
            },
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                Referer: 'https://omamatkakortti.hsl.fi/Cards',
                Accept: 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/json; charset=utf-8',
            },
        })
            .then(() => request.get(`https://omamatkakortti.hsl.fi/Cards/CardInfo?CardNumber=${id}&_=${Date.now()}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Referer: 'https://omamatkakortti.hsl.fi/Cards',
                    Accept: 'text/html, */*; q=0.01',
                },
            }))
            .then(body => cheerio.load(body))
            .then(($) => {
                const rawSeason = $('label[for="PeriodOnCard"]')
                    .closest('tr')
                    .find('td')
                    .last()
                    .find('p')
                    .first()
                    .text()
                    .trim()
                    .split('\n')
                    .map(a => a.trim())
                    .join('\n');

                return {
                    balance: $('label[for="Balance"]')
                        .closest('tr')
                        .find('td.cards_info_row_gap')
                        .last()
                        .text()
                        .trim(),
                    name: $('#cardName')
                        .val()
                        .trim(),
                    rawSeason,
                    season: this.parseSeason(rawSeason),
                    id,
                };
            });
    }

    parseSeason(season) {
        const regexp = /Voimassa oleva kausilippu ([A-Z()0-9\s-]+) ([A-Z]+)\n([0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,4}) - ([0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,4})/;
        const matches = season.match(regexp);

        const users = {
            'lapsi (7-16v)': 'child (7-16yr)',
            aikuinen: 'adult',
        };

        const areas = {
            seutu: 'regional',
            'lähiseutu 2': 'region two-zone',
            'lähiseutu 3': 'region three-zone',
        };

        return season === 'Matkakortilla ei ole kausilippuja.' || !regexp.test(season) || matches.length !== 5 ? ({
            season: false,
        }) : ({
            season: true,
            user: users[matches[1].toLowerCase()] || matches[1].toLowerCase(),
            area: areas[matches[2].toLowerCase()] || matches[2].toLowerCase(),
            start: matches[3],
            end: matches[4],
        });
    }
};
