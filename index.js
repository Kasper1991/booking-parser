const request = require('request');
const notifier = require('node-notifier');

const apiHost = 'http://booking.uz.gov.ua/ru/purchase/search/';

const from = [
  {
    id: 2200200,
    name: 'Винница'
  },
  {
    id: 2200270,
    name: 'Жмеринка'
  }
];

const to = [
  {
    id: 2218000,
    name: 'Львов'
  },
  {
    id: 2218200,
    name: 'Ивано-Франковск'
  }
];

const dates = [
  {
    date: '23.08.2017',
    timeFrom: '20:00'
  },
  {
    date: '24.08.2017',
    timeFrom: '00:00',
    timeTo: 8
  }
];

const run = () => {

  const promises = [];

  from.forEach((from) => {

    to.forEach((to) => {

      dates.forEach((date) => {

        const promise = new Promise((resolve) => {

          request.post({
            url: apiHost,
            form: {
              station_id_from: from.id,
              station_id_till: to.id,
              station_from: from.name,
              station_till: to.name,
              date_dep: date.date,
              time_dep: date.timeFrom,
              time_dep_till: '',
              another_ec: 0,
              search: ''
            }
          }, (err, resp, body) => {
            body = JSON.parse(body);

            if (err || body.error) {
              return resolve([]);
            }

            const trains = body
                .value
                .map((train) => {
                  const date = new Date(train.from.src_date);

                  return {
                    from: train.from.station,
                    to: train.till.station,
                    date: date,
                    text: from.name + ' ===> ' + to.name + ' : ' + date.toDateString()
                  }
                })
                .filter((train) => {
                  return date.timeTo ? date.timeTo >= train.date.getHours() : true;
                });

            resolve(trains);
          })
        });

        promises.push(promise);
      })
    })
  });

  Promise
      .all(promises)
      .then((allTrains) => {
        return allTrains
            .filter((trains) => !!trains.length)
            .reduce((allTrains, trains) => {
              return allTrains.concat(trains);
            }, [])
      })
      .then((trains) => {
        if (trains.length) {

          console.log(trains);

          notifier.notify({
            'title': 'Есть поезд!',
            'message': trains.map(({text}) => text).join('\n')
          });
        }
      });
};

run();
setInterval(run, 1000 * 60 * 5);