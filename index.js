var ocrad = require('ocrad.js');
var cheerio = require('cheerio');
var request = require('request');
var Canvas = require('canvas');
var columnify = require('columnify');

var args = Array.from(process.argv).slice(2);
if (args.length === 0) {
    console.log('Usage: node ./index.js suburb name');
    process.exit();
}

var suburb = args.map(arg => { return arg.trim().toLowerCase(); }).join('-');

// Getting page
request('https://www.realestate.com.au/auction-results/nsw', (error, response, body) => {
    var $ = cheerio.load(body);
    var $table = $(`#${suburb}`);

    if (!$table.length) {
        console.log(`Can't find suburb for ${suburb}`);
        process.exit();
    }

    // Find the table
    var results = [], total = 0, cleared = 0;
    $table.find('tbody tr').each((index, el) => {
        var $row = $(el);
        total++;

        var result = $row.find('.col-auction-result').text();
        if (result.toLowerCase().indexOf('sold') !== -1) {
            cleared++;
        }

        results.push({
            address: $row.find('.col-address').text(),
            price: base64ToText($row.find('.col-property-price img').attr('src')).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
            result: result,
            date: base64ToText($row.find('.col-auction-date img').attr('src')).match(/\d{2}/g).join('/')
        });
    });

    console.log(`Total: ${total}, Cleared: ${cleared}, Rate: ${(cleared / total).toFixed(2)*100}%`);
    console.log(columnify(results, {minWidth: 20}));
});

function base64ToText(base64String) {
    var image = new Canvas.Image();
    image.src = base64String;
    var width = image.width;
    var height = image.height;

    var c = new Canvas(width, height);
    var ctx = c.getContext('2d');
    ctx.rect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.drawImage(image, 0, 0, width, height);

    return ocrad(c, { numeric: true }).replace(/\s/g, '');
}
