<p align="center">
    <b>🚌 Oma matkakortti (OMK) API</b>
</p>
<p align="center">
    <a href="https://travis-ci.org/jolle/omk"><img src="https://travis-ci.org/jolle/omk.svg?branch=master" alt="Build Status"></a>
</p>
<p align="center">
    <sup><b>Unofficial</b> oma matkakortti API for Node.js</sup>
</p>

<a href="https://omamatkakortti.hsl.fi/">Oma matkakortti</a> is a web service that allows HSL (Helsingin Seudun Liikenne) users to get information about their travel cards. This is an unofficial Node.js API for getting (and possibly setting in the future) information using the web service.

Please note that this library cannot (yet) add new cards, so you should that manually in the <a href="https://omamatkakortti.hsl.fi/Account/Login">web portal</a>.

## Usage
A simple example:
```js
const OMK = require('omk');

const omk = new OMK();

omk.login('test', 'test') // change these
.then(() => omk.getCards())
.then((cards) => {
    console.log(`Cards: ${cards.map(a => `${a.id} (${a.name})`).join(', ')}\n`);
    return cards;
})
.then((cards) => Promise.all(cards.map(card => omk.getCard(card.id))))
.then((cardInfos) => {
    cardInfos.forEach((card) => {
        console.log(`Card #${card.id}:`);
        console.log(`\tBalance: ${card.balance}`);
        console.log(`\tName: ${card.name}`);
        console.log(`\tSeason: ${card.rawSeason.replace(/\n|\r/g, ' ')}`);
        console.log(`\t\tParsed season: ${JSON.stringify(card.season)}`);
    });
})
.catch(console.error);
```

## Methods

### login(username, password) ⇒ <code>Promise</code>

Logs the user in with an username and a password. Resolves on successful login.

#### Parameters
| Name   | Type                | Description  |
| ------ | ------------------- | ------------ |
| username  | <code> string </code> | username of the user |
| password | <code> string </code> | password of the user |

### getCards() ⇒ <code>Promise&lt;Array&lt;Object&gt;&gt;</code>

Fetches all the cards of the user and caches them for next time.

**Note**: Even though the array has objects with lots of information, only `id` and `name` are accurate; others are bogus.

### getCard(id) ⇒ <code>Promise&lt;Object&gt;</code>

gets information about a specific card

#### Parameters
| Name   | Type                | Description  |
| ------ | ------------------- | ------------ |
| id  | <code> string </code> | the id of the card |
