
/**
 * Module dependencies.
 */

var api = require('./routes/api')
  , ejs = require('ejs')
  , fs = require('fs')
  , momath = require('./routes/momath')
  , nodemailer = require('nodemailer')
  , secrets = require('./private/secrets').secrets
  , util = require('util');

var EXHIBIT_IDS = ['MTHN.OD', 'HUTR.OD', 'LOGE.OD', 'POPA.OD', 'TIFA.OD'];

function GetDailyPersonVisits(date, callback) {
  api.request('status', 'active-visit-list', [], {'date': date}, null, function(visits_json) {
    var person_visit_map = {};

    var visit_info_list = visits_json.VisitList.VisitInfo;
    visit_info_list.forEach(function(visit_info) {
      var visit_id = visit_info.ID;
      var person_id = visit_info["PersonID"];
      if (person_id) {
        visits = person_visit_map[person_id];
        if (!visits) {
          visits = [];
          person_visit_map[person_id] = visits;
        }
        visits.push(visit_id);
      }
    });
    callback(person_visit_map);
  });
}

function GetDailyPersonsWithEmail(date, callback) {
  api.request('status', 'active-person-list', [], {'date': date}, null, function(persons_json) {
    var person_infos_with_email = [];

    var person_infos = persons_json.PersonList.PersonInfo;
    person_infos.forEach(function(person_info) {
      if (person_info["Email"]) {
        person_infos_with_email.push(person_info);
      }
    });
    callback(person_infos_with_email);
  });
}

function GetBlobs(visit_id, callback) {
  for (var i in EXHIBIT_IDS) {
    var exhibit_id = EXHIBIT_IDS[i];
    api.request('content', 'exhibit-blob-list', [exhibit_id, visit_id], {}, null, function(blobs_json) {
      var exhibit_bob_list = blobs_json.ExhibitBlobList;
      var blobs = exhibit_bob_list["Blob"]; // May be missing if no blobs
      if (blobs) {
        // A single entry looks doesn't end up in an array in the json.
        blobs = Array.isArray(blobs) ? blobs : [blobs];
        var blob_ids = [];
        for (var j in blobs) {
          var blob_id = blobs[j].ID;
          blob_ids.push(blob_id);
        }
        callback(visit_id, exhibit_bob_list.ExhibitID, blob_ids);
      }
    });
  }
}

function main() {
  var date = process.env.DATE;
  console.log("Looking up creations for " + date);

  var email_template = fs.readFileSync('./public/templates/daily-email.ejs', 'utf8');

  var smtpTransport = nodemailer.createTransport("SMTP", {
    host: secrets.SMTP_SERVER,
    auth: {
        user: secrets.SMTP_USER,
        pass: secrets.SMTP_PASSWORD
    }
  });

  GetDailyPersonVisits(date, function(person_visit_map) {
    // Filter out persons that don't have an email attached.
    GetDailyPersonsWithEmail(date, function(person_infos) {
      person_infos.forEach(function(person_info) {
        var person_id = person_info.ID;
        var email = person_info.Email;
        var visit_ids = person_visit_map[person_id];
        if (!email || !visit_ids) {
          return;
        }

        visit_ids.forEach(function(visit_id) {
          var pi_local = person_info;
          GetBlobs(visit_id, function(visit_id2, exhibit_id, blob_ids) {
            if (!blob_ids) {
              return;
            }

            var full_name = ((pi_local.FirstName || '') + ' ' + (pi_local.LastName || '')).trim();
            email_content = ejs.render(email_template, {
              'date': date,
              'email': pi_local.Email,
              'name': full_name,
              'url': 'http://localhost:3000/#creation/TODO',
              'blob_ids': blob_ids
            });

            var mailOptions = {
              from: "MoMath <my@momath.org>", // sender address
              subject: "Your latest creations from MoMath", // Subject line
              to: full_name + " <smike.dev@gmail.com>",
              // TODO(smike): Only uncomment when ready for production.
              // to: full_name + " <" + pi_local.Email + ">",
              text: email_content
            };

            smtpTransport.sendMail(mailOptions, function (error, response) {
              if (error){
                console.log(error);
              } else{
                console.log("Message sent: " + response.message);
              }
            });
            console.log(email_content);
//            console.log(util.format('Blobs for %s %s (%s): %s',
//                pi_local.FirstName || '', pi_local.LastName || '', pi_local.Email, blob_ids));
          });
        });
      });
    });
  });
}

main();

